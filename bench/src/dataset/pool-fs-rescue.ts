import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR, RESULTS_DIR, templateDir } from '../paths.ts';
import { loadTask } from '../tasks.ts';
import type { RunResult } from '../types.ts';

/**
 * Rescue tasks: the starting project is a real broken state left by the fine-tuned model on a pool
 * task (its own failed attempt), and the goal is the original task. Unlike the synthetic repair tasks
 * (`pool-fs-repair.ts`, five breakages I invented), these are the holes the model digs itself, and the
 * original hidden tests still say whether the work was actually finished.
 *
 * Usage: node src/dataset/pool-fs-rescue.ts <runId> [outDir]
 */
const PREAMBLE_EN =
  'Someone started this task and left the project in a broken state: `npm run verify` fails. Their unfinished work is already in the files. Read the errors, fix what is broken, and finish the task as described below. Do not start over from scratch.';
const PREAMBLE_RU =
  'Кто-то начал эту задачу и оставил проект сломанным: `npm run verify` падает. Его незаконченная работа уже лежит в файлах. Разберись по ошибкам, почини сломанное и доведи задачу до конца, как описано ниже. Не начинай с нуля.';

/** Files that describe the state, not the code: they must not leak into the setup. */
const SKIP = /^(node_modules|data|drizzle\/meta\/_journal\.json$)/;

function listFiles(root: string, dir = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(root, rel));
    else out.push(rel);
  }
  return out;
}

export function generateRescue(runId: string, outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  const template = templateDir('fullstack');
  const runRoot = path.join(RESULTS_DIR, runId);
  let written = 0;
  let skipped = 0;
  const reasons = new Map<string, number>();

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name !== 'result.json') continue;
      const result = JSON.parse(fs.readFileSync(full, 'utf8')) as RunResult;
      const reason = result.grade.solved ? 'solved' : (result.grade.failureReason ?? 'unknown');
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
      // Only broken states worth rescuing: the agent left the project failing to build or test.
      if (result.grade.solved || !['typecheck', 'broke-existing-tests', 'lint', 'format'].includes(reason)) continue;
      const changedDir = path.join(path.dirname(full), 'changed');
      if (!fs.existsSync(changedDir)) continue;
      const changed = listFiles(changedDir).filter((f) => !SKIP.test(f));
      if (changed.length === 0) continue;

      const source = loadTask(result.task.id);
      const id = `FX${result.task.id.replace(/^F[BSR]?\d*-/, '')}-${reason}`.slice(0, 80);
      const dir2 = path.join(outDir, id);
      if (fs.existsSync(dir2)) {
        skipped += 1;
        continue;
      }
      fs.mkdirSync(path.join(dir2, 'setup'), { recursive: true });

      // Setup = the task's own setup (if any), then the agent's broken files on top.
      const setupDir = path.join(source.dir, 'setup');
      if (fs.existsSync(setupDir)) {
        for (const file of listFiles(setupDir)) {
          const target = path.join(dir2, 'setup', file);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(path.join(setupDir, file), target);
        }
      }
      for (const file of changed) {
        const target = path.join(dir2, 'setup', file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(path.join(changedDir, file), target);
      }
      // A file the agent created that the template does not have is part of the broken state too;
      // nothing to do for deletions: the run's `changed` only records files present at the end.

      const isRu = source.tags?.includes('ru') ?? false;
      const preamble = isRu ? PREAMBLE_RU : PREAMBLE_EN;
      fs.writeFileSync(path.join(dir2, 'prompt.md'), `${preamble}\n\n---\n\n${source.prompt.trim()}\n`);
      const meta = {
        id,
        title: `Rescue: ${source.title}`.slice(0, 70),
        template: 'fullstack',
        layer: source.layer,
        work: 'fix',
        difficulty: source.difficulty,
        formulation: 'product',
        tags: ['pool', 'fullstack', 'rescue', reason, ...(source.tags ?? []).filter((t) => t === 'ru')],
        rescuedFrom: { runId, task: result.task.id, rep: result.rep, turns: result.agent.turns },
      };
      fs.writeFileSync(path.join(dir2, 'task.json'), JSON.stringify(meta, null, 2) + '\n');
      // The original checks and hidden tests decide whether the task was actually finished.
      for (const extra of ['checks.json', 'hidden', 'hidden-api']) {
        const from = path.join(source.dir, extra);
        if (fs.existsSync(from)) fs.cpSync(from, path.join(dir2, extra), { recursive: true });
      }
      written += 1;
    }
  };
  walk(runRoot);
  console.log(`rescue: ${String(written)} task dirs written to ${outDir}, ${String(skipped)} already existed`);
  console.log(`source runs by outcome: ${[...reasons].map(([k, v]) => `${k} ${String(v)}`).join(', ')}`);
  console.log(`template: ${template}`);
}

if (process.argv[1]?.endsWith('pool-fs-rescue.ts')) {
  const [runId = 'ft4b-pool', outDir = path.join(BENCH_DIR, 'pool-fs', 'tasks')] = process.argv.slice(2);
  generateRescue(runId, outDir);
}
