import type { LvcConfig } from '../config/schema.js';
import { ContextManager } from '../context/manager.js';
import { createBackend } from '../llm/index.js';
import { heuristicTokenCounter } from '../llm/tokens.js';
import type { LlmBackend } from '../llm/types.js';
import { reactNestProfile, type StackProfile } from '../prompt/stack-profile.js';
import { CheckpointTool } from '../tools/checkpoint.js';
import { EditorTool } from '../tools/editor.js';
import { ShellTool } from '../tools/shell.js';
import { VerifyTool } from '../tools/verify.js';
import { UserFacingError } from '../utils/errors.js';
import { act } from './actor.js';
import { heal } from './healer.js';
import { plan } from './planner.js';
import type { AgentEventSink, AgentOutcome, RunRequest } from './types.js';

export interface AgentDeps {
  root: string;
  config: LvcConfig;
  emit: AgentEventSink;
  profile?: StackProfile;
  /** Injectable for tests and eval runs; defaults to the configured backend. */
  backend?: LlmBackend;
}

/**
 * The driver.
 *
 *   plan  ->  for each step: edit -> verify -> repair*  ->  done
 *
 * Two invariants shape the whole design. Verification runs after every step, not once at the
 * end, so a repair turn has one step's worth of blame to reason about instead of the entire
 * change. And the repair budget is finite: an agent that cannot converge must hand back to the
 * human with the working tree intact and say so, rather than burning a laptop's battery
 * rewriting the same file.
 */
export class Agent {
  private readonly backend: LlmBackend;
  private readonly context: ContextManager;
  private readonly editor: EditorTool;
  private readonly verifier: VerifyTool;
  private readonly checkpoints: CheckpointTool;
  private readonly profile: StackProfile;

  constructor(private readonly deps: AgentDeps) {
    const { root, config } = deps;

    this.backend = deps.backend ?? createBackend(config);
    this.profile = deps.profile ?? reactNestProfile;
    this.context = new ContextManager(root, config, heuristicTokenCounter);
    this.editor = new EditorTool(root);
    this.checkpoints = new CheckpointTool(root);
    this.verifier = new VerifyTool(
      new ShellTool({
        cwd: root,
        allowedCommands: config.safety.allowedCommands,
        timeoutMs: config.verify.commandTimeoutMs,
      }),
      config.verify,
    );
  }

  async run(request: RunRequest): Promise<AgentOutcome> {
    await this.guardWorkingTree();

    const health = await this.backend.health();
    if (!health.ok) {
      throw new UserFacingError(
        `The ${health.backend} backend is not available: ${health.detail}`,
        'Run `lvc doctor` for the full diagnosis.',
      );
    }

    const { steps } = await plan(request.task, {
      backend: this.backend,
      context: this.context,
      profile: this.profile,
      temperature: this.deps.config.model.plannerTemperature,
      maxTokens: this.deps.config.model.maxOutputTokens,
      emit: this.deps.emit,
    });

    if (steps.length === 0) {
      return this.finish({
        status: 'needs-human',
        reason: 'The model did not produce a usable plan.',
        changedFiles: [],
      });
    }
    if (request.planOnly) {
      return this.finish({ status: 'success', changedFiles: [] });
    }

    await this.guardBaseline();
    await this.checkpoint(request.task);

    const changed = new Set<string>();

    for (const step of steps) {
      const result = await act(request.task, step, {
        backend: this.backend,
        context: this.context,
        editor: this.editor,
        profile: this.profile,
        temperature: this.deps.config.model.actorTemperature,
        maxTokens: this.deps.config.model.maxOutputTokens,
        maxFormatRetries: 2,
        emit: this.deps.emit,
      });

      if (result.status === 'skipped') {
        this.deps.emit({ type: 'step-skipped', step, reason: result.reason });
        continue;
      }
      if (result.status === 'failed') {
        return this.finish({
          status: 'needs-human',
          reason: `Step ${step.index} could not be applied: ${result.reason}`,
          changedFiles: [...changed],
        });
      }
      for (const path of result.paths) changed.add(path);
      // Symbols moved; a later step planned against the old map would be planned against fiction.
      await this.context.repoMap(true);

      const settled = await this.verifyAndRepair(changed);
      if (!settled.ok) {
        return this.finish({
          status: 'needs-human',
          reason: settled.reason,
          changedFiles: [...changed],
        });
      }
    }

    return this.finish({ status: 'success', changedFiles: [...changed] });
  }

