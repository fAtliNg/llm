import type { Diagnostic } from './types.js';

/** `src/app.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.` */
const TSC_PATTERN = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.*)$/;

/** ESLint stylish output: a `path` line followed by `  12:5  error  message  rule-name`. */
const ESLINT_HEADER = /^(?!\s)(\S.*\.[a-z]+)$/i;
const ESLINT_ENTRY = /^\s+(\d+):(\d+)\s+(error|warning)\s+(.*?)(?:\s\s+([\w@/-]+))?$/;

/**
 * Turns raw tool output into structured diagnostics.
 *
 * Worth the parsing effort rather than passing raw text through: structured errors can be
 * deduplicated, capped, and used to pull the offending files into context — the repair turn
 * often needs a file the acting turn never saw.
 */
export function parseDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  let eslintFile: string | null = null;

  for (const line of output.split('\n')) {
    const tsc = line.match(TSC_PATTERN);
    if (tsc) {
      diagnostics.push({
        file: tsc[1]!,
        line: Number(tsc[2]),
        column: Number(tsc[3]),
        severity: tsc[4] === 'warning' ? 'warning' : 'error',
        code: tsc[5]!,
        message: tsc[6]!.trim(),
      });
      continue;
    }

    const header = line.match(ESLINT_HEADER);
    if (header) {
      eslintFile = header[1]!;
      continue;
    }

    const entry = line.match(ESLINT_ENTRY);
    if (entry && eslintFile) {
      diagnostics.push({
        file: eslintFile,
        line: Number(entry[1]),
        column: Number(entry[2]),
        severity: entry[3] === 'warning' ? 'warning' : 'error',
        ...(entry[5] ? { code: entry[5] } : {}),
        message: entry[4]!.trim(),
      });
    }
  }

  return diagnostics;
}

/** Files a set of diagnostics points at, most-complained-about first. */
export function affectedFiles(diagnostics: Diagnostic[]): string[] {
  const counts = new Map<string, number>();
  for (const diagnostic of diagnostics) {
    counts.set(diagnostic.file, (counts.get(diagnostic.file) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([file]) => file);
}
