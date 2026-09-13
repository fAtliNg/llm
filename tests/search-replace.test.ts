import { describe, expect, it } from 'vitest';
import { applyEdit } from '../src/prompt/edit-format/apply.js';
import { parseSearchReplace } from '../src/prompt/edit-format/search-replace.js';

describe('parseSearchReplace', () => {
  it('reads a block surrounded by prose', () => {
    const reply = [
      'I will widen the props.',
      '',
      'src/Button.tsx',
      '<<<<<<< SEARCH',
      'type Props = { label: string };',
      '=======',
      'type Props = { label: string; onClick: () => void };',
      '>>>>>>> REPLACE',
      '',
      'That is all.',
    ].join('\n');

    const { edits, errors } = parseSearchReplace(reply);

    expect(errors).toEqual([]);
    expect(edits).toHaveLength(1);
    expect(edits[0]?.path).toBe('src/Button.tsx');
    expect(edits[0]?.search).toBe('type Props = { label: string };');
  });

  it('finds the path when the model wraps the block in a code fence', () => {
    const reply = [
      'src/api/client.ts',
      '```',
      '<<<<<<< SEARCH',
      'a',
      '=======',
      'b',
      '>>>>>>> REPLACE',
      '```',
    ].join('\n');

    expect(parseSearchReplace(reply).edits[0]?.path).toBe('src/api/client.ts');
  });

  it('reads several blocks across different files', () => {
    const reply = [
      'a.ts',
      '<<<<<<< SEARCH',
      'one',
      '=======',
      'ONE',
      '>>>>>>> REPLACE',
      'b.ts',
      '<<<<<<< SEARCH',
      'two',
      '=======',
      'TWO',
      '>>>>>>> REPLACE',
    ].join('\n');

    expect(parseSearchReplace(reply).edits.map((edit) => edit.path)).toEqual(['a.ts', 'b.ts']);
  });

  it('reports an unterminated block instead of guessing', () => {
    const reply = ['a.ts', '<<<<<<< SEARCH', 'one', '=======', 'ONE'].join('\n');

    const { edits, errors } = parseSearchReplace(reply);

    expect(edits).toEqual([]);
    expect(errors[0]).toMatchObject({ kind: 'unterminated-block' });
  });

  it('reports a block with no file path', () => {
    const reply = [
      'Here you go:',
      '<<<<<<< SEARCH',
      'one',
      '=======',
      'ONE',
      '>>>>>>> REPLACE',
    ].join('\n');

    expect(parseSearchReplace(reply).errors[0]).toMatchObject({ kind: 'missing-path' });
  });

  it('reports a reply that contains no blocks at all', () => {
    expect(parseSearchReplace('I think you should use Redux.').errors[0]).toMatchObject({
      kind: 'no-edits',
    });
  });
});

describe('applyEdit', () => {
  it('replaces an exact match', () => {
    const result = applyEdit({
      edit: { path: 'a.ts', search: 'const x = 1;', replace: 'const x = 2;' },
      current: 'const x = 1;\nexport { x };\n',
    });

    expect(result.outcome.status).toBe('applied');
    expect(result.content).toBe('const x = 2;\nexport { x };\n');
  });

  it('matches when only indentation differs', () => {
    const result = applyEdit({
      edit: { path: 'a.ts', search: 'return null;', replace: 'return <div />;' },
      current: 'function C() {\n      return null;\n}\n',
    });

    expect(result.outcome.status).toBe('applied');
    expect(result.content).toContain('return <div />;');
  });

  it('refuses an ambiguous match rather than picking one', () => {
    const result = applyEdit({
      edit: { path: 'a.ts', search: 'value', replace: 'result' },
      current: 'const value = 1;\nconst other = value;\n',
    });

    expect(result.outcome).toMatchObject({ status: 'ambiguous', occurrences: 2 });
    expect(result.content).toBeUndefined();
  });

  it('reports text it cannot find', () => {
    const result = applyEdit({
      edit: { path: 'a.ts', search: 'const missing = true;', replace: 'x' },
      current: 'const x = 1;\n',
    });

    expect(result.outcome.status).toBe('not-found');
  });

  it('creates a file when SEARCH is empty', () => {
    const result = applyEdit({
      edit: { path: 'new.ts', search: '', replace: 'export const a = 1;\n' },
      current: null,
    });

    expect(result.outcome).toMatchObject({ status: 'applied', created: true });
    expect(result.content).toBe('export const a = 1;\n');
  });

  it('rejects an edit to a file that does not exist', () => {
    const result = applyEdit({
      edit: { path: 'missing.ts', search: 'something', replace: 'other' },
      current: null,
    });

    expect(result.outcome.status).toBe('unreadable');
  });
});
