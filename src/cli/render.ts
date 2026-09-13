import pc from 'picocolors';
import type { AgentEvent } from '../agent/types.js';
import { logger } from '../utils/logger.js';

export interface RenderOptions {
  /** Print the model's <thinking> sections. Off by default: they are long and mostly for us. */
  showThinking: boolean;
}

/** Turns the agent's event stream into terminal output. The only place that knows about both. */
export function createRenderer(options: RenderOptions) {
  let promptTokens = 0;
  let completionTokens = 0;
  let durationMs = 0;

  return (event: AgentEvent): void => {
    switch (event.type) {
      case 'phase':
        logger.info('');
        logger.info(pc.bold(PHASE_LABELS[event.phase]));
        break;

      case 'thinking':
        if (options.showThinking) logger.info(pc.dim(indent(event.text)));
        break;

      case 'plan':
        for (const step of event.steps) {
          logger.info(`  ${pc.dim(`${step.index}.`)} ${step.description}`);
        }
        break;

      case 'step-started':
        logger.step(`Step ${event.step.index}: ${event.step.description}`);
        break;

      case 'step-skipped':
        logger.info(pc.dim(`  skipped — ${event.reason}`));
        break;

      case 'edits-applied':
        for (const path of event.paths) logger.success(path);
        break;

      case 'edits-rejected':
        logger.warn(`Edits rejected (attempt ${event.attempt}):`);
        for (const reason of event.reasons) logger.info(pc.dim(indent(reason)));
        break;

      case 'verification':
        if (event.report.passed) {
          logger.success('All checks passed.');
        } else {
          const count = event.report.diagnostics.length;
          logger.error(
            `${event.report.failedGate} failed` + (count > 0 ? ` with ${count} problem(s).` : '.'),
          );
          for (const diagnostic of event.report.diagnostics.slice(0, 5)) {
            logger.info(
              pc.dim(
                `  ${diagnostic.file}:${diagnostic.line}:${diagnostic.column} ${diagnostic.message}`,
              ),
            );
          }
        }
        break;

      case 'repair-started':
        logger.step(`Repair attempt ${event.attempt} on ${event.gate}`);
        break;

      case 'token-usage':
        promptTokens += event.promptTokens;
        completionTokens += event.completionTokens;
        durationMs += event.durationMs;
        break;

      case 'done':
        logger.info('');
        if (event.outcome.status === 'success') {
          logger.success(
            event.outcome.changedFiles.length > 0
              ? `Done — ${event.outcome.changedFiles.length} file(s) changed.`
              : 'Done.',
          );
        } else {
          logger.error(`Stopped: ${event.outcome.reason}`);
          if (event.outcome.changedFiles.length > 0) {
            logger.info(
              pc.dim(
                '  Changes are still on disk. Review with `git diff`, undo with `git checkout -- .`',
              ),
            );
          }
        }
        logger.info(
          pc.dim(
            `  ${promptTokens} prompt + ${completionTokens} completion tokens · ${(durationMs / 1000).toFixed(1)}s of inference`,
          ),
        );
        break;
    }
  };
}

const PHASE_LABELS = {
  planning: 'Planning',
  editing: 'Editing',
  verifying: 'Verifying',
  repairing: 'Repairing',
} as const;

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}
