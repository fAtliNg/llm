export type SymbolKind =
  'function' | 'class' | 'interface' | 'type' | 'enum' | 'const' | 'component' | 'hook';

export interface CodeSymbol {
  name: string;
  kind: SymbolKind;
  /** Signature only — never the body. The map is a table of contents, not the book. */
  signature: string;
  exported: boolean;
  line: number;
}

export interface FileSummary {
  /** Path relative to the repository root, POSIX separators. */
  path: string;
  bytes: number;
  /** Modules this file imports, as written in source. Drives dependency-aware ranking. */
  imports: string[];
  symbols: CodeSymbol[];
}

export interface RepoMap {
  root: string;
  files: FileSummary[];
  generatedAt: number;
}

/** A file (or a slice of one) handed to the model verbatim. */
export interface FileSlice {
  path: string;
  content: string;
  /** False when only part of the file is included, which the prompt must state explicitly. */
  complete: boolean;
  tokens: number;
}

export interface ContextBundle {
  /** Rendered repo map, already trimmed to its token allowance. */
  repoMapText: string;
  files: FileSlice[];
  tokensUsed: number;
  tokenBudget: number;
}
