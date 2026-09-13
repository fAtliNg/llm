import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { applyEdit } from '../prompt/edit-format/apply.js';
import type { EditApplyOutcome, FileEdit } from '../prompt/edit-format/types.js';
import { UserFacingError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface EditBatchResult {
  outcomes: EditApplyOutcome[];
  /** Paths actually written. */
  written: string[];
  allApplied: boolean;
}

/**
 * Applies a batch of edits to the working tree.
 *
 * All-or-nothing: every edit is resolved in memory first, and nothing is written unless all of
 * them apply. A half-applied batch leaves the repository in a state neither the user nor the
 * model can reason about, and the repair turn would be starting from fiction.
 */
export class EditorTool {
  constructor(private readonly root: string) {}

  async applyBatch(edits: FileEdit[]): Promise<EditBatchResult> {
    const outcomes: EditApplyOutcome[] = [];
    const pending = new Map<string, string>();

    for (const edit of edits) {
      const absolute = this.resolve(edit.path);
      const current = pending.get(edit.path) ?? (await readIfExists(absolute));
      const result = applyEdit({ edit, current });

      outcomes.push(result.outcome);
      if (result.outcome.status === 'applied' && result.content !== undefined) {
        pending.set(edit.path, result.content);
      }
    }

    const allApplied = outcomes.every((outcome) => outcome.status === 'applied');
    if (!allApplied) return { outcomes, written: [], allApplied };

    const written: string[] = [];
    for (const [relative, content] of pending) {
      const absolute = this.resolve(relative);
      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, content, 'utf8');
      written.push(relative);
      logger.debug(`wrote ${relative}`);
    }

    return { outcomes, written, allApplied };
  }

  /** Keeps writes inside the repository: a model-supplied path is never trusted as-is. */
  private resolve(relative: string): string {
    const absolute = path.resolve(this.root, relative);
    const boundary = path.resolve(this.root) + path.sep;
    if (!absolute.startsWith(boundary)) {
      throw new UserFacingError(`Refusing to write outside the project: ${relative}`);
    }
    return absolute;
  }
}

async function readIfExists(absolute: string): Promise<string | null> {
  try {
    return await readFile(absolute, 'utf8');
  } catch {
    return null;
  }
}
