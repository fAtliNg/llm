import type { ContextConfig } from '../config/schema.js';
import type { TokenCounter } from '../llm/tokens.js';

export interface ContextAllowance {
  repoMap: number;
  files: number;
  history: number;
  /** Whatever is left after the sections above — the model's own output plus the system prompt. */
  reserve: number;
}

/** Splits the context window into per-section token allowances. */
export function allocate(
  contextWindow: number,
  maxOutputTokens: number,
  config: ContextConfig,
): ContextAllowance {
  const usable = Math.max(contextWindow - maxOutputTokens, 0);
  const repoMap = Math.floor(usable * config.repoMapShare);
  const files = Math.floor(usable * config.filesShare);
  const history = Math.floor(usable * config.historyShare);
  return { repoMap, files, history, reserve: usable - repoMap - files - history };
}

/**
 * Truncates text to a token allowance on a line boundary.
 * Returns the text unchanged when it already fits.
 */
export function fitToTokens(text: string, allowance: number, counter: TokenCounter): string {
  if (counter.count(text) <= allowance) return text;

  const lines = text.split('\n');
  const kept: string[] = [];
  let used = 0;

  for (const line of lines) {
    const cost = counter.count(line) + 1;
    if (used + cost > allowance) break;
    kept.push(line);
    used += cost;
  }

  kept.push(`… truncated to fit the context window (${lines.length - kept.length} lines omitted)`);
  return kept.join('\n');
}
