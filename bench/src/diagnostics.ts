import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { HIDDEN_TESTS_DIR, TEMPLATE_DIR } from './paths.ts';
import type { AgentMetrics, Diagnostics, Grade, Task, ToolEvent } from './types.ts';
import { listFiles } from './workspace.ts';

const READ_LIKE = /^\s*(cat|head|tail|sed -n|grep|rg|less|find|ls|tree|wc)\b/;
const VERIFY = /npm run (verify|test|typecheck|lint)|vitest|tsc|eslint/;
const EXCLUDED = new Set(['node_modules', 'dist', 'coverage', '.DS_Store']);

function hash(file: string): string {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
}

/** Baseline the agent started from: the template with the task's setup overlay applied. */
function baselineHashes(task: Task): Map<string, string> {
  const relevant = (relative: string) => !relative.split(path.sep).some((part) => EXCLUDED.has(part));
  const hashes = new Map<string, string>();
  for (const file of listFiles(TEMPLATE_DIR).filter(relevant)) {
    hashes.set(file, hash(path.join(TEMPLATE_DIR, file)));
  }
  if (task.hasSetup) {
    const setupDir = path.join(task.dir, 'setup');
    for (const file of listFiles(setupDir)) hashes.set(file, hash(path.join(setupDir, file)));
  }
  return hashes;
}

/** Files that differ from the baseline: modified, added, or deleted. */
export function changedFiles(workspace: string, task: Task): string[] {
  const relevant = (relative: string) =>
    !relative.split(path.sep).some((part) => EXCLUDED.has(part)) && !relative.startsWith(HIDDEN_TESTS_DIR);
  const before = baselineHashes(task);
  const after = new Set(listFiles(workspace).filter(relevant));
  const changed: string[] = [];
  for (const file of after) {
    const previous = before.get(file);
    if (previous === undefined) changed.push(`+ ${file}`);
    else if (previous !== hash(path.join(workspace, file))) changed.push(`~ ${file}`);
  }
  for (const file of before.keys()) if (!after.has(file)) changed.push(`- ${file}`);
  return changed.sort();
}

function label(event: ToolEvent): string {
  if (event.tool !== 'bash') return event.tool;
  if (VERIFY.test(event.target)) return 'bash(verify)';
  if (READ_LIKE.test(event.target)) return 'bash(read)';
  return 'bash';
}

/** "bash(read)×12 → read → edit → bash(verify)" with runs of equal labels collapsed. */
export function shape(timeline: ToolEvent[]): string {
  const parts: string[] = [];
  let current = '';
  let count = 0;
  const flush = () => {
    if (count > 0) parts.push(count > 1 ? `${current}×${String(count)}` : current);
  };
  for (const event of timeline) {
    const next = label(event) + (event.ok ? '' : '!');
    if (next === current) count += 1;
    else {
      flush();
      current = next;
      count = 1;
    }
  }
  flush();
  return parts.join(' → ');
}

