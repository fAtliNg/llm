import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR, RESULTS_DIR } from '../paths.ts';
import type { RunResult, ToolEvent } from '../types.ts';
import { convert, type Example } from './convert.ts';

/**
 * Applies the dataset selection rules (docs/12-dataset.md) to converted examples:
 *  - solved runs only, workspace changed;
 *  - the last tool call is a green verify; anything after it is trimmed;
 *  - no failed edit/write calls, no absolute paths, no /tmp, no `cd`;
 *  - bounded length. Bash "errors" from grep/find with no matches are benign and allowed.
 * Prints a report of what was kept and why the rest was dropped.
 */
const VERIFY = /npm run (verify|test|typecheck|lint)|vitest|tsc\b|eslint/;
const BENIGN_BASH_ERROR = /^\s*(grep|rg|find|ls|cat|test|\[)\b/;

export interface SelectOptions {
  runIds: string[];
  captured: string;
  maxTurns?: number;
  minTurns?: number;
  /** Target share of Russian-prompt examples (0..1). Russian examples are all kept; English ones are sampled down. */
  ruShare?: number;
}

function isRussian(example: Example): boolean {
  const user = example.messages.find((m) => m.role === 'user')?.content ?? '';
  const cyrillic = (user.match(/[а-яё]/gi) ?? []).length;
  return cyrillic > user.length * 0.2;
}

interface Verdict {
  keep: boolean;
  reason: string;
  repaired: boolean;
}

function verdict(example: Example, result: RunResult, maxTurns: number, minTurns: number): Verdict {
  const tl = result.agent.timeline;
  const failedEdits = tl.filter((e) => !e.ok && (e.tool === 'edit' || e.tool === 'write')).length;
  // A red verify followed by a fix is the repair loop we want, so verify commands never count here.
  const badBash = tl.filter((e) => !e.ok && e.tool === 'bash' && !BENIGN_BASH_ERROR.test(e.target) && !VERIFY.test(e.target)).length;
  // Absolute paths inside the workspace are normalized away later; only foreign ones disqualify.
  const absolute = tl.filter((e) => /\/Users\/|\/home\//.test(e.target.split(result.workspace).join(''))).length;
  const tmp = tl.filter((e) => /\/tmp\//.test(e.target)).length;
  const cd = tl.filter((e) => e.tool === 'bash' && /^\s*cd\s/.test(e.target) && !e.target.trim().startsWith(`cd ${result.workspace}`)).length;
  const verifies = tl.filter((e) => e.tool === 'bash' && VERIFY.test(e.target));
  const lastVerify = verifies.at(-1);
  const repaired = verifies.length >= 2;
  if (!result.grade.solved) return { keep: false, reason: `not solved (${result.grade.failureReason ?? '?'})`, repaired };
  if (example.messages[1]?.role !== 'user') return { keep: false, reason: 'no user turn', repaired };
  if (result.diagnostics?.changedFiles.length === 0) return { keep: false, reason: 'no changes', repaired };
  if (!lastVerify) return { keep: false, reason: 'never ran verify', repaired };
  if (!lastVerify.ok) return { keep: false, reason: 'last verify was red', repaired };
  if (failedEdits > 0) return { keep: false, reason: `${String(failedEdits)} failed edits`, repaired };
  if (badBash > 0) return { keep: false, reason: `${String(badBash)} failing bash commands`, repaired };
  if (absolute > 0) return { keep: false, reason: 'absolute paths', repaired };
  if (tmp > 0) return { keep: false, reason: 'used /tmp', repaired };
  if (cd > 0) return { keep: false, reason: 'used cd', repaired };
  if (result.agent.turns > maxTurns) return { keep: false, reason: `too long (${String(result.agent.turns)} turns)`, repaired };
  if (result.agent.turns < minTurns) return { keep: false, reason: `too short (${String(result.agent.turns)} turns)`, repaired };
  return { keep: true, reason: 'ok', repaired };
}

/** Cuts everything after the last green verify, keeping the closing assistant summary. */
function trimTail(example: Example, timeline: ToolEvent[]): Example {
  const verifies = timeline.filter((e) => e.tool === 'bash' && VERIFY.test(e.target));
  const last = verifies.at(-1);
  if (!last) return example;
  const messages = example.messages;
  // Find the assistant message whose tool call is the last verify (matched by command text).
  let cutAt = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i]!;
    if (m.role === 'assistant' && m.tool_calls?.some((c) => c.function.name === 'bash' && c.function.arguments.includes(last.target.slice(0, 60)))) {
      cutAt = i;
      break;
    }
  }
  if (cutAt < 0 || cutAt + 1 >= messages.length) return example;
  const kept = messages.slice(0, cutAt + 2); // assistant(verify call) + its tool result
  const finalText = [...messages].reverse().find((m) => m.role === 'assistant' && !m.tool_calls && m.content.trim())?.content ?? 'Done. Verification passed.';
  kept.push({ role: 'assistant', content: finalText });
  return { ...example, messages: kept, meta: { ...example.meta, turns: kept.filter((m) => m.role === 'assistant').length } };
}

/**
 * Rewrites absolute workspace paths to relative ones in every message and tool call, and
 * replaces the remaining machine-specific prefixes from the system prompt (Pi docs under
 * node_modules, the capture workspace) with a neutral /workspace root.
 */
function normalizePaths(example: Example, workspace: string): Example {
  const prefixSlash = `${workspace}/`;
  const fix = (text: string) =>
    text
      .split(prefixSlash)
      .join('')
      .split(workspace)
      .join('.')
      .split(`${BENCH_DIR}/.work/capture`)
      .join('/workspace/app')
      .split(BENCH_DIR)
      .join('/workspace');
  return {
    ...example,
    messages: example.messages.map((m) => ({
      ...m,
      content: fix(m.content),
      ...(m.tool_calls
        ? { tool_calls: m.tool_calls.map((c) => ({ ...c, function: { ...c.function, arguments: fix(c.function.arguments) } })) }
        : {}),
    })),
  };
}

/** Strips ANSI colour codes from tool results so the student does not learn terminal noise. */
function stripAnsi(example: Example): Example {
  const clean = (t: string) => t.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
  return { ...example, messages: example.messages.map((m) => (m.role === 'tool' ? { ...m, content: clean(m.content) } : m)) };
}

/** Long markdown summaries with headings are cut to their first paragraph; the student should report briefly. */
function shortenReport(example: Example): Example {
  const messages = [...example.messages];
  const last = messages.at(-1);
  if (!last || last.role !== 'assistant' || last.tool_calls) return example;
  const text = last.content.trim();
  if (text.length <= 600 && !/^#{1,3} /m.test(text)) return example;
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.replace(/^#{1,3} .*$/m, '').trim()).filter(Boolean);
  const first = paragraphs[0] ?? text;
  messages[messages.length - 1] = { role: 'assistant', content: first.length > 600 ? `${first.slice(0, 600).trim()}…` : first };
  return { ...example, messages };
}

/** `cd <workspace> && cmd` is harmless once paths are relative: the prefix is dropped rather than the whole run. */
function stripWorkspaceCd(example: Example, workspace: string): Example {
  const re = new RegExp(`^\\s*cd\\s+${workspace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?\\s*(&&|;)\\s*`);
  return {
    ...example,
    messages: example.messages.map((m) =>
      m.tool_calls
        ? {
            ...m,
            tool_calls: m.tool_calls.map((c) => {
              if (c.function.name !== 'bash') return c;
              const args = JSON.parse(c.function.arguments) as { command?: string };
              if (typeof args.command !== 'string') return c;
              return { ...c, function: { ...c.function, arguments: JSON.stringify({ ...args, command: args.command.replace(re, '') }) } };
            }),
          }
        : m,
    ),
  };
}

export function select(options: SelectOptions): { kept: Example[]; report: string } {
  const maxTurns = options.maxTurns ?? Number(process.env.MAX_TURNS ?? '30');
  const minTurns = options.minTurns ?? 2;
  const examples = convert({ runIds: options.runIds, captured: options.captured, solvedOnly: false });
  const kept: Example[] = [];
  const reasons = new Map<string, number>();
  let repairedKept = 0;
  for (const example of examples) {
    const file = path.join(RESULTS_DIR, example.meta.runId, example.meta.config, example.meta.task, String(example.meta.rep), 'result.json');
    const result = JSON.parse(fs.readFileSync(file, 'utf8')) as RunResult;
    const v = verdict(example, result, maxTurns, minTurns);
    reasons.set(v.reason, (reasons.get(v.reason) ?? 0) + 1);
    if (!v.keep) continue;
    if (v.repaired) repairedKept += 1;
    kept.push(shortenReport(stripAnsi(normalizePaths(stripWorkspaceCd(trimTail(example, result.agent.timeline), result.workspace), result.workspace))));
  }
  let balanced = kept;
  const ru = kept.filter(isRussian);
  const en = kept.filter((e) => !isRussian(e));
  if (options.ruShare !== undefined && ru.length > 0 && options.ruShare > 0 && options.ruShare < 1) {
    const enTarget = Math.round((ru.length * (1 - options.ruShare)) / options.ruShare);
    // Deterministic sample: every k-th English example.
    const step = en.length > enTarget ? en.length / enTarget : 1;
    const sampled = en.length > enTarget ? Array.from({ length: enTarget }, (_, i) => en[Math.floor(i * step)]!) : en;
    balanced = [...ru, ...sampled];
  }
  const lines = [`examples: ${String(examples.length)}, kept: ${String(kept.length)} (ru ${String(ru.length)}, en ${String(en.length)}), after language balancing: ${String(balanced.length)}, with a repair loop: ${String(repairedKept)} (${examples.length ? String(Math.round((100 * repairedKept) / Math.max(kept.length, 1))) : '0'}% of kept)`, 'reasons:'];
  for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) lines.push(`  ${reason.padEnd(32)} ${String(count)}`);
  return { kept: balanced, report: lines.join('\n') };
}

if (process.argv[1]?.endsWith('select.ts')) {
  const [runIds = 'teacher-v1', outFile = 'dataset/train.jsonl', ruShareArg] = process.argv.slice(2);
  const { kept, report } = select({
    runIds: runIds.split(','),
    captured: 'dataset/student-request.json',
    ...(ruShareArg ? { ruShare: Number(ruShareArg) } : {}),
  });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, kept.map((e) => JSON.stringify(e)).join('\n') + (kept.length ? '\n' : ''));
  console.log(report);
  console.log(`written ${String(kept.length)} examples to ${outFile}`);
}
