import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_FILENAME, STATE_DIR } from '../constants.js';
import { UserFacingError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { configSchema, defaultConfig, type LvcConfig } from './schema.js';

export interface LoadedConfig {
  config: LvcConfig;
  /** Absolute path the config came from, or null when defaults were used. */
  source: string | null;
}

/** Reads `<root>/.lvc/config.json`, falling back to defaults when it does not exist. */
export async function loadConfig(root: string): Promise<LoadedConfig> {
  const file = path.join(root, STATE_DIR, CONFIG_FILENAME);

  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    logger.debug(`no config at ${file}, using defaults`);
    return { config: defaultConfig, source: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new UserFacingError(
      `${file} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new UserFacingError(`${file} has invalid settings:\n${issues}`);
  }

  return { config: result.data, source: file };
}
