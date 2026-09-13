import type { VerifyConfig } from '../config/schema.js';
import { logger } from '../utils/logger.js';
import { parseDiagnostics } from './diagnostics.js';
import type { ShellTool } from './shell.js';
import type { VerificationReport } from './types.js';

/**
 * Runs the verification gates in order and stops at the first failure.
 *
 * Order is not arbitrary: a type error makes lint output noise and test output meaningless, and
 * every wasted gate costs the user seconds of laptop time. One clear error beats fifty.
 */
export class VerifyTool {
  constructor(
    private readonly shell: ShellTool,
    private readonly config: VerifyConfig,
  ) {}

  private gates(): Array<{ name: string; command: string }> {
    return [
      { name: 'typecheck', command: this.config.typecheck },
      { name: 'lint', command: this.config.lint },
      { name: 'test', command: this.config.test },
    ].filter((gate) => gate.command.trim().length > 0);
  }

  async run(): Promise<VerificationReport> {
    for (const gate of this.gates()) {
      logger.step(`${gate.name}: ${gate.command}`);
      const result = await this.shell.run(gate.command);

      if (result.exitCode === 0 && !result.timedOut) {
        logger.debug(`${gate.name} passed in ${result.durationMs}ms`);
        continue;
      }

      const rawOutput = [result.stdout, result.stderr].filter(Boolean).join('\n');
      return {
        passed: false,
        failedGate: gate.name,
        command: gate.command,
        diagnostics: parseDiagnostics(rawOutput),
        rawOutput: result.timedOut
          ? `The command timed out after ${this.config.commandTimeoutMs}ms.\n${rawOutput}`
          : rawOutput,
      };
    }

    return { passed: true, diagnostics: [], rawOutput: '' };
  }
}
