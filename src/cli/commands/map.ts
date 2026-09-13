import pc from 'picocolors';
import { loadConfig } from '../../config/load.js';
import { buildRepoMap, renderRepoMap } from '../../context/repo-map.js';
import { heuristicTokenCounter } from '../../llm/tokens.js';
import { logger } from '../../utils/logger.js';

/**
 * Prints the repository map the model would see.
 *
 * This is the main debugging surface of the project: when the agent produces nonsense, the first
 * question is always whether it could see the right code at all.
 */
export async function mapCommand(root: string, options: { json?: boolean }): Promise<number> {
  const { config } = await loadConfig(root);

  const map = await buildRepoMap({
    root,
    exclude: config.context.exclude,
    maxFileBytes: config.context.maxFileBytes,
  });

  if (options.json) {
    logger.info(JSON.stringify(map, null, 2));
    return 0;
  }

  const text = renderRepoMap(map);
  logger.info(text);

  const tokens = heuristicTokenCounter.count(text);
  const allowance = Math.floor(
    (config.model.contextWindow - config.model.maxOutputTokens) * config.context.repoMapShare,
  );

  logger.info('');
  logger.info(
    pc.dim(
      `${map.files.length} files · ~${tokens} tokens · allowance ${allowance}` +
        (tokens > allowance ? ' — the map will be truncated' : ''),
    ),
  );
  return 0;
}
