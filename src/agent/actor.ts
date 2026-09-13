import type { ContextManager } from '../context/manager.js';
import type { ContextBundle } from '../context/types.js';
import type { LlmBackend, Message } from '../llm/types.js';
import { describeApplyOutcome } from '../prompt/edit-format/apply.js';
import { describeParseErrors, parseSearchReplace } from '../prompt/edit-format/search-replace.js';
import { splitReply, type PlanStep } from '../prompt/parser.js';
import { actorSystemPrompt, actorUserPrompt } from '../prompt/templates/actor.js';
import { NO_CHANGES_SENTINEL } from '../prompt/templates/edit-format.js';
import type { StackProfile } from '../prompt/stack-profile.js';
import type { FileEdit } from '../prompt/edit-format/types.js';
import type { EditorTool } from '../tools/editor.js';
import type { AgentEventSink } from './types.js';

export interface ActorDeps {
  backend: LlmBackend;
  context: ContextManager;
  editor: EditorTool;
  profile: StackProfile;
  temperature: number;
  maxTokens: number;
  /** How many times to re-ask when the reply is malformed or the edits do not apply. */
  maxFormatRetries: number;
  emit: AgentEventSink;
}

export type ActResult =
  | { status: 'applied'; paths: string[] }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string };

/**
 * Second half of the loop: turn one plan step into edits on disk.
 *
 * Format failures are handled here rather than in the outer loop, because they are a different
 * kind of failure from a compile error. A malformed block means the model misunderstood the
 * protocol; the fix is to restate the protocol with the specific complaint, not to re-plan.
 */
export async function act(task: string, step: PlanStep, deps: ActorDeps): Promise<ActResult> {
  deps.emit({ type: 'phase', phase: 'editing' });
  deps.emit({ type: 'step-started', step });

  const context = await deps.context.assemble({
    task: `${task}\n${step.description}`,
    pinned: step.files,
    maxRankedFiles: 2,
  });

  const messages: Message[] = [
    { role: 'system', content: actorSystemPrompt(deps.profile) },
    { role: 'user', content: actorUserPrompt({ task, step: step.description, context }) },
  ];

  for (let attempt = 1; attempt <= deps.maxFormatRetries + 1; attempt += 1) {
    const result = await deps.backend.complete({
      messages,
      temperature: deps.temperature,
      maxTokens: deps.maxTokens,
    });
    deps.emit({ type: 'token-usage', ...result.usage });

    if (result.truncated) {
      return {
        status: 'failed',
        reason:
          'The model hit its output limit mid-edit. Raise model.maxOutputTokens or split the step.',
      };
    }

    const { thinking, body } = splitReply(result.text);
    if (thinking) deps.emit({ type: 'thinking', text: thinking });

    // Only honoured after a genuine attempt, because the sentinel is only offered after one.
    if (attempt > 1 && body.trim().toUpperCase().startsWith(NO_CHANGES_SENTINEL)) {
      return { status: 'skipped', reason: 'the step is already satisfied by the current code' };
    }

    const parsed = parseSearchReplace(body);
    if (parsed.errors.length > 0) {
      const complaint = describeParseErrors(parsed.errors);
      deps.emit({ type: 'edits-rejected', reasons: [complaint], attempt });
      messages.push(
        { role: 'assistant', content: result.text },
        {
          role: 'user',
          content: `Your reply could not be parsed:\n${complaint}\n\nReply again using only correctly formatted SEARCH/REPLACE blocks.`,
        },
      );
      continue;
    }

    const unknown = unknownPaths(parsed.edits, context);
    if (unknown.length > 0) {
      // The model regularly echoes a path out of the prompt's own example. Catching it here
      // turns an edit against a fictional file into one specific, correctable complaint.
      const complaint = `These paths are not files you were shown: ${unknown.join(', ')}. Use a path from a "### " heading, or leave SEARCH empty to create a genuinely new file.`;
      deps.emit({ type: 'edits-rejected', reasons: [complaint], attempt });
      messages.push(
        { role: 'assistant', content: result.text },
        { role: 'user', content: complaint },
      );
      continue;
    }

    const applied = await deps.editor.applyBatch(parsed.edits);
    if (applied.allApplied) {
      deps.emit({ type: 'edits-applied', paths: applied.written });
      return { status: 'applied', paths: applied.written };
    }

    const failures = applied.outcomes.filter((outcome) => outcome.status !== 'applied');
    const reasons = failures.map(describeApplyOutcome);
    deps.emit({ type: 'edits-rejected', reasons, attempt });

    // Text that cannot be found is the one failure that plausibly means "already done", so that
    // is the only case where the step may be declared satisfied.
    const escape = failures.every((outcome) => outcome.status === 'not-found')
      ? `\n\nIf the file already contains the change this step asks for, reply with exactly ${NO_CHANGES_SENTINEL} instead.`
      : '';

    messages.push(
      { role: 'assistant', content: result.text },
      {
        role: 'user',
        content: `None of your edits were written, because some of them did not apply:\n${reasons.join('\n')}\n\nSend the complete corrected set of blocks.${escape}`,
      },
    );
  }

  return {
    status: 'failed',
    reason: `The model could not produce applicable edits in ${deps.maxFormatRetries + 1} attempts.`,
  };
}

/** Edits to existing text may only target files the model was actually shown. */
function unknownPaths(edits: FileEdit[], context: ContextBundle): string[] {
  const visible = new Set(context.files.map((file) => file.path));
  return [
    ...new Set(
      edits
        .filter((edit) => edit.search !== '' && !visible.has(edit.path))
        .map((edit) => edit.path),
    ),
  ];
}
