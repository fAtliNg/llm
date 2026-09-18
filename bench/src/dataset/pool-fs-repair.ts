import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR } from '../paths.ts';
import type { Check } from '../types.ts';
import { names, type GenEntity } from './entity-codegen.ts';
import { GEN_ENTITIES } from './pool-fs-entities.ts';
import { HELD_OUT } from './pool-fs.ts';
import { readSetup } from './pool-fs-wave-b.ts';

/**
 * Repair tasks: the starting project is a generated entity feature broken the way the base 4B breaks
 * projects on the benchmark (2026-09-18 run: files without imports, an import of a module that does not
 * exist, unused declarations, a broken drizzle import), and the prompt is only "verify is red, make it
 * green". The teacher's trajectories then show how to read a red verify and fix exactly these errors.
 * Prefix `FR`. Usage: node src/dataset/pool-fs-repair.ts [outDir]
 */
interface Breakage {
  kind: string;
  en: string;
  ru: string;
  /** Returns false when the breakage does not apply to this entity. */
  apply: (files: Map<string, string>, e: GenEntity) => boolean;
  checks?: (e: GenEntity) => Check[];
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function replaceOnce(files: Map<string, string>, file: string, from: string | RegExp, to: string): boolean {
  const content = files.get(file);
  if (content === undefined) return false;
  const next = content.replace(from, to);
  if (next === content) return false;
  files.set(file, next);
  return true;
}

const BREAKAGES: Breakage[] = [
  {
    kind: 'no-ui-imports',
    en: 'the table components are used without being imported',
    ru: 'компоненты таблицы используются без импорта',
    apply: (files, e) => replaceOnce(files, `src/features/${kebab(e.plural)}/${kebab(e.singular)}-list.tsx`, /import \{\n  Table,[\s\S]*?\} from '@\/components\/ui\/table';\n/, ''),
  },
  {
    kind: 'no-zod-import',
    en: 'the contract uses `z` without importing zod',
    ru: 'контракт использует `z` без импорта zod',
    apply: (files, e) => replaceOnce(files, `shared/${kebab(e.plural)}.ts`, "import { z } from 'zod';\n\n", ''),
  },
  {
    kind: 'wrong-module',
    en: 'the routes import the contract from a module that does not exist',
    ru: 'маршруты импортируют контракт из несуществующего модуля',
    apply: (files, e) => replaceOnce(files, `server/features/${kebab(e.plural)}/routes.ts`, `from '@shared/${kebab(e.plural)}';`, `from '@shared/${kebab(e.singular)}';`),
    checks: (e) => [{ type: 'grep-count', path: `server/features/${kebab(e.plural)}/routes.ts`, pattern: `@shared/${kebab(e.plural)}'`, min: 1 }],
  },
  {
    kind: 'no-eq-import',
    en: 'a drizzle helper is used without being imported',
    ru: 'вспомогательная функция drizzle используется без импорта',
    apply: (files, e) => replaceOnce(files, `server/features/${kebab(e.plural)}/routes.ts`, /import \{ ([^}]*)\beq, ([^}]*)\} from 'drizzle-orm';/, "import { $1$2} from 'drizzle-orm';") || replaceOnce(files, `server/features/${kebab(e.plural)}/routes.ts`, "import { eq } from 'drizzle-orm';\n", ''),
  },
  {
    kind: 'unused-declarations',
    en: 'a query result and an import are declared but never used',
    ru: 'результат запроса и импорт объявлены, но не используются',
    apply: (files, e) => {
      const n = names(e);
      const routes = `server/features/${kebab(e.plural)}/routes.ts`;
      const a = replaceOnce(files, routes, `  app.get('/', (c) =>`, `  const everything = db.select().from(${n.plural}).all();\n\n  app.get('/', (c) =>`) || replaceOnce(files, routes, `  app.get('/', (c) => c.json(db.select().from(${n.plural}).all()));`, `  const everything = db.select().from(${n.plural}).all();\n\n  app.get('/', (c) => c.json(db.select().from(${n.plural}).all()));`);
      const b = replaceOnce(files, `src/pages/${kebab(e.plural)}-page.tsx`, "import { Skeleton } from '@/components/ui/skeleton';\n", "import { Badge } from '@/components/ui/badge';\nimport { Skeleton } from '@/components/ui/skeleton';\n");
      return a && b;
    },
  },
];

