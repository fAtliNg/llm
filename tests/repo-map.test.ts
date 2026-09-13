import { describe, expect, it } from 'vitest';
import { TypeScriptAnalyzer } from '../src/context/analyzer/typescript.js';

const analyzer = new TypeScriptAnalyzer();

describe('TypeScriptAnalyzer', () => {
  it('collects imports and exported symbols', () => {
    const summary = analyzer.analyze(
      'src/user.ts',
      [
        "import { db } from './db';",
        'export interface User { id: string }',
        'export function findUser(id: string): User | null { return null; }',
        'const secret = 42;',
      ].join('\n'),
    );

    expect(summary.imports).toEqual(['./db']);
    expect(summary.symbols.map((s) => s.name)).toEqual(['User', 'findUser', 'secret']);
    expect(summary.symbols.find((s) => s.name === 'secret')?.exported).toBe(false);
  });

  it('labels React components and hooks by convention', () => {
    const summary = analyzer.analyze(
      'src/Button.tsx',
      [
        'export const Button = (props: Props) => <button />;',
        'export function useCart() { return null; }',
      ].join('\n'),
    );

    expect(summary.symbols.find((s) => s.name === 'Button')?.kind).toBe('component');
    expect(summary.symbols.find((s) => s.name === 'useCart')?.kind).toBe('hook');
  });

  it('records signatures without bodies', () => {
    const summary = analyzer.analyze(
      'src/a.ts',
      'export function add(a: number, b: number): number {\n  return a + b;\n}',
    );

    expect(summary.symbols[0]?.signature).toBe('export function add(a: number, b: number): number');
  });
});
