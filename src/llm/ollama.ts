import type {
  BackendHealth,
  CompletionRequest,
  CompletionResult,
  LlmBackend,
  ModelInfo,
} from './types.js';
import { UserFacingError } from '../utils/errors.js';

export interface OllamaOptions {
  baseUrl: string;
  model: string;
  /** Context window to request. Must fit in RAM alongside the weights — see docs/context-strategy.md. */
  contextWindow: number;
  /** Abort a single generation that runs away. Local models can stall; the loop must not. */
  requestTimeoutMs: number;
}

interface OllamaChatChunk {
  message?: { content?: string };
  done?: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Phase-1 backend. Ollama is already installed on most target machines and handles model
 * download, GGUF loading and memory-mapped weights for us. The bundled-llama.cpp backend
 * (zero-install distribution) implements the same interface later.
 */
export class OllamaBackend implements LlmBackend {
  readonly name = 'ollama';

  constructor(private readonly options: OllamaOptions) {}

  async health(): Promise<BackendHealth> {
    try {
      const response = await fetch(new URL('/api/tags', this.options.baseUrl), {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) {
        return this.unhealthy(`Ollama answered with HTTP ${response.status}`);
      }
      const body = (await response.json()) as {
        models?: Array<{ name?: string; size?: number }>;
      };
      const models: ModelInfo[] = (body.models ?? [])
        .filter((m): m is { name: string; size?: number } => typeof m.name === 'string')
        .map((m) => ({
          id: m.name,
          contextWindow: this.options.contextWindow,
          ...(typeof m.size === 'number' ? { sizeBytes: m.size } : {}),
        }));

      return {
        ok: true,
        backend: this.name,
        detail: `reachable at ${this.options.baseUrl}`,
        models,
      };
    } catch (error) {
      return this.unhealthy(error instanceof Error ? error.message : String(error));
    }
  }

  private unhealthy(detail: string): BackendHealth {
    return { ok: false, backend: this.name, detail, models: [] };
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const startedAt = Date.now();
    const response = await this.post(request, false);
    const body = (await response.json()) as OllamaChatChunk;

    return {
      text: body.message?.content ?? '',
      truncated: body.done_reason === 'length',
      usage: {
        promptTokens: body.prompt_eval_count ?? 0,
        completionTokens: body.eval_count ?? 0,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  async *stream(request: CompletionRequest): AsyncIterable<string> {
    const response = await this.post(request, true);
    if (!response.body) throw new UserFacingError('Ollama returned an empty response stream.');

    // Ollama streams newline-delimited JSON; a chunk boundary can split a line in half.
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line) as OllamaChatChunk;
        const content = parsed.message?.content;
        if (content) yield content;
        if (parsed.done) return;
      }
    }
  }

  private async post(request: CompletionRequest, stream: boolean): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(new URL('/api/chat', this.options.baseUrl), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(this.options.requestTimeoutMs),
        body: JSON.stringify({
          model: this.options.model,
          messages: request.messages,
          stream,
          options: {
            temperature: request.temperature ?? 0.2,
            num_ctx: this.options.contextWindow,
            num_predict: request.maxTokens ?? -1,
            ...(request.stop?.length ? { stop: request.stop } : {}),
          },
        }),
      });
    } catch (error) {
      throw new UserFacingError(
        `Could not reach Ollama at ${this.options.baseUrl}.`,
        error instanceof Error && error.name === 'TimeoutError'
          ? 'The model did not answer in time. A cold start can take a while — raise backend.requestTimeoutMs.'
          : 'Start it with `ollama serve`, then re-run.',
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new UserFacingError(
        `Ollama rejected the request (HTTP ${response.status}). ${detail}`.trim(),
        `Check that the model "${this.options.model}" is pulled: ollama pull ${this.options.model}`,
      );
    }

    return response;
  }
}
