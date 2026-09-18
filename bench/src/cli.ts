import fs from 'node:fs';
import path from 'node:path';

import { runAgent } from './agent.ts';
import { analysisMarkdown, diagnose } from './diagnostics.ts';
import { killAll } from './exec.ts';
import { startGeminiProxy } from './gemini-proxy.ts';
import { grade } from './grade.ts';
import { CONFIGS_DIR, RESULTS_DIR, WORK_DIR } from './paths.ts';
import { report } from './report.ts';
import { loadTask, loadTasks } from './tasks.ts';
import type { BenchConfig, RunResult, Task } from './types.ts';
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
  createWorkspace(workspace, task.template);
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

/**
 * Runs every (config, task, rep) combination. A run id can be reused to resume: combinations
 * that already have a result.json are skipped, so a stopped run continues where it left off
 * and `--reps 3` after `--reps 1` only adds the missing repetitions.
 */
function acquireLock(runId: string): () => void {
  const dir = path.join(RESULTS_DIR, runId);
  const lock = path.join(dir, '.lock');
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(lock)) {
    const pid = Number(fs.readFileSync(lock, 'utf8'));
    let alive = false;
    try {
      process.kill(pid, 0);
      // In a container the runner is always pid 1, so a stale lock from a killed run points at ourselves.
      alive = pid !== process.pid;
    } catch {
      alive = false;
    }
    if (alive) throw new Error(`run ${runId} is already running (pid ${String(pid)}); stop it or pick another --run-id`);
  }
  fs.writeFileSync(lock, String(process.pid));
  return () => fs.rmSync(lock, { force: true });
}

async function run(tasks: Task[], configNames: string[], reps: number, runId: string, parallel = 1): Promise<void> {
  const releaseLock = acquireLock(runId);
  const configs = configNames.map((name) => [name, loadConfig(name)] as const);
  const stopProxy = configs.some(([, c]) => c.model.startsWith('google-throttled/')) ? await startGeminiProxy() : null;
  const finish = () => {
    releaseLock();
    stopProxy?.();
  };
  console.log(`run ${runId}  configs=${configNames.join(',')}  tasks=${String(tasks.length)}  reps=${String(reps)}${parallel > 1 ? `  parallel=${String(parallel)}` : ''}`);
  let done = 0;
  let skipped = 0;
  // Jobs are taken in order by `parallel` workers; cloud models spend most of the time waiting
  // on the API, so several agents at once cost little on the local machine. Keep 1 for local models.
  const jobs: { configName: string; config: ReturnType<typeof loadConfig>; task: Task; rep: number }[] = [];
  for (const [configName, config] of configs) {
    for (const task of tasks) {
      for (let rep = 1; rep <= reps; rep += 1) jobs.push({ configName, config, task, rep });
    }
  }
  let aborted: string | null = null;
  const worker = async (): Promise<void> => {
    for (;;) {
      const job = jobs.shift();
      if (!job || stopping || aborted) return;
      const { configName, config, task, rep } = job;
      const outDir = path.join(RESULTS_DIR, runId, configName, task.id, String(rep));
      if (fs.existsSync(path.join(outDir, 'result.json'))) {
        skipped += 1;
        continue;
      }
      const workspace = path.join(WORK_DIR, runId, configName, task.id, String(rep));
      prepare(task, workspace);
      const started = Date.now();
      const agent = await runAgent(task, config, workspace, outDir);
      if (agent.apiError && agent.timeline.length === 0) {
        fs.rmSync(outDir, { recursive: true, force: true });
        aborted = `provider error on ${configName}/${task.id}:\n${agent.apiError}`;
        return;
      }
      if (stopping) {
        console.log(`stopped during ${configName}/${task.id}/${String(rep)}; rerun with --run-id ${runId} to resume`);
        return;
      }
      const result = await grade(workspace, task, outDir);
      const diagnostics = diagnose(workspace, task, agent, result);
      applyPoolRules(task, result, diagnostics);
      saveChangedFiles(workspace, diagnostics.changedFiles, outDir);
      const record = { runId, config: configName, task: stripTask(task), rep, agent, grade: result, diagnostics, workspace };
      fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(record, null, 2));
      fs.writeFileSync(path.join(outDir, 'analysis.md'), analysisMarkdown({ task, config: configName, rep, agent, grade: result, diagnostics }));
      done += 1;
      const minutes = ((Date.now() - started) / 60000).toFixed(1);
      line(task, result.solved, `${configName}, ${agent.timedOut ? 'timeout, ' : ''}${agent.turnCapped ? 'turn cap, ' : ''}${result.failureReason ?? 'solved'}, ${String(agent.turns)} turns, ${minutes} min`);
      for (const comment of diagnostics.comments) console.log(`        · ${comment}`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, parallel) }, () => worker()));
  finish();
  if (aborted) {
    console.error(`\n${aborted}\nstopping the run so results stay clean`);
    process.exitCode = 2;
    return;
  }
  if (stopping) return;
  console.log(`\ndone ${String(done)}, skipped ${String(skipped)} (already had results)`);
  console.log(`results: ${path.join(RESULTS_DIR, runId)}`);
}

let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (stopping) process.exit(130);
    stopping = true;
    console.log(`\n${signal}: stopping after the current agent is killed...`);
    killAll();
  });
}

function stripTask(task: Task) {
  const { dir: _dir, prompt: _prompt, hasSetup: _s, hasSolution: _sol, mutants: _m, checks: _c, ...meta } = task;
  return meta;
}

