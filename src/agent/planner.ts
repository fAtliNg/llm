import type { ContextManager } from '../context/manager.js';
import type { LlmBackend } from '../llm/types.js';
import { parsePlan, splitReply, type PlanStep } from '../prompt/parser.js';
import { plannerSystemPrompt, plannerUserPrompt } from '../prompt/templates/planner.js';
import type { StackProfile } from '../prompt/stack-profile.js';
import type { AgentEventSink } from './types.js';

export interface PlannerDeps {
  backend: LlmBackend;
  context: ContextManager;
  profile: StackProfile;
  temperature: number;
  maxTokens: number;
  emit: AgentEventSink;
}

export interface PlanResult {
  steps: PlanStep[];
  thinking: string | null;
}

/**
 * First half of the two-stage loop: decide what to do before touching anything.
 *
 * The split exists because planning and editing want different things from the model. Planning
 * needs the whole repository map and a little sampling temperature; editing needs a few complete
 * files and near-determinism. Asking one turn to do both is what makes small models flail.
 */
export async function plan(task: string, deps: PlannerDeps): Promise<PlanResult> {
  deps.emit({ type: 'phase', phase: 'planning' });

  const context = await deps.context.assemble({ task, maxRankedFiles: 4 });
  const result = await deps.backend.complete({
    messages: [
      { role: 'system', content: plannerSystemPrompt(deps.profile) },
      { role: 'user', content: plannerUserPrompt(task, context) },
    ],
    temperature: deps.temperature,
    maxTokens: deps.maxTokens,
  });

  deps.emit({ type: 'token-usage', ...result.usage });

  const { thinking, body } = splitReply(result.text);
  if (thinking) deps.emit({ type: 'thinking', text: thinking });

  const steps = parsePlan(body);
  deps.emit({ type: 'plan', steps });

  return { steps, thinking };
}
