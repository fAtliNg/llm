import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LlmBackend } from '../llm/types.js';
import { describeApplyOutcome } from '../prompt/edit-format/apply.js';
import { parseSearchReplace } from '../prompt/edit-format/search-replace.js';
import { splitReply } from '../prompt/parser.js';
import { healerSystemPrompt, healerUserPrompt } from '../prompt/templates/healer.js';
import type { StackProfile } from '../prompt/stack-profile.js';
import { affectedFiles } from '../tools/diagnostics.js';
import type { EditorTool } from '../tools/editor.js';
import type { VerificationReport } from '../tools/types.js';
import type { AgentEventSink } from './types.js';

export interface HealerDeps {
  root: string;
  backend: LlmBackend;
  editor: EditorTool;
  profile: StackProfile;
  temperature: number;
  maxTokens: number;
  /** Cap on files pulled in for a repair turn — the context window is still 16k. */
  maxFilesInContext: number;
  emit: AgentEventSink;
}

export type HealResult =
  { status: 'edited'; paths: string[] } | { status: 'failed'; reason: string };

/**
 * One repair turn: feed a failed gate's own output back to the model.
 *
 * The key move is choosing context from the diagnostics rather than from the task — the file the
 * compiler is complaining about is frequently not the file the agent just edited.
 */
export async function heal(report: VerificationReport, deps: HealerDeps): Promise<HealResult> {
  const paths = affectedFiles(report.diagnostics).slice(0, deps.maxFilesInContext);
  const files: Array<{ path: string; content: string }> = [];

  for (const relative of paths) {
    try {
      files.push({
        path: relative,
        content: await readFile(path.resolve(deps.root, relative), 'utf8'),
      });
    } catch {
      // A diagnostic can name a path outside the project (a .d.ts in node_modules). Skip it.
    }
  }

  const result = await deps.backend.complete({
    messages: [
      { role: 'system', content: healerSystemPrompt(deps.profile) },
      {
        role: 'user',
        content: healerUserPrompt({
          command: report.command ?? report.failedGate ?? 'verification',
          diagnostics: report.diagnostics,
          rawOutput: truncateOutput(report.rawOutput),
          files,
        }),
      },
    ],
    temperature: deps.temperature,
    maxTokens: deps.maxTokens,
  });
  deps.emit({ type: 'token-usage', ...result.usage });

  const { thinking, body } = splitReply(result.text);
  if (thinking) deps.emit({ type: 'thinking', text: thinking });

  const parsed = parseSearchReplace(body);
  if (parsed.edits.length === 0) {
    return { status: 'failed', reason: 'The model proposed no edits for the reported errors.' };
  }

  const applied = await deps.editor.applyBatch(parsed.edits);
  if (!applied.allApplied) {
    return {
      status: 'failed',
      reason: applied.outcomes
        .filter((outcome) => outcome.status !== 'applied')
        .map(describeApplyOutcome)
        .join('\n'),
    };
  }

  deps.emit({ type: 'edits-applied', paths: applied.written });
  return { status: 'edited', paths: applied.written };
}

/** A failing test suite can print megabytes; only the head carries the signal. */
function truncateOutput(output: string, maxLines = 60): string {
  const lines = output.split('\n');
  if (lines.length <= maxLines) return output;
  return [...lines.slice(0, maxLines), `… ${lines.length - maxLines} more lines omitted`].join(
    '\n',
  );
}
