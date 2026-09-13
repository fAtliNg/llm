import type { FileSummary } from '../types.js';

/**
 * Seam for language support. The TypeScript implementation covers the target stack; adding
 * Python or Go later means adding an implementation here, not touching the context manager.
 */
export interface LanguageAnalyzer {
  readonly name: string;
  /** Whether this analyzer handles the given path. */
  supports(filePath: string): boolean;
  analyze(filePath: string, content: string): FileSummary;
}
