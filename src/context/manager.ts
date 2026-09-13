import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LvcConfig } from '../config/schema.js';
import type { TokenCounter } from '../llm/tokens.js';
import { logger } from '../utils/logger.js';
import { allocate, fitToTokens } from './budget.js';
import { rankFiles } from './ranker.js';
import { buildRepoMap, renderRepoMap } from './repo-map.js';
import type { ContextBundle, FileSlice, RepoMap } from './types.js';

export interface AssembleOptions {
  /** The user's task, used to rank files. */
  task: string;
  /** Files the user named explicitly. These are always included, ahead of ranked ones. */
  pinned?: string[];
  /** Cap on ranked files, on top of pinned ones. */
  maxRankedFiles?: number;
}

/**
 * Turns a repository plus a task into the exact bytes the model will see.
 *
 * This is the component the product lives or dies by: a 16k window means the choice of what to
 * leave out matters more than anything the model does with what is left in.
 */
export class ContextManager {
  private cachedMap: RepoMap | null = null;

  constructor(
    private readonly root: string,
    private readonly config: LvcConfig,
    private readonly tokens: TokenCounter,
  ) {}

  async repoMap(refresh = false): Promise<RepoMap> {
    if (!this.cachedMap || refresh) {
      this.cachedMap = await buildRepoMap({
        root: this.root,
        exclude: this.config.context.exclude,
        maxFileBytes: this.config.context.maxFileBytes,
      });
      logger.debug(`repo map: ${this.cachedMap.files.length} files`);
    }
    return this.cachedMap;
  }

  async assemble(options: AssembleOptions): Promise<ContextBundle> {
    const map = await this.repoMap();
    const allowance = allocate(
      this.config.model.contextWindow,
      this.config.model.maxOutputTokens,
      this.config.context,
    );

    const repoMapText = fitToTokens(renderRepoMap(map), allowance.repoMap, this.tokens);

    const pinned = options.pinned ?? [];
    const ranked = rankFiles(map, options.task, options.maxRankedFiles ?? 3)
      .map((entry) => entry.file.path)
      .filter((candidate) => !pinned.includes(candidate));

    const files = await this.readWithinBudget([...pinned, ...ranked], allowance.files);
    const tokensUsed =
      this.tokens.count(repoMapText) + files.reduce((sum, file) => sum + file.tokens, 0);

    return {
      repoMapText,
      files,
      tokensUsed,
      tokenBudget: allowance.repoMap + allowance.files,
    };
  }

  private async readWithinBudget(paths: string[], allowance: number): Promise<FileSlice[]> {
    const slices: FileSlice[] = [];
    let used = 0;

    for (const relative of paths) {
      let content: string;
      try {
        content = await readFile(path.join(this.root, relative), 'utf8');
      } catch {
        logger.debug(`skipping unreadable file ${relative}`);
        continue;
      }

      const cost = this.tokens.count(content);
      if (used + cost > allowance) {
        // A partial file is worse than no file for editing: the model would emit a
        // SEARCH block anchored to text it cannot see. Skip it and say so in the log.
        logger.debug(`skipping ${relative}: ${cost} tokens exceeds the remaining budget`);
        continue;
      }

      slices.push({ path: relative, content, complete: true, tokens: cost });
      used += cost;
    }

    return slices;
  }
}
