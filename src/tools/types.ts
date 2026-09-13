export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

/** A compiler or linter error, normalised so every gate feeds the model the same shape. */
export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  code?: string;
  message: string;
}

export interface VerificationReport {
  passed: boolean;
  /** Gate that failed first, if any. Later gates are skipped — fix the compiler before the tests. */
  failedGate?: string;
  command?: string;
  diagnostics: Diagnostic[];
  rawOutput: string;
}
