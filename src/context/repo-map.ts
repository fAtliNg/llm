import { readFile } from 'node:fs/promises';
import { TypeScriptAnalyzer } from './analyzer/typescript.js';
import type { LanguageAnalyzer } from './analyzer/types.js';
import { scanRepository, type ScanOptions } from './scanner.js';
import type { FileSummary, RepoMap } from './types.js';

const ANALYZERS: LanguageAnalyzer[] = [new TypeScriptAnalyzer()];

/** Builds the semantic table of contents for a repository. */
export async function buildRepoMap(options: ScanOptions): Promise<RepoMap> {
  const scanned = await scanRepository(options);
  const files: FileSummary[] = [];

  for (const file of scanned) {
    const analyzer = ANALYZERS.find((candidate) => candidate.supports(file.path));
    if (!analyzer) {
      // Still worth listing: the model should know the file exists even if we cannot parse it.
      files.push({ path: file.path, bytes: file.bytes, imports: [], symbols: [] });
      continue;
    }
    const content = await readFile(file.absolutePath, 'utf8');
    files.push(analyzer.analyze(file.path, content));
  }

  return { root: options.root, files, generatedAt: Date.now() };
}

/**
 * Renders the map as text for the prompt, densest-signal-first so that truncation at the token
 * budget drops the least useful lines: exported symbols outrank private ones, and files with no
 * symbols collapse to a bare path.
 */
export function renderRepoMap(map: RepoMap, options: { maxSymbolsPerFile?: number } = {}): string {
  const maxSymbols = options.maxSymbolsPerFile ?? 12;
  const lines: string[] = [];

  for (const file of map.files) {
    if (file.symbols.length === 0) {
      lines.push(file.path);
      continue;
    }
    lines.push(`${file.path}:`);
    const ordered = [...file.symbols].sort(
      (a, b) => Number(b.exported) - Number(a.exported) || a.line - b.line,
    );
    for (const symbol of ordered.slice(0, maxSymbols)) {
      // The signature usually opens with its own keyword; only the inferred kinds add information.
      const kind = symbol.signature.includes(symbol.kind) ? '' : `${symbol.kind} `;
      lines.push(`  ${symbol.exported ? '+' : '-'} ${kind}${symbol.signature}`);
    }
    if (ordered.length > maxSymbols) {
      lines.push(`  … ${ordered.length - maxSymbols} more`);
    }
  }

  return lines.join('\n');
}
