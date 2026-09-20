import fs from 'node:fs';
import path from 'node:path';

import { exec, tail } from './exec.ts';
import { HIDDEN_API_TESTS_DIR, HIDDEN_TESTS_DIR } from './paths.ts';
import type { Grade, Stage, Task } from './types.ts';
import { listFiles, overlay, restore, snapshot } from './workspace.ts';

const NPM = 'npm';
const STAGE_TIMEOUT = 5 * 60 * 1000;

async function npmStage(workspace: string, script: string, logFile: string): Promise<Stage> {
  const result = await exec(NPM, ['run', '--silent', script], { cwd: workspace, timeoutMs: STAGE_TIMEOUT });
  const output = `${result.stdout}\n${result.stderr}`;
  fs.writeFileSync(logFile, output);
  return { ok: result.code === 0 && !result.timedOut, tail: tail(output), seconds: result.seconds };
}

interface VitestJson {
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  success: boolean;
}

async function vitest(
  workspace: string,
  filter: string,
  jsonFile: string,
): Promise<{ stage: Stage; passed: number; failed: number; output: string }> {
  const result = await exec(
    'npx',
    ['vitest', 'run', filter, '--reporter=json', `--outputFile=${jsonFile}`, '--reporter=default'],
    { cwd: workspace, timeoutMs: STAGE_TIMEOUT },
  );
  let passed = 0;
  let failed = 0;
  let success = false;
  if (fs.existsSync(jsonFile)) {
    const parsed = JSON.parse(fs.readFileSync(jsonFile, 'utf8')) as VitestJson;
    passed = parsed.numPassedTests;
    failed = parsed.numFailedTests;
    success = parsed.success && parsed.numTotalTests > 0;
  }
  const output = `${result.stdout}\n${result.stderr}`;
  return {
    stage: { ok: success && result.code === 0, tail: tail(output), seconds: result.seconds },
    passed,
    failed,
    output,
  };
}

async function runChecks(workspace: string, task: Task): Promise<{ ok: boolean; failures: string[] }> {
  const failures: string[] = [];
  for (const check of task.checks) {
    if (check.type === 'command') {
      const result = await exec('/bin/bash', ['-c', check.run], { cwd: workspace, timeoutMs: STAGE_TIMEOUT });
      const failed = result.code !== 0 || result.timedOut;
      if ((check.expect === 'fail') !== failed) {
        failures.push(`${check.label ?? check.run}: expected to ${check.expect}, exit ${String(result.code)}`);
      }
      continue;
    }
    const file = path.join(workspace, check.path);
    if (check.type === 'file-exists') {
      if (!fs.existsSync(file)) failures.push(`missing file: ${check.path}`);
      continue;
    }
    if (!fs.existsSync(file)) {
      failures.push(`missing file for grep: ${check.path}`);
      continue;
    }
    const count = (fs.readFileSync(file, 'utf8').match(new RegExp(check.pattern, 'g')) ?? []).length;
    if (check.min !== undefined && count < check.min) {
      failures.push(`${check.path}: /${check.pattern}/ found ${count}, expected at least ${check.min}`);
    }
    if (check.max !== undefined && count > check.max) {
      failures.push(`${check.path}: /${check.pattern}/ found ${count}, expected at most ${check.max}`);
    }
  }
  return { ok: failures.length === 0, failures };
}

/** Each mutant must make the tests named by task.testGlob fail. A surviving mutant means weak tests. */
async function runMutants(workspace: string, task: Task, outDir: string): Promise<{ ok: boolean; survived: string[] }> {
  const survived: string[] = [];
  if (task.mutants.length === 0) return { ok: true, survived };
  if (!task.testGlob) throw new Error(`Task ${task.id} has mutants but no testGlob`);
  for (const mutant of task.mutants) {
    const mutantDir = path.join(task.dir, 'mutants', mutant);
    const saved = snapshot(workspace, listFiles(mutantDir));
    overlay(workspace, mutantDir);
    const { stage, failed } = await vitest(workspace, task.testGlob, path.join(outDir, `mutant-${mutant}.json`));
    restore(workspace, saved);
    if (stage.ok || failed === 0) survived.push(mutant);
  }
  return { ok: survived.length === 0, survived };
}

function failureReason(grade: Omit<Grade, 'solved' | 'failureReason'>): string | null {
  if (!grade.typecheck.ok) return 'typecheck';
  if (!grade.tests.ok) return 'broke-existing-tests';
  if (!grade.hidden.ok) return 'wrong-behavior';
  if (!grade.checks.ok) return 'structure';
  if (!grade.mutants.ok) return 'weak-tests';
  if (!grade.lint.ok) return 'lint';
  if (!grade.format.ok) return 'format';
  return null;
}

/** Full grading of a workspace: verify stages, then hidden tests, checks and mutants. */
export async function grade(workspace: string, task: Task, outDir: string): Promise<Grade> {
  fs.mkdirSync(outDir, { recursive: true });
  const typecheck = await npmStage(workspace, 'typecheck', path.join(outDir, 'typecheck.log'));
  const lint = await npmStage(workspace, 'lint', path.join(outDir, 'lint.log'));
  const format = await npmStage(workspace, 'format:check', path.join(outDir, 'format.log'));
  const tests = await npmStage(workspace, 'test', path.join(outDir, 'tests.log'));

  // Hidden tests: `hidden/` goes into the web project, `hidden-api/` into the API project (full-stack tasks).
  let hiddenRun: Awaited<ReturnType<typeof vitest>> = {
    stage: { ok: true, tail: 'no hidden tests', seconds: 0 },
    passed: 0,
    failed: 0,
    output: '',
  };
  const suites = [
    { source: path.join(task.dir, 'hidden'), target: HIDDEN_TESTS_DIR, json: 'hidden.json' },
    { source: path.join(task.dir, 'hidden-api'), target: HIDDEN_API_TESTS_DIR, json: 'hidden-api.json' },
  ].filter((suite) => fs.existsSync(suite.source));
  if (suites.length > 0) {
    const runs: Awaited<ReturnType<typeof vitest>>[] = [];
    for (const suite of suites) {
      const target = path.join(workspace, suite.target);
      fs.rmSync(target, { recursive: true, force: true });
      fs.mkdirSync(target, { recursive: true });
      fs.cpSync(suite.source, target, { recursive: true });
      runs.push(await vitest(workspace, suite.target, path.join(outDir, suite.json)));
      fs.rmSync(target, { recursive: true, force: true });
    }
    hiddenRun = {
      stage: {
        ok: runs.every((run) => run.stage.ok),
        tail: runs.map((run) => run.stage.tail).join('\n'),
        seconds: runs.reduce((sum, run) => sum + run.stage.seconds, 0),
      },
      passed: runs.reduce((sum, run) => sum + run.passed, 0),
      failed: runs.reduce((sum, run) => sum + run.failed, 0),
      output: runs.map((run) => run.output).join('\n'),
    };
    fs.writeFileSync(path.join(outDir, 'hidden.log'), hiddenRun.output);
  }

  const checks = await runChecks(workspace, task);
  const mutants = await runMutants(workspace, task, outDir);

  const partial = {
    typecheck,
    lint,
    format,
    tests,
    hidden: { ...hiddenRun.stage, passed: hiddenRun.passed, failed: hiddenRun.failed },
    checks,
    mutants,
  };
  const reason = failureReason(partial);
  return { ...partial, solved: reason === null, failureReason: reason };
}
