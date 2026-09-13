/**
 * Token accounting for context budgeting.
 *
 * We do not ship a real tokenizer yet: Qwen's BPE would mean either a native dependency or a
 * multi-megabyte vocab file, and the budgeter only needs to be conservative, not exact.
 * Heuristic: code tokenizes at roughly 3.2 characters per token for Qwen-class BPE vocabs.
 *
 * Everything in the codebase must go through this interface so that swapping in a real
 * tokenizer later is one implementation, not a search-and-replace.
 */

export interface TokenCounter {
  count(text: string): number;
}

const CHARS_PER_TOKEN = 3.2;
/** Budget headroom: an underestimate here means a hard context overflow at inference time. */
const SAFETY_FACTOR = 1.1;

export const heuristicTokenCounter: TokenCounter = {
  count(text: string): number {
    return Math.ceil((text.length / CHARS_PER_TOKEN) * SAFETY_FACTOR);
  },
};
