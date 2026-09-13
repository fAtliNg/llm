import type { LvcConfig } from '../config/schema.js';
import { LlamaCppBackend } from './llamacpp.js';
import { OllamaBackend } from './ollama.js';
import type { LlmBackend } from './types.js';

export function createBackend(config: LvcConfig): LlmBackend {
  switch (config.backend.kind) {
    case 'ollama':
      return new OllamaBackend({
        baseUrl: config.backend.baseUrl,
        model: config.model.id,
        contextWindow: config.model.contextWindow,
        requestTimeoutMs: config.backend.requestTimeoutMs,
      });
    case 'llama.cpp':
      return new LlamaCppBackend();
  }
}

export type * from './types.js';
