import { execa } from 'execa';
import { UserFacingError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { CommandResult } from './types.js';

export interface ShellOptions {
  cwd: string;
  /** Command prefixes the agent is permitted to run. */
  allowedCommands: string[];
  timeoutMs: number;
}

/**
 * Runs the verification commands.
 *
 * Deliberately not a general shell tool: the agent gets an allowlist of command prefixes, never
 * arbitrary execution. An autonomous loop that can run anything on a developer's machine is a
 * different product with a different risk profile, and nothing in the self-correction design
 * needs it.
 */
export class ShellTool {
  constructor(private readonly options: ShellOptions) {}

  isAllowed(command: string): boolean {
    const normalised = command.trim();
    return this.options.allowedCommands.some((prefix) => normalised.startsWith(prefix));
  }

  async run(command: string): Promise<CommandResult> {
    if (!this.isAllowed(command)) {
      throw new UserFacingError(
        `The command "${command}" is not on the allowlist.`,
        'Add its prefix to safety.allowedCommands in .lvc/config.json if you intend the agent to run it.',
      );
    }

    logger.debug(`run: ${command}`);
    const startedAt = Date.now();

    const result = await execa(command, {
      cwd: this.options.cwd,
      shell: true,
      reject: false,
      timeout: this.options.timeoutMs,
      all: false,
    });

    return {
      command,
      exitCode: result.exitCode ?? 1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      durationMs: Date.now() - startedAt,
      timedOut: result.timedOut === true,
    };
  }
}
