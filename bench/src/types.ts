export type Layer = 'component' | 'form' | 'query' | 'routing' | 'test' | 'mock' | 'cross';
export type Work = 'create' | 'modify' | 'fix' | 'test' | 'refactor';

export interface TaskMeta {
  id: string;
  title: string;
  layer: Layer;
  work: Work;
  difficulty: 1 | 2 | 3;
  formulation: 'spec' | 'product';
  tags?: string[];
  /** Vitest filter for tests the agent is expected to write. Used by mutants. */
  testGlob?: string;
}

export interface Task extends TaskMeta {
  dir: string;
  prompt: string;
  hasSetup: boolean;
  hasSolution: boolean;
  mutants: string[];
  checks: Check[];
}

export type Check =
  | { type: 'file-exists'; path: string }
  | { type: 'grep-count'; path: string; pattern: string; min?: number; max?: number };

export interface BenchConfig {
  description?: string;
  model: string;
  thinking: 'off' | 'minimal' | 'low' | 'medium' | 'high';
  contextFiles: boolean;
  skills: boolean;
  timeoutSec: number;
  tools?: string;
}

export interface Stage {
  ok: boolean;
  /** Last lines of output, enough to see why it failed. */
  tail: string;
  seconds: number;
}

export interface Grade {
  typecheck: Stage;
  lint: Stage;
  format: Stage;
  tests: Stage;
  hidden: Stage & { passed: number; failed: number };
  checks: { ok: boolean; failures: string[] };
  mutants: { ok: boolean; survived: string[] };
  solved: boolean;
  failureReason: string | null;
}

export interface AgentMetrics {
  turns: number;
  toolCalls: Record<string, number>;
  toolErrors: number;
  ranVerify: boolean;
  inputTokens: number;
  outputTokens: number;
  wallSeconds: number;
  timedOut: boolean;
  exitCode: number | null;
  finalMessage: string;
}

export interface RunResult {
  runId: string;
  config: string;
  task: TaskMeta;
  rep: number;
  agent: AgentMetrics;
  grade: Grade;
  workspace: string;
}
