import type { FileSummary, RepoMap } from './types.js';

export interface RankedFile {
  file: FileSummary;
  score: number;
  reason: string;
}

/**
 * Picks which files are worth spending context tokens on.
 *
 * Phase 1 is deliberately a lexical heuristic, not embeddings: on a 16 GB machine an embedding
 * model competes for the same RAM as the coder model, and a heuristic that costs nothing is the
 * right baseline to beat. Replacing this with retrieval is an isolated change — the ranking
 * contract stays the same.
 */
export function rankFiles(map: RepoMap, task: string, limit: number): RankedFile[] {
  const terms = tokenize(task);
  const ranked: RankedFile[] = [];

  for (const file of map.files) {
    let score = 0;
    const reasons: string[] = [];

    const pathTerms = tokenize(file.path);
    const pathHits = terms.filter((term) => pathTerms.includes(term)).length;
    if (pathHits > 0) {
      score += pathHits * 3;
      reasons.push('path match');
    }

    const symbolHits = file.symbols.filter((symbol) =>
      terms.some((term) => symbol.name.toLowerCase().includes(term)),
    ).length;
    if (symbolHits > 0) {
      score += symbolHits * 2;
      reasons.push('symbol match');
    }

    if (score > 0) ranked.push({ file, score, reason: reasons.join(', ') });
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);
}