  /** Runs the gates and lets the model fix its own mess until the budget runs out. */
  private async verifyAndRepair(
    changed: Set<string>,
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    const budget = this.deps.config.verify.maxRepairAttempts;

    for (let attempt = 0; attempt <= budget; attempt += 1) {
      this.deps.emit({ type: 'phase', phase: 'verifying' });
      const report = await this.verifier.run();
      this.deps.emit({ type: 'verification', report });

      if (report.passed) return { ok: true };
      if (attempt === budget) {
        return {
          ok: false,
          reason: `\`${report.failedGate}\` still fails after ${budget} repair attempts.`,
        };
      }

      this.deps.emit({ type: 'phase', phase: 'repairing' });
      this.deps.emit({
        type: 'repair-started',
        attempt: attempt + 1,
        gate: report.failedGate ?? 'unknown',
      });

      const healed = await heal(report, {
        root: this.deps.root,
        backend: this.backend,
        editor: this.editor,
        profile: this.profile,
        temperature: this.deps.config.model.actorTemperature,
        maxTokens: this.deps.config.model.maxOutputTokens,
        maxFilesInContext: 2,
        emit: this.deps.emit,
      });

      if (healed.status === 'failed') {
        return { ok: false, reason: `Repair attempt ${attempt + 1} failed: ${healed.reason}` };
      }
      for (const path of healed.paths) changed.add(path);
    }

    return { ok: false, reason: 'Exhausted the repair budget.' };
  }

  /**
   * Establishes that the gates pass before the agent changes anything.
   *
   * This is what makes a later failure attributable. It also catches the duller problem that
   * costs more time in practice: a verify command that is simply wrong for this project, which
   * otherwise surfaces as the model being blamed for errors it cannot see or fix.
   */
  private async guardBaseline(): Promise<void> {
    if (!this.deps.config.verify.requireCleanBaseline) return;

    this.deps.emit({ type: 'phase', phase: 'verifying' });
    const report = await this.verifier.run();
    if (report.passed) return;

    throw new UserFacingError(
      `\`${report.command}\` already fails before any edits, so the agent cannot tell its own mistakes from existing ones.`,
      `Fix it first, correct the command in .lvc/config.json, or set verify.requireCleanBaseline to false.\n\n${firstLines(report.rawOutput, 10)}`,
    );
  }

  private async guardWorkingTree(): Promise<void> {
    if (!this.deps.config.safety.requireCleanTree) return;
    if (!(await this.checkpoints.isGitRepository())) {
      throw new UserFacingError(
        'This directory is not a git repository.',
        'The agent rewrites files; git is how you undo that. Run `git init` first, or set safety.requireCleanTree to false.',
      );
    }
    if (!(await this.checkpoints.isClean())) {
      throw new UserFacingError(
        'The working tree has uncommitted changes.',
        'Commit or stash them so the agent’s edits are reviewable on their own.',
      );
    }
  }

  private async checkpoint(task: string): Promise<void> {
    if (!this.deps.config.safety.checkpoint) return;
    if (!(await this.checkpoints.isGitRepository())) return;
    await this.checkpoints.create(`lvc: before "${task.slice(0, 60)}"`);
  }

  private finish(outcome: AgentOutcome): AgentOutcome {
    this.deps.emit({ type: 'done', outcome });
    return outcome;
  }
}

function firstLines(text: string, count: number): string {
  return text.split('\n').slice(0, count).join('\n').trim();
}
