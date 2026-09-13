import { Agent } from '../../agent/agent.js';
import { loadConfig } from '../../config/load.js';
import { createRenderer } from '../render.js';

export interface RunOptions {
  file?: string[];
  planOnly?: boolean;
  thinking?: boolean;
}

export async function runCommand(root: string, task: string, options: RunOptions): Promise<number> {
  const { config } = await loadConfig(root);

  const agent = new Agent({
    root,
    config,
    emit: createRenderer({ showThinking: options.thinking ?? false }),
  });

  const outcome = await agent.run({
    task,
    ...(options.file ? { pinned: options.file } : {}),
    ...(options.planOnly ? { planOnly: true } : {}),
  });

  return outcome.status === 'success' ? 0 : 1;
}
