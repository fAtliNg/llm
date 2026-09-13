export interface FileEdit {
  path: string;
  /** Text to locate. Empty means "create this file". */
  search: string;
  replace: string;
}

export type EditParseError =
  | { kind: 'missing-path'; line: number }
  | { kind: 'unterminated-block'; line: number; marker: string }
  | { kind: 'no-edits' };

export interface EditParseResult {
  edits: FileEdit[];
  errors: EditParseError[];
}

export type EditApplyOutcome =
  | { status: 'applied'; path: string; created: boolean }
  | { status: 'not-found'; path: string; search: string }
  | { status: 'ambiguous'; path: string; search: string; occurrences: number }
  | { status: 'unreadable'; path: string; detail: string };
