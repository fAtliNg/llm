import type { BackendHealth, CompletionRequest, CompletionResult, LlmBackend } from './types.js';
import { UserFacingError } from '../utils/errors.js';

/**
 * Planned phase-2 backend: spawn a bundled llama.cpp server against a GGUF file so that
 * installing the CLI is the only install step a user performs.
 *
 * Intentionally unimplemented — it exists to keep the backend abstraction honest. If the rest
 * of the codebase can be written against `LlmBackend` without reaching for Ollama specifics,
 * the abstraction holds.
 */
export class LlamaCppBackend implements LlmBackend {
  readonly name = 'llama.cpp';

  async health(): Promise<BackendHealth> {
    return {
      ok: false,
      backend: this.name,
      detail: 'not implemented yet — use the ollama backend',
      models: [],
    };
  }

  async complete(_request: CompletionRequest): Promise<CompletionResult> {
    throw new UserFacingError(
      'The llama.cpp backend is not implemented yet.',
      'Set backend.kind to "ollama" in .lvc/config.json.',
    );
  }

  async *stream(_request: CompletionRequest): AsyncIterable<string> {
    throw new UserFacingError(
      'The llama.cpp backend is not implemented yet.',
      'Set backend.kind to "ollama" in .lvc/config.json.',
    );
  }
}
