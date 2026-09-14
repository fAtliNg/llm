import fs from 'node:fs';
import path from 'node:path';

import { exec, tail } from './exec.ts';
import { HIDDEN_TESTS_DIR } from './paths.ts';
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
): Promise<{ stage: Stage; passed: number; failed: number }> {
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
  };
}

function runChecks(workspace: string, task: Task): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const check of task.checks) {
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

  const hiddenSource = path.join(task.dir, 'hidden');
  let hiddenRun: Awaited<ReturnType<typeof vitest>> = {
    stage: { ok: true, tail: 'no hidden tests', seconds: 0 },
    passed: 0,
    failed: 0,
  };
  if (fs.existsSync(hiddenSource)) {
    const hiddenTarget = path.join(workspace, HIDDEN_TESTS_DIR);
    fs.rmSync(hiddenTarget, { recursive: true, force: true });
    fs.mkdirSync(hiddenTarget, { recursive: true });
    fs.cpSync(hiddenSource, hiddenTarget, { recursive: true });
    hiddenRun = await vitest(workspace, HIDDEN_TESTS_DIR, path.join(outDir, 'hidden.json'));
    fs.writeFileSync(path.join(outDir, 'hidden.log'), hiddenRun.stage.tail);
    fs.rmSync(hiddenTarget, { recursive: true, force: true });
  }

  const checks = runChecks(workspace, task);
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
