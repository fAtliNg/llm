import type { EditParseError, EditParseResult, FileEdit } from './types.js';

export const SEARCH_MARKER = '<<<<<<< SEARCH';
export const DIVIDER_MARKER = '=======';
export const REPLACE_MARKER = '>>>>>>> REPLACE';

/**
 * Parses the SEARCH/REPLACE edit format:
 *
 *   path/to/file.ts
 *   <<<<<<< SEARCH
 *   ...text to find...
 *   =======
 *   ...text to put there...
 *   >>>>>>> REPLACE
 *
 * Chosen over unified diff because a 7B model cannot reliably count line numbers, and over
 * whole-file rewrites because output tokens are the scarcest resource in a 16k window.
 * See docs/adr/0001-edit-format.md.
 *
 * The parser is forgiving about what surrounds the blocks (prose, code fences, a <thinking>
 * section) and strict about the blocks themselves: a malformed block becomes a structured
 * error that the agent feeds back to the model rather than a silent misapplication.
 */
export function parseSearchReplace(text: string): EditParseResult {
  const lines = text.split('\n');
  const edits: FileEdit[] = [];
  const errors: EditParseError[] = [];

  let index = 0;
  while (index < lines.length) {
    if (lines[index]?.trim() !== SEARCH_MARKER) {
      index += 1;
      continue;
    }

    const markerLine = index;
    const filePath = findPathAbove(lines, markerLine);
    if (!filePath) {
      errors.push({ kind: 'missing-path', line: markerLine + 1 });
      index += 1;
      continue;
    }

    const dividerLine = findMarker(lines, markerLine + 1, DIVIDER_MARKER);
    if (dividerLine === -1) {
      errors.push({ kind: 'unterminated-block', line: markerLine + 1, marker: DIVIDER_MARKER });
      break;
    }

    const replaceLine = findMarker(lines, dividerLine + 1, REPLACE_MARKER);
    if (replaceLine === -1) {
      errors.push({ kind: 'unterminated-block', line: markerLine + 1, marker: REPLACE_MARKER });
      break;
    }

    edits.push({
      path: filePath,
      search: lines.slice(markerLine + 1, dividerLine).join('\n'),
      replace: lines.slice(dividerLine + 1, replaceLine).join('\n'),
    });

    index = replaceLine + 1;
  }

  if (edits.length === 0 && errors.length === 0) errors.push({ kind: 'no-edits' });
  return { edits, errors };
}

/**
 * The path is the last non-empty line above the marker. Models habitually wrap the block in a
 * code fence and put the path on the line before it, so fences and list bullets are stripped.
 */
function findPathAbove(lines: string[], markerLine: number): string | null {
  for (let cursor = markerLine - 1; cursor >= 0 && cursor >= markerLine - 4; cursor -= 1) {
    const candidate = (lines[cursor] ?? '').trim();
    if (!candidate) continue;
    if (candidate.startsWith('```')) continue;

    const cleaned = candidate
      .replace(/^[-*]\s+/, '')
      .replace(/^#+\s+/, '')
      .replace(/[`'"]/g, '')
      .replace(/:$/, '')
      .trim();

    if (looksLikePath(cleaned)) return cleaned;
    return null;
  }
  return null;
}

function looksLikePath(value: string): boolean {
  if (!value || value.includes(' ')) return false;
  return value.includes('/') || /\.[a-z0-9]+$/i.test(value);
}

function findMarker(lines: string[], from: number, marker: string): number {
  for (let cursor = from; cursor < lines.length; cursor += 1) {
    if (lines[cursor]?.trim() === marker) return cursor;
  }
  return -1;
}

/** Renders an edit back into the wire format — used to build few-shot examples and eval data. */
export function formatSearchReplace(edit: FileEdit): string {
  return [edit.path, SEARCH_MARKER, edit.search, DIVIDER_MARKER, edit.replace, REPLACE_MARKER].join(
    '\n',
  );
}

export function describeParseErrors(errors: EditParseError[]): string {
  return errors
    .map((error) => {
      switch (error.kind) {
        case 'missing-path':
          return `Line ${error.line}: a SEARCH block has no file path on the line above it.`;
        case 'unterminated-block':
          return `Line ${error.line}: the block starting here never reached its "${error.marker}" line.`;
        case 'no-edits':
          return 'The reply contained no SEARCH/REPLACE blocks at all.';
      }
    })
    .join('\n');
}
