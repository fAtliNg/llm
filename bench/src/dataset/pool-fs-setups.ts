import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR, templateDir } from '../paths.ts';
import { applyPatch, generateEntity } from './entity-codegen.ts';
import { GEN_ENTITIES } from './pool-fs-entities.ts';

/**
 * Builds and verifies the starting projects of the second-wave pool tasks: for every pool entity the
 * generated feature is applied to a copy of the full-stack template, the migration is generated,
 * eslint and prettier fix the style, and `npm run verify` must be green. The files that differ from
 * the template are stored in `pool-fs/setups/<plural>`. Usage: node src/dataset/pool-fs-setups.ts [plural ...]
 */
const OUT = path.join(BENCH_DIR, 'pool-fs', 'setups');
const WORK = path.join(BENCH_DIR, '.work', 'pool-fs-setups');

function listFiles(root: string, dir = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['node_modules', 'data', 'dist', '.git'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(root, rel));
    else out.push(rel);
  }
  return out;
}

function build(plural: string): void {
  const entity = GEN_ENTITIES.find((e) => e.plural === plural);
  if (!entity) throw new Error(`unknown entity ${plural}`);
  const template = templateDir('fullstack');
  const workspace = path.join(WORK, plural);
  fs.rmSync(workspace, { recursive: true, force: true });
  fs.mkdirSync(workspace, { recursive: true });
  for (const file of listFiles(template)) {
    fs.mkdirSync(path.dirname(path.join(workspace, file)), { recursive: true });
    fs.copyFileSync(path.join(template, file), path.join(workspace, file));
  }
  fs.symlinkSync(path.join(template, 'node_modules'), path.join(workspace, 'node_modules'));

  const { files, patches } = generateEntity(entity);
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(workspace, file)), { recursive: true });
    fs.writeFileSync(path.join(workspace, file), content);
  }
  for (const patch of patches) {
    const target = path.join(workspace, patch.file);
    fs.writeFileSync(target, applyPatch(fs.readFileSync(target, 'utf8'), patch));
  }

  const sh = (command: string, args: string[]) => execFileSync(command, args, { cwd: workspace, stdio: 'pipe', encoding: 'utf8' });
  sh('npx', ['drizzle-kit', 'generate', '--name', `add_${plural}`]);
  try {
    sh('npx', ['eslint', '--fix', '.']);
  } catch {
    // Unfixable findings are reported by verify below.
  }
  sh('npx', ['prettier', '--write', '.']);
  try {
    sh('npm', ['run', 'verify']);
  } catch (error: unknown) {
    const out = (error as { stdout?: string; stderr?: string }).stdout ?? '';
    throw new Error(`${plural}: verify failed\n${out.split('\n').slice(-40).join('\n')}`);
  }

  const target = path.join(OUT, plural);
  fs.rmSync(target, { recursive: true, force: true });
  let changed = 0;
  for (const file of listFiles(workspace)) {
    const original = path.join(template, file);
    const current = fs.readFileSync(path.join(workspace, file));
    if (fs.existsSync(original) && fs.readFileSync(original).equals(current)) continue;
    fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
    fs.writeFileSync(path.join(target, file), current);
    changed += 1;
  }
  fs.rmSync(workspace, { recursive: true, force: true });
  console.log(`${plural}: verify green, ${String(changed)} files -> ${path.relative(BENCH_DIR, target)}`);
}

const wanted = process.argv.slice(2);
for (const entity of GEN_ENTITIES) {
  if (wanted.length && !wanted.includes(entity.plural)) continue;
  build(entity.plural);
}
