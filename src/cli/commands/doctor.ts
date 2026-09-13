import { totalmem } from 'node:os';
import pc from 'picocolors';
import { loadConfig } from '../../config/load.js';
import { createBackend } from '../../llm/index.js';
import { CheckpointTool } from '../../tools/checkpoint.js';
import { logger } from '../../utils/logger.js';

const GIB = 1024 ** 3;

/**
 * Answers the only question that matters before a first run: will this machine actually run the
 * thing, and if not, which specific part is missing.
 */
export async function doctorCommand(root: string): Promise<number> {
  const { config, source } = await loadConfig(root);
  const checks: Array<{ ok: boolean; label: string; detail: string }> = [];

  const ram = totalmem() / GIB;
  checks.push({
    ok: ram >= 15,
    label: 'memory',
    detail: `${ram.toFixed(1)} GB total${ram < 15 ? ' — below the 16 GB baseline' : ''}`,
  });

  const git = new CheckpointTool(root);
  const isRepo = await git.isGitRepository();
  checks.push({
    ok: isRepo,
    label: 'git',
    detail: isRepo ? 'repository detected' : 'not a git repository — the agent has no undo',
  });

  checks.push({
    ok: true,
    label: 'config',
    detail: source ?? 'using built-in defaults (run `lvc init` to write one)',
  });

  const backend = createBackend(config);
  const health = await backend.health();
  checks.push({ ok: health.ok, label: `backend (${health.backend})`, detail: health.detail });

  if (health.ok) {
    const wanted = config.model.id;
    const found = health.models.find((model) => model.id === wanted);
    checks.push({
      ok: Boolean(found),
      label: 'model',
      detail: found
        ? `${wanted}${found.sizeBytes ? ` (${(found.sizeBytes / GIB).toFixed(1)} GB)` : ''}`
        : `${wanted} is not pulled — run: ollama pull ${wanted}`,
    });

    if (found?.sizeBytes && found.sizeBytes / GIB > ram * 0.45) {
      checks.push({
        ok: false,
        label: 'headroom',
        detail:
          'The model is large relative to this machine. Expect swapping once the KV cache fills; ' +
          'consider a smaller quant or a lower model.contextWindow.',
      });
    }
  }

  for (const check of checks) {
    const mark = check.ok ? pc.green('✔') : pc.red('✖');
    logger.info(`${mark} ${check.label.padEnd(18)} ${pc.dim(check.detail)}`);
  }

  const failed = checks.filter((check) => !check.ok).length;
  logger.info('');
  logger.info(failed === 0 ? pc.green('Ready.') : pc.yellow(`${failed} issue(s) to resolve.`));
  return failed === 0 ? 0 : 1;
}
