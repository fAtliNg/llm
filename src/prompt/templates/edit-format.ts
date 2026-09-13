import { DIVIDER_MARKER, REPLACE_MARKER, SEARCH_MARKER } from '../edit-format/search-replace.js';

/**
 * The format specification, shared by every turn that asks for edits.
 *
 * It lives in one place because a repair turn starts a fresh conversation: telling the model to
 * reply "in the same format as before" refers to a history it cannot see.
 *
 * The worked example is deliberately from an unrelated domain. Small models copy whatever the
 * example contains — identifiers included — so an example that resembles the task at hand shows
 * up verbatim in the output.
 */
/** Sentinel a turn uses to report that nothing needs changing. Parsed, never interpreted. */
export const NO_CHANGES_SENTINEL = 'NO CHANGES NEEDED';

export function editFormatInstructions(): string[] {
  return [
    'Reply with SEARCH/REPLACE blocks and nothing else. No explanation, no prose, no code fences.',
    '',
    'One block looks exactly like this:',
    '',
    'src/logging/timestamp.ts',
    SEARCH_MARKER,
    'export function stamp(): string {',
    '  return new Date().toISOString();',
    DIVIDER_MARKER,
    'export function stamp(prefix: string): string {',
    '  return `${prefix} ${new Date().toISOString()}`;',
    REPLACE_MARKER,
    '',
    'That example is unrelated to your task. Never reuse its path or its identifiers.',
    '',
    'Rules:',
    '- The first line of a block is the file path, copied from a "### " heading you were given.',
    '- The SEARCH text must match the file byte for byte, copied from the content you were given.',
    '- Include enough surrounding lines that the SEARCH text occurs exactly once in the file.',
    '- Keep each block small. Several focused blocks beat one large one.',
    '- To create a new file, leave the SEARCH section empty and put the whole file in REPLACE.',
    '- Never write a placeholder such as "// ... rest of the file". Every line you emit is written verbatim.',
  ];
}
