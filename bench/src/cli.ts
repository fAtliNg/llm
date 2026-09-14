import fs from 'node:fs';
import path from 'node:path';

import { runAgent } from './agent.ts';
import { grade } from './grade.ts';
import { CONFIGS_DIR, RESULTS_DIR, WORK_DIR } from './paths.ts';
import { report } from './report.ts';
import { loadTasks } from './tasks.ts';
import type { BenchConfig, Task } from './types.ts';
import { createWorkspace, overlay } from './workspace.ts';

interface Args {
  command: string;
  positional: string[];
  options: Record<string, string>;
}

function parseArgs(argv: string[]): Args {
  const [command = 'help', ...rest] = argv;
  const positional: string[] = [];
  const options: Record<string, string> = {};
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i]!;
    if (arg.startsWith('--')) {
      const next = rest[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        options[arg.slice(2)] = next;
        i += 1;
      } else options[arg.slice(2)] = 'true';
    } else positional.push(arg);
  }
  return { command, positional, options };
}

function loadConfig(name: string): BenchConfig {
  const file = path.join(CONFIGS_DIR, `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Unknown config: ${name} (expected ${file})`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as BenchConfig;
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function prepare(task: Task, workspace: string): void {
  createWorkspace(workspace);
  if (task.hasSetup) overlay(workspace, path.join(task.dir, 'setup'));
}

function line(task: Task, ok: boolean, detail: string): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${task.id}  ${task.title}${detail ? `  [${detail}]` : ''}`);
}

/** validate: the reference solution must pass everything. */
async function validate(tasks: Task[]): Promise<boolean> {
  let allOk = true;
  for (const task of tasks) {
    if (!task.hasSolution) {
      line(task, false, 'no solution/');
      allOk = false;
      continue;
    }
    const workspace = path.join(WORK_DIR, 'validate', task.id);
    prepare(task, workspace);
    overlay(workspace, path.join(task.dir, 'solution'));
    const result = await grade(workspace, task, path.join(RESULTS_DIR, 'validate', task.id));
    line(task, result.solved, result.failureReason ?? '');
    if (!result.solved) {
      allOk = false;
      printFailure(result);
    }
  }
  return allOk;
}

/** null: an untouched workspace must fail hidden tests or checks. */
async function nullRun(tasks: Task[]): Promise<boolean> {
  let allOk = true;
  for (const task of tasks) {
    const workspace = path.join(WORK_DIR, 'null', task.id);
    prepare(task, workspace);
    const result = await grade(workspace, task, path.join(RESULTS_DIR, 'null', task.id));
    const detected = !result.hidden.ok || !result.checks.ok || !result.mutants.ok;
    line(task, detected, detected ? `fails on ${result.failureReason ?? '?'}` : 'passes without changes!');
    if (!detected) allOk = false;
  }
  return allOk;
}

function printFailure(result: Awaited<ReturnType<typeof grade>>): void {
  const stages = ['typecheck', 'lint', 'format', 'tests', 'hidden'] as const;
  for (const stage of stages) {
    if (!result[stage].ok) {
      console.log(`  --- ${stage} ---`);
      console.log(result[stage].tail.split('\n').map((l) => `  ${l}`).join('\n'));
    }
  }
  if (result.checks.failures.length) console.log(`  checks: ${result.checks.failures.join('; ')}`);
  if (result.mutants.survived.length) console.log(`  surviving mutants: ${result.mutants.survived.join(', ')}`);
}

async function run(tasks: Task[], configName: string, reps: number): Promise<void> {
  const config = loadConfig(configName);
  const runId = stamp();
  console.log(`run ${runId}  config=${configName}  model=${config.model}  tasks=${String(tasks.length)}  reps=${String(reps)}`);
  for (const task of tasks) {
    for (let rep = 1; rep <= reps; rep += 1) {
      const workspace = path.join(WORK_DIR, runId, configName, task.id, String(rep));
      const outDir = path.join(RESULTS_DIR, runId, configName, task.id, String(rep));
      prepare(task, workspace);
      const started = Date.now();
      const agent = await runAgent(task, config, workspace, outDir);
      const result = await grade(workspace, task, outDir);
      const record = { runId, config: configName, task: stripTask(task), rep, agent, grade: result, workspace };
      fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(record, null, 2));
      const minutes = ((Date.now() - started) / 60000).toFixed(1);
      line(task, result.solved, `${agent.timedOut ? 'timeout, ' : ''}${result.failureReason ?? 'solved'}, ${String(agent.turns)} turns, ${minutes} min`);
    }
  }
  console.log(`\nresults: ${path.join(RESULTS_DIR, runId)}`);
}

function stripTask(task: Task) {
  const { dir: _dir, prompt: _prompt, hasSetup: _s, hasSolution: _sol, mutants: _m, checks: _c, ...meta } = task;
  return meta;
}

const HELP = `bench commands:
  validate [all|T01,T02]           reference solutions must pass
  null [all|T01,T02]               untouched workspace must fail
  run --config <name> [--tasks all|T01,..] [--reps N]
  report                           aggregate bench/results into markdown
  list                             list tasks`;

async function main(): Promise<void> {
  const { command, positional, options } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'validate':
      process.exitCode = (await validate(loadTasks(positional[0]))) ? 0 : 1;
      break;
    case 'null':
      process.exitCode = (await nullRun(loadTasks(positional[0]))) ? 0 : 1;
      break;
    case 'run': {
      if (!options.config) throw new Error('--config is required');
      await run(loadTasks(options.tasks), options.config, Number(options.reps ?? '1'));
      break;
    }
    case 'report':
      console.log(report());
      break;
    case 'list':
      for (const task of loadTasks('all')) {
        console.log(`${task.id}  d${String(task.difficulty)}  ${task.layer.padEnd(9)} ${task.work.padEnd(8)} ${task.formulation.padEnd(7)} ${task.title}`);
      }
      break;
    default:
      console.log(HELP);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
