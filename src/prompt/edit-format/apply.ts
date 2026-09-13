import type { EditApplyOutcome, FileEdit } from './types.js';

export interface ApplyInput {
  edit: FileEdit;
  /** Current file content, or null when the file does not exist. */
  current: string | null;
}

export interface ApplyResult {
  outcome: EditApplyOutcome;
  /** New file content when the edit applied cleanly. */
  content?: string;
}

/**
 * Applies one edit to file content in memory. Pure — writing to disk is the caller's job, so
 * the whole batch can be validated before anything touches the working tree.
 *
 * Matching is exact first, then indentation-insensitive. Models reproduce code correctly but
 * re-indent it constantly; refusing those edits would send the loop into a repair cycle over
 * whitespace. Anything looser than that is not attempted: a fuzzy match that silently hits the
 * wrong place is far more expensive than a failed edit the model can retry.
 */
export function applyEdit({ edit, current }: ApplyInput): ApplyResult {
  if (edit.search === '') {
    return {
      outcome: { status: 'applied', path: edit.path, created: current === null },
      content: edit.replace,
    };
  }

  if (current === null) {
    return {
      outcome: {
        status: 'unreadable',
        path: edit.path,
        detail: 'the file does not exist, but the edit expects existing text',
      },
    };
  }

  const exact = countOccurrences(current, edit.search);
  if (exact === 1) {
    return {
      outcome: { status: 'applied', path: edit.path, created: false },
      content: current.replace(edit.search, edit.replace),
    };
  }
  if (exact > 1) {
    return {
      outcome: { status: 'ambiguous', path: edit.path, search: edit.search, occurrences: exact },
    };
  }

  const relaxed = matchIgnoringIndentation(current, edit.search);
  if (relaxed.length === 1) {
    const [start, end] = relaxed[0]!;
    return {
      outcome: { status: 'applied', path: edit.path, created: false },
      content: current.slice(0, start) + edit.replace + current.slice(end),
    };
  }
  if (relaxed.length > 1) {
    return {
      outcome: {
        status: 'ambiguous',
        path: edit.path,
        search: edit.search,
        occurrences: relaxed.length,
      },
    };
  }

  return { outcome: { status: 'not-found', path: edit.path, search: edit.search } };
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return count;
    count += 1;
    from = at + needle.length;
  }
}

/** Finds line-aligned matches where only leading whitespace differs. Returns [start, end) offsets. */
function matchIgnoringIndentation(content: string, search: string): Array<[number, number]> {
  const contentLines = content.split('\n');
  const searchLines = search.split('\n');
  if (searchLines.length === 0) return [];

  // Offset of the first character of each line, so a line-window maps back to string offsets.
  const lineOffsets: number[] = [];
  let offset = 0;
  for (const line of contentLines) {
    lineOffsets.push(offset);
    offset += line.length + 1;
  }

  const matches: Array<[number, number]> = [];
  const limit = contentLines.length - searchLines.length;

  for (let start = 0; start <= limit; start += 1) {
    let same = true;
    for (let index = 0; index < searchLines.length; index += 1) {
      if (contentLines[start + index]?.trim() !== searchLines[index]?.trim()) {
        same = false;
        break;
      }
    }
    if (!same) continue;

    const lastLine = start + searchLines.length - 1;
    const startOffset = lineOffsets[start]!;
    const endOffset = lineOffsets[lastLine]! + contentLines[lastLine]!.length;
    matches.push([startOffset, endOffset]);
  }

  return matches;
}

export function describeApplyOutcome(outcome: EditApplyOutcome): string {
  switch (outcome.status) {
    case 'applied':
      return `${outcome.path}: ${outcome.created ? 'created' : 'updated'}`;
    case 'not-found':
      return `${outcome.path}: the SEARCH text was not found. Re-read the file and quote it exactly as it appears.`;
    case 'ambiguous':
      return `${outcome.path}: the SEARCH text appears ${outcome.occurrences} times. Include more surrounding lines so it matches exactly once.`;
    case 'unreadable':
      return `${outcome.path}: ${outcome.detail}`;
  }
}