/**
 * Copies the files the agent added or modified into <outDir>/changed right after grading. Workspaces are
 * disposable (and small models delete them: base 4B wiped 48 of its 58 with `rm -rf`), but the final state
 * of a failed attempt is the raw material for repair-style training data.
 */
function saveChangedFiles(workspace: string, changedFiles: string[], outDir: string): void {
  for (const entry of changedFiles) {
    const kind = entry.slice(0, 1);
    const rel = entry.slice(2);
    if (kind === '-' || rel.includes('..')) continue;
    const from = path.join(workspace, rel);
    try {
      if (!fs.statSync(from).isFile() || fs.statSync(from).size > 512 * 1024) continue;
      const to = path.join(outDir, 'changed', rel);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    } catch {
      // the agent may have deleted the file or the whole workspace; nothing to save then
    }
  }
}

/** Pool tasks have no hidden tests: an untouched workspace is never a solution. */
function applyPoolRules(task: Task, result: Awaited<ReturnType<typeof grade>>, diagnostics: ReturnType<typeof diagnose>): void {
  if (!task.tags?.includes('pool')) return;
  if (result.solved && diagnostics.changedFiles.length === 0) {
    result.solved = false;
    result.failureReason = 'no-changes';
  }
}

/** Re-grades finished runs against the current task definitions (after a hidden test or check was fixed). */
async function regrade(runId: string, taskFilter: string | undefined): Promise<void> {
  const wanted = taskFilter && taskFilter !== 'all' ? new Set(taskFilter.split(',').map((t) => t.trim())) : null;
  const root = path.join(RESULTS_DIR, runId);
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'result.json') files.push(full);
    }
  };
  walk(root);
  for (const file of files) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8')) as RunResult;
    if (wanted && !wanted.has(record.task.id)) continue;
    if (!fs.existsSync(record.workspace)) {
      console.log(`skip ${record.config}/${record.task.id}: workspace gone`);
      continue;
    }
    const task = loadTask(record.task.id);
    const before = record.grade.solved;
    record.grade = await grade(record.workspace, task, path.dirname(file));
    record.diagnostics = diagnose(record.workspace, task, record.agent, record.grade);
    applyPoolRules(task, record.grade, record.diagnostics);
    fs.writeFileSync(file, JSON.stringify(record, null, 2));
    fs.writeFileSync(path.join(path.dirname(file), 'analysis.md'), analysisMarkdown({ task, config: record.config, rep: record.rep, agent: record.agent, grade: record.grade, diagnostics: record.diagnostics }));
    console.log(`${record.grade.solved ? 'PASS' : 'FAIL'}  ${record.config}/${record.task.id}/${String(record.rep)}  ${before === record.grade.solved ? '(unchanged)' : `(was ${before ? 'PASS' : 'FAIL'})`}  ${record.grade.failureReason ?? ''}`);
  }
}

/** Recomputes diagnostics and analysis.md for finished runs whose workspaces still exist. */
function rediagnose(runId: string): void {
  const root = path.join(RESULTS_DIR, runId);
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'result.json') {
        const record = JSON.parse(fs.readFileSync(full, 'utf8')) as RunResult;
        if (!fs.existsSync(record.workspace)) return;
        const task = loadTask(record.task.id);
        record.diagnostics = diagnose(record.workspace, task, record.agent, record.grade);
        fs.writeFileSync(full, JSON.stringify(record, null, 2));
        fs.writeFileSync(path.join(dir, 'analysis.md'), analysisMarkdown({ task, config: record.config, rep: record.rep, agent: record.agent, grade: record.grade, diagnostics: record.diagnostics }));
        console.log(`rediagnosed ${record.config}/${record.task.id}/${String(record.rep)}`);
      }
    }
  };
  walk(root);
}

const HELP = `bench commands:
  validate [all|T01,T02]           reference solutions must pass
  null [all|T01,T02]               untouched workspace must fail
  run --configs <a,b> [--tasks all|T01,..] [--reps N] [--run-id <id>] [--parallel N]
                                   reuse --run-id to resume a stopped run or add reps
  report [--run-id <a,b>]          aggregate bench/results (all runs, or the listed run ids) into markdown
  regrade --run-id <id> [--tasks]  re-grade finished runs after a task's tests or checks changed
  rediagnose --run-id <id>         recompute diagnostics/analysis.md for finished runs
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
      const configs = options.configs ?? options.config;
      if (!configs) throw new Error('--config <name> or --configs <a,b,c> is required');
      await run(loadTasks(options.tasks), configs.split(','), Number(options.reps ?? '1'), options['run-id'] ?? stamp(), Number(options.parallel ?? '1'));
      break;
    }
    case 'report': {
      const markdown = report(options['run-id']);
      console.log(markdown);
      const file = path.join(RESULTS_DIR, options['run-id'] ? `report-${options['run-id'].replace(/,/g, '+')}.md` : 'report.md');
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
      fs.writeFileSync(file, markdown);
      console.log(`\nwritten to ${file}`);
      break;
    }
    case 'regrade':
      if (!options['run-id']) throw new Error('--run-id is required');
      await regrade(options['run-id'], options.tasks);
      break;
    case 'rediagnose':
      if (!options['run-id']) throw new Error('--run-id is required');
      rediagnose(options['run-id']);
      break;
    case 'list':
      for (const task of loadTasks(positional[0] ?? options.tasks ?? 'all')) {
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