function topErrors(timeline: ToolEvent[]): string[] {
  const counts = new Map<string, number>();
  for (const event of timeline) {
    if (event.ok || !event.error) continue;
    const key = event.error.replace(/\/Users\/[^\s'"]+/g, '<abs>').slice(0, 120);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([message, count]) => (count > 1 ? `${String(count)}× ${message}` : message));
}

/** Heuristic observations: what the agent wasted effort on, useful for shaping the dataset. */
export function comments(task: Task, agent: AgentMetrics, grade: Grade, changed: string[]): string[] {
  const out: string[] = [];
  const timeline = agent.timeline;
  const minutes = agent.wallSeconds / 60;
  const bashReads = timeline.filter((e) => e.tool === 'bash' && READ_LIKE.test(e.target)).length;
  const reads = agent.toolCalls.read ?? 0;
  const edits = (agent.toolCalls.edit ?? 0) + (agent.toolCalls.write ?? 0);
  const editErrors = timeline.filter((e) => !e.ok && (e.tool === 'edit' || e.tool === 'write')).length;
  const absolute = timeline.filter((e) => /\/Users\/|\/home\//.test(e.target)).length;
  const tmp = timeline.filter((e) => /\/tmp\//.test(e.target)).length;
  const commands = timeline.filter((e) => e.tool === 'bash').map((e) => e.target);
  const repeated = commands.length - new Set(commands).size;
  const cdOut = timeline.filter((e) => e.tool === 'bash' && /^\s*cd\s/.test(e.target)).length;

  if (agent.timedOut) out.push(`Timed out after ${minutes.toFixed(0)} min without finishing.`);
  if (agent.exitCode !== 0 && !agent.timedOut) out.push(`Agent exited with code ${String(agent.exitCode)}.`);
  if (timeline.length === 0) out.push('No tool calls at all: the model answered in prose.');
  if (edits === 0 && timeline.length > 0) out.push('Never edited or wrote a file.');
  if (bashReads >= 3 && bashReads > reads) {
    out.push(`Read files through bash ${String(bashReads)} times (cat/grep/sed) versus ${String(reads)} read calls.`);
  }
  if (editErrors > 0) out.push(`${String(editErrors)} failed edit/write calls (wrong path or oldText not found).`);
  if (absolute >= 3) out.push(`Used absolute paths in ${String(absolute)} calls; the tools take paths relative to the project.`);
  if (tmp > 0) out.push(`Wrote or read /tmp files ${String(tmp)} times instead of working in the project.`);
  if (repeated >= 3) out.push(`Repeated identical bash commands ${String(repeated)} times.`);
  if (cdOut >= 2) out.push(`Changed directory ${String(cdOut)} times; the cwd is already the project.`);
  if (agent.verifyRuns === 0 && timeline.length > 0) out.push('Never ran the verification (npm run verify / tests).');
  if (agent.verifyRuns >= 4) out.push(`Ran verification ${String(agent.verifyRuns)} times.`);
  if (agent.firstEditAt !== null && agent.firstEditAt > 180) {
    out.push(`First edit only after ${(agent.firstEditAt / 60).toFixed(1)} min of exploration.`);
  }
  if (agent.lastEditAt !== null && agent.wallSeconds - agent.lastEditAt > 180) {
    out.push(`Kept working ${((agent.wallSeconds - agent.lastEditAt) / 60).toFixed(1)} min after the last edit.`);
  }
  if (agent.turns > 30) out.push(`${String(agent.turns)} turns for a difficulty ${String(task.difficulty)} task.`);
  if (agent.inputTokens > 500_000) {
    out.push(`${(agent.inputTokens / 1e6).toFixed(2)}M input tokens processed: the context grew large and was re-sent every turn.`);
  }

  const solutionFiles = task.hasSolution ? listFiles(path.join(task.dir, 'solution')) : [];
  const touched = new Set(changed.map((entry) => entry.slice(2)));
  const missed = solutionFiles.filter((file) => !touched.has(file));
  if (!grade.solved && missed.length > 0 && missed.length < solutionFiles.length) {
    out.push(`Did not touch files the reference solution changes: ${missed.join(', ')}.`);
  }
  if (!grade.solved && changed.length === 0) out.push('Workspace unchanged: nothing was delivered.');
  if (changed.length > solutionFiles.length + 2) {
    out.push(`Changed ${String(changed.length)} files, the reference solution changes ${String(solutionFiles.length)}.`);
  }

  if (grade.failureReason === 'typecheck') out.push('Result does not typecheck: see typecheck.log.');
  if (grade.failureReason === 'broke-existing-tests') out.push('Broke existing tests: see tests.log.');
  if (grade.failureReason === 'wrong-behavior') out.push('Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.');
  if (grade.failureReason === 'structure') out.push(`Structural checks failed: ${grade.checks.failures.join('; ')}.`);
  if (grade.failureReason === 'weak-tests') out.push(`Tests too weak, surviving mutants: ${grade.mutants.survived.join(', ')}.`);
  if (grade.failureReason === 'lint' || grade.failureReason === 'format') {
    out.push(`Only ${grade.failureReason} failed: the code works but ignores project conventions.`);
  }
  if (grade.solved && minutes > 10) out.push('Solved, but slowly.');
  if (grade.solved && agent.turns <= 8) out.push('Clean run: few turns, straight to the edit.');
  return out;
}

export function diagnose(workspace: string, task: Task, agent: AgentMetrics, grade: Grade): Diagnostics {
  const changed = changedFiles(workspace, task);
  return {
    changedFiles: changed,
    shape: shape(agent.timeline),
    topErrors: topErrors(agent.timeline),
    comments: comments(task, agent, grade, changed),
  };
}

/** Markdown summary of one run, written next to result.json. */
export function analysisMarkdown(result: {
  task: Task;
  config: string;
  rep: number;
  agent: AgentMetrics;
  grade: Grade;
  diagnostics: Diagnostics;
}): string {
  const { task, agent, grade, diagnostics } = result;
  const stages = (['typecheck', 'lint', 'format', 'tests', 'hidden'] as const)
    .map((stage) => `${stage}=${grade[stage].ok ? 'ok' : 'FAIL'}`)
    .join(' ');
  const tools = Object.entries(agent.toolCalls)
    .map(([name, count]) => `${name} ${String(count)}`)
    .join(', ');
  return [
    `# ${task.id} · ${result.config} · rep ${String(result.rep)}`,
    '',
    `**${grade.solved ? 'SOLVED' : `FAILED (${grade.failureReason ?? '?'})`}** in ${(agent.wallSeconds / 60).toFixed(1)} min, ${String(agent.turns)} turns, tools: ${tools || 'none'}, errors: ${String(agent.toolErrors)}.`,
    '',
    `Stages: ${stages}; checks ${grade.checks.ok ? 'ok' : 'FAIL'}; mutants ${grade.mutants.ok ? 'ok' : 'FAIL'}.`,
    '',
    `Shape: ${diagnostics.shape || '(no tool calls)'}`,
    '',
    '## Observations',
    ...(diagnostics.comments.length ? diagnostics.comments.map((c) => `- ${c}`) : ['- none']),
    '',
    '## Tool errors',
    ...(diagnostics.topErrors.length ? diagnostics.topErrors.map((e) => `- ${e}`) : ['- none']),
    '',
    '## Changed files',
    ...(diagnostics.changedFiles.length ? diagnostics.changedFiles.map((f) => `- ${f}`) : ['- none']),
    '',
    '## Final message',
    agent.finalMessage || '(empty)',
    '',
  ].join('\n');
}
