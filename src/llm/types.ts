/**
 * The inference layer is deliberately narrow: everything above it (prompting, agent loop,
 * verification) must work unchanged whether the weights run in Ollama, in a bundled
 * llama.cpp binary, or — during evaluation — behind a remote API.
 */

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
}

export interface CompletionRequest {
  messages: Message[];
  /** Sampling temperature. Planning wants a little creativity; editing wants near-zero. */
  temperature?: number;
  /** Hard cap on generated tokens. */
  maxTokens?: number;
  /** Sequences that end generation, e.g. a closing tag of the edit format. */
  stop?: string[];
}

export interface CompletionUsage {
  promptTokens: number;
  completionTokens: number;
  /** Wall-clock milliseconds — the metric users on a laptop actually feel. */
  durationMs: number;
}

export interface CompletionResult {
  text: string;
  usage: CompletionUsage;
  /** True when generation stopped because maxTokens was hit — a truncated edit is not applicable. */
  truncated: boolean;
}

export interface ModelInfo {
  id: string;
  /** Context window in tokens, as reported by the backend when it knows it. */
  contextWindow: number;
  /** Approximate resident size in bytes, when known. Drives the 16 GB RAM warnings. */
  sizeBytes?: number;
}

export interface BackendHealth {
  ok: boolean;
  backend: string;
  detail: string;
  models: ModelInfo[];
}

export interface LlmBackend {
  readonly name: string;

  /** Cheap reachability probe used by `lvc doctor` and before every run. */
  health(): Promise<BackendHealth>;

  complete(request: CompletionRequest): Promise<CompletionResult>;

  /** Token-by-token output, so the TUI can show progress on a slow local model. */
  stream(request: CompletionRequest): AsyncIterable<string>;
}
