import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR, templateDir } from '../paths.ts';
import { readSetup, specs } from './pool-fs-wave-b.ts';

/**
 * Trust check for the generated hidden tests: each must pass on the reference implementation and fail
 * on the starting project of its task. Usage: node src/dataset/pool-fs-hidden-check.ts [family ...]
 */
const WORK = path.join(BENCH_DIR, '.work', 'pool-fs-hidden-check');
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function workspace(files: Map<string, string>, hiddenFile: string, hiddenTest: string): string {
  const template = templateDir('fullstack');
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.cpSync(template, WORK, { recursive: true, filter: (src) => !/\/(node_modules|data)(\/|$)/.test(src) });
  fs.symlinkSync(path.join(template, 'node_modules'), path.join(WORK, 'node_modules'));
  for (const [file, content] of files) {
    fs.mkdirSync(path.dirname(path.join(WORK, file)), { recursive: true });
    fs.writeFileSync(path.join(WORK, file), content);
  }
  fs.mkdirSync(path.join(WORK, 'server', '__bench__'), { recursive: true });
  fs.writeFileSync(path.join(WORK, 'server', '__bench__', hiddenFile), hiddenTest);
  return WORK;
}

function passes(dir: string, hiddenFile: string): { ok: boolean; tail: string } {
  try {
    execFileSync('npx', ['vitest', 'run', '--project', 'api', `server/__bench__/${hiddenFile}`], { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
    return { ok: true, tail: '' };
  } catch (error: unknown) {
    const out = `${(error as { stdout?: string }).stdout ?? ''}`;
    return { ok: false, tail: out.split('\n').filter((l) => /×|Error|expected|FAIL/.test(l)).slice(0, 6).join('\n') };
  }
}

const wanted = process.argv.slice(2);
let bad = 0;
let checked = 0;
for (const spec of specs()) {
  if (!spec.hidden) continue;
  if (wanted.length && !wanted.includes(spec.family)) continue;
  const k = kebab(spec.entity.plural);
  const routesFile = `server/features/${k}/routes.ts`;
  const label = `${spec.family}-${spec.entity.plural}`;

  const reference = readSetup(spec.entity.plural);
  reference.set(routesFile, spec.hidden.reference(reference.get(routesFile) ?? ''));
  const good = passes(workspace(reference, spec.hidden.file, spec.hidden.test), spec.hidden.file);

  const start = readSetup(spec.entity.plural);
  spec.plant?.(start);
  const untouched = passes(workspace(start, spec.hidden.file, spec.hidden.test), spec.hidden.file);

  checked += 1;
  if (good.ok && !untouched.ok) {
    console.log(`OK    ${label}`);
  } else {
    bad += 1;
    console.log(`BAD   ${label}: reference ${good.ok ? 'passes' : 'FAILS'}, starting project ${untouched.ok ? 'PASSES' : 'fails'}`);
    if (!good.ok) console.log(good.tail);
  }
}
fs.rmSync(WORK, { recursive: true, force: true });
console.log(`checked ${String(checked)}, bad ${String(bad)}`);
process.exitCode = bad ? 1 : 0;
