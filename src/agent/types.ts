import type { PlanStep } from '../prompt/parser.js';
import type { VerificationReport } from '../tools/types.js';

/**
 * Everything the agent does is emitted as an event. The CLI renders them; a future editor
 * extension can render the same stream differently, and eval runs record it as a transcript
 * without the agent knowing anything about either consumer.
 */
export type AgentEvent =
  | { type: 'phase'; phase: AgentPhase }
  | { type: 'thinking'; text: string }
  | { type: 'plan'; steps: PlanStep[] }
  | { type: 'step-started'; step: PlanStep }
  | { type: 'step-skipped'; step: PlanStep; reason: string }
  | { type: 'edits-applied'; paths: string[] }
  | { type: 'edits-rejected'; reasons: string[]; attempt: number }
  | { type: 'verification'; report: VerificationReport }
  | { type: 'repair-started'; attempt: number; gate: string }
  | { type: 'token-usage'; promptTokens: number; completionTokens: number; durationMs: number }
  | { type: 'done'; outcome: AgentOutcome };

export type AgentPhase = 'planning' | 'editing' | 'verifying' | 'repairing';

export type AgentOutcome =
  | { status: 'success'; changedFiles: string[] }
  | { status: 'needs-human'; reason: string; changedFiles: string[] };

export type AgentEventSink = (event: AgentEvent) => void;

export interface RunRequest {
  task: string;
  /** Files the user pinned into context explicitly. */
  pinned?: string[];
  /** Stop after planning and print the plan. */
  planOnly?: boolean;
}
