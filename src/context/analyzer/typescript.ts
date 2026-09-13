import ts from 'typescript';
import type { CodeSymbol, FileSummary, SymbolKind } from '../types.js';
import type { LanguageAnalyzer } from './types.js';

const EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);

/**
 * Extracts top-level symbols and imports with the TypeScript compiler API.
 *
 * We parse per-file (createSourceFile) rather than building a full Program: a Program resolves
 * the whole dependency graph, which on a large repo costs seconds and hundreds of megabytes —
 * unacceptable for a tool whose entire budget is one laptop. Signatures are read from source
 * text, so unannotated inferred types are simply absent from the map. That is an accepted
 * trade-off; the type checker still catches those in the verification loop.
 */
export class TypeScriptAnalyzer implements LanguageAnalyzer {
  readonly name = 'typescript';

  supports(filePath: string): boolean {
    const dot = filePath.lastIndexOf('.');
    return dot !== -1 && EXTENSIONS.has(filePath.slice(dot));
  }

  analyze(filePath: string, content: string): FileSummary {
    const source = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ false,
      filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const imports: string[] = [];
    const symbols: CodeSymbol[] = [];

    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        imports.push(statement.moduleSpecifier.text);
        continue;
      }
      symbols.push(...this.symbolsOf(statement, source));
    }

    return { path: filePath, bytes: Buffer.byteLength(content), imports, symbols };
  }

  private symbolsOf(node: ts.Statement, source: ts.SourceFile): CodeSymbol[] {
    const exported = Boolean(
      ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
    );
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

    const make = (name: string, kind: SymbolKind, signature: string): CodeSymbol => ({
      name,
      kind,
      signature: collapse(signature),
      exported,
      line,
    });

    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      return [make(name, classifyFunction(name), signatureOf(node, source))];
    }
    if (ts.isClassDeclaration(node) && node.name) {
      return [make(node.name.text, 'class', `class ${node.name.text}`)];
    }
    if (ts.isInterfaceDeclaration(node)) {
      return [make(node.name.text, 'interface', `interface ${node.name.text}`)];
    }
    if (ts.isTypeAliasDeclaration(node)) {
      // A type alias has no body to cut at — the right-hand side *is* the information.
      return [make(node.name.text, 'type', node.getText(source))];
    }
    if (ts.isEnumDeclaration(node)) {
      return [make(node.name.text, 'enum', `enum ${node.name.text}`)];
    }
    if (ts.isVariableStatement(node)) {
      return node.declarationList.declarations
        .filter((declaration) => ts.isIdentifier(declaration.name))
        .map((declaration) => {
          const name = (declaration.name as ts.Identifier).text;
          const initializer = declaration.initializer;
          const isFunctionLike =
            initializer &&
            (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer));
          return make(
            name,
            isFunctionLike ? classifyFunction(name) : 'const',
            headOf(declaration, source),
          );
        });
    }
    return [];
  }
}

/**
 * React conventions carry real structural meaning in our target stack, so the map labels them:
 * `PascalCase` is a component, `useSomething` is a hook. Cheap, and it lets the prompt say
 * "these are the existing components" without a second pass.
 */
function classifyFunction(name: string): SymbolKind {
  if (/^use[A-Z]/.test(name)) return 'hook';
  if (/^[A-Z]/.test(name)) return 'component';
  return 'function';
}

/** Declaration text up to the body — the signature, without the implementation. */
function signatureOf(node: ts.Node, source: ts.SourceFile): string {
  const text = node.getText(source);
  const brace = text.indexOf('{');
  return brace === -1 ? text : text.slice(0, brace).trim();
}

function headOf(node: ts.Node, source: ts.SourceFile): string {
  const text = node.getText(source);
  const arrow = text.indexOf('=>');
  const equals = text.indexOf('=');
  const cut = arrow !== -1 ? arrow : equals !== -1 ? equals : text.length;
  return text.slice(0, cut).trim();
}

/** Signatures are one line each in the map; an unbounded one would crowd out whole files. */
const MAX_SIGNATURE_CHARS = 140;

function collapse(text: string): string {
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length > MAX_SIGNATURE_CHARS
    ? `${single.slice(0, MAX_SIGNATURE_CHARS).trimEnd()} …`
    : single;
}