/** Two breakages at once, the way real broken states look. */
const COMBOS: [string, string][] = [
  ['no-ui-imports', 'wrong-module'],
  ['no-zod-import', 'unused-declarations'],
  ['no-eq-import', 'no-ui-imports'],
];

function prompts(): { en: string; ru: string } {
  return {
    en: `\`npm run verify\` is red after someone's edits and the app no longer type-checks. Find out what is wrong from the errors, fix it without changing what the app does, and get verify green. Do not rewrite files from scratch: fix what is broken.`,
    ru: `После чьих-то правок \`npm run verify\` красный, проект не проходит проверку типов. Разберись по ошибкам, что сломано, почини, не меняя поведения приложения, и доведи verify до зелёного. Файлы с нуля не переписывай: чини то, что сломано.`,
  };
}

export function generateRepair(outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  let index = 0;
  let written = 0;
  const byKind = new Map<string, number>();
  const specs: { e: GenEntity; kinds: string[] }[] = [];
  for (const e of GEN_ENTITIES) {
    for (const b of BREAKAGES) specs.push({ e, kinds: [b.kind] });
    for (const combo of COMBOS) specs.push({ e, kinds: combo });
  }
  for (const { e, kinds } of specs) {
    index += 1;
    const files = readSetup(e.plural);
    const applied = kinds.map((kind) => {
      const b = BREAKAGES.find((x) => x.kind === kind);
      if (!b) throw new Error(`unknown breakage ${kind}`);
      return b.apply(files, e) ? b : null;
    });
    if (applied.some((b) => b === null)) continue;
    const breakages = applied.filter((b): b is Breakage => b !== null);
    const checks = breakages.flatMap((b) => b.checks?.(e) ?? []);
    const id = `FR${String(index).padStart(4, '0')}-repair-${e.plural}-${kinds.join('+')}`;
    // What is broken is kept in task.json for analysis; the model never sees it.
    const { en, ru } = prompts();
    for (const word of HELD_OUT) {
      if (new RegExp(`\\b${word}s?\\b`, 'i').test(en)) throw new Error(`held-out entity "${word}" in prompt`);
    }
    for (const [taskId, prompt, extraTags] of [
      [id, en, []],
      [`${id}-ru`, ru, ['ru']],
    ] as [string, string, string[]][]) {
      const dir = path.join(outDir, taskId);
      if (fs.existsSync(dir)) continue;
      fs.mkdirSync(dir, { recursive: true });
      const meta = {
        id: taskId,
        title: `Repair: ${breakages.map((b) => b.en).join('; ')}`,
        template: 'fullstack',
        layer: 'config',
        work: 'fix',
        difficulty: 1,
        formulation: 'product',
        tags: ['pool', 'fullstack', 'repair', ...kinds, e.plural, ...extraTags],
        breakages: breakages.map((b) => b.kind),
      };
      fs.writeFileSync(path.join(dir, 'task.json'), JSON.stringify(meta, null, 2) + '\n');
      fs.writeFileSync(path.join(dir, 'prompt.md'), `${prompt}\n`);
      if (checks.length) fs.writeFileSync(path.join(dir, 'checks.json'), JSON.stringify(checks, null, 2) + '\n');
      for (const [file, content] of files) {
        const target = path.join(dir, 'setup', file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      }
      written += 1;
    }
    for (const kind of kinds) byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
  }
  console.log(`repair pool: ${String(specs.length)} specs, ${String(written)} new task dirs written to ${outDir}`);
  for (const [k, v] of [...byKind].sort()) console.log(`  ${k.padEnd(22)} ${String(v)}`);
}

if (process.argv[1]?.endsWith('pool-fs-repair.ts')) {
  generateRepair(process.argv[2] ?? path.join(BENCH_DIR, 'pool-fs', 'tasks'));
}
