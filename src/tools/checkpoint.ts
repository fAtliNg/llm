import { execa } from 'execa';
import { UserFacingError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Git as the undo button.
 *
 * The agent rewrites files autonomously, so the honest safety guarantee is not "it will not make
 * a mess" but "any mess is one command away from gone". We use a stash-backed snapshot rather
 * than our own backup directory because the user already knows how to inspect and restore it.
 */
export class CheckpointTool {
  constructor(private readonly root: string) {}

  async isGitRepository(): Promise<boolean> {
    const result = await execa('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: this.root,
      reject: false,
    });
    return result.exitCode === 0;
  }

  async isClean(): Promise<boolean> {
    const result = await execa('git', ['status', '--porcelain'], { cwd: this.root, reject: false });
    if (result.exitCode !== 0) throw new UserFacingError('Could not read the git status.');
    return (result.stdout ?? '').trim().length === 0;
  }

  /** Records a restorable snapshot without disturbing the working tree. Returns the stash ref. */
  async create(label: string): Promise<string | null> {
    const result = await execa('git', ['stash', 'create', label], {
      cwd: this.root,
      reject: false,
    });
    const ref = (result.stdout ?? '').trim();
    if (!ref) {
      logger.debug('nothing to checkpoint — the working tree matches HEAD');
      return null;
    }

    await execa('git', ['stash', 'store', '-m', label, ref], { cwd: this.root, reject: false });
    logger.debug(`checkpoint ${ref.slice(0, 8)} (${label})`);
    return ref;
  }
}
