import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_FILENAME, STATE_DIR } from '../../constants.js';
import { defaultConfig } from '../../config/schema.js';
import { UserFacingError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/** Writes an explicit config so every knob is visible and editable rather than implicit. */
export async function initCommand(root: string, options: { force?: boolean }): Promise<number> {
  const directory = path.join(root, STATE_DIR);
  const file = path.join(directory, CONFIG_FILENAME);

  await mkdir(directory, { recursive: true });
  await writeFile(file, `${JSON.stringify(defaultConfig, null, 2)}\n`, {
    encoding: 'utf8',
    flag: options.force ? 'w' : 'wx',
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EEXIST') {
      throw new UserFacingError(`${file} already exists.`, 'Pass --force to overwrite it.');
    }
    throw error;
  });

  logger.success(`Wrote ${path.relative(root, file)}`);
  logger.info('Next: `lvc doctor` to check this machine, then `lvc run "your task"`.');
  return 0;
}
