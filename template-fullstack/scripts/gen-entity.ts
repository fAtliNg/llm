/**
 * Scaffolds a new entity through the whole stack from a short JSON description: contract, table and
 * migration, seed rows, REST routes with tests, RTK Query endpoints, form, list, pages, route and
 * navigation link. The result follows the `tasks` patterns and passes `npm run verify` as is; then add
 * what a generator cannot know (business rules, relations, custom UI) and run verify again.
 *
 *   npm run gen:entity -- entities/employees.json
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { z } from 'zod';

import { applyPatch, generateEntity, type GenEntity, type GenField } from './entity-codegen';

const ROOT = path.resolve(import.meta.dirname, '..');

const identifier = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]*$/, 'use camelCase starting with a lowercase letter, e.g. startDate');
// Labels end up in JSX text and test queries: keep them to plain words.
const label = z
  .string()
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9 ()%.,'-]{0,39}$/,
    'plain words up to 40 characters, e.g. "Start date"',
  );
const optionValue = z.string().regex(/^[a-z][a-z0-9_]*$/, 'lowercase, e.g. in_progress');

const fieldSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    name: identifier,
    label,
    kind: z.literal('text'),
    max: z.number().int().positive(),
    min: z.number().int().positive().optional(),
    unique: z.boolean().optional(),
  }),
  z.strictObject({
    name: identifier,
    label,
    kind: z.literal('email'),
    unique: z.boolean().optional(),
  }),
  z.strictObject({
    name: identifier,
    label,
    kind: z.literal('textarea'),
    max: z.number().int().positive(),
    optional: z.boolean().optional(),
  }),
  z.strictObject({
    name: identifier,
    label,
    kind: z.literal('enum'),
    options: z.array(z.tuple([optionValue, label])).min(2),
    default: optionValue.optional(),
  }),
  z.strictObject({ name: identifier, label, kind: z.literal('bool'), default: z.boolean() }),
  z.strictObject({
    name: identifier,
    label,
    kind: z.literal('int'),
    min: z.number().int(),
    max: z.number().int(),
  }),
  z.strictObject({ name: identifier, label, kind: z.literal('money') }),
  z.strictObject({
    name: identifier,
    label,
    kind: z.literal('date'),
    optional: z.boolean().optional(),
  }),
]);

const specSchema = z
  .strictObject({
    singular: identifier,
    plural: identifier,
    fields: z.array(fieldSchema).min(1),
    columns: z.array(identifier).min(2).optional(),
    seeds: z
      .array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
      .min(2)
      .optional(),
  })
  .superRefine((spec, ctx) => {
    const names = spec.fields.map((f) => f.name);
    if (spec.singular === spec.plural)
      ctx.addIssue({ code: 'custom', message: 'singular and plural must differ' });
    if (new Set(names).size !== names.length)
      ctx.addIssue({ code: 'custom', message: 'field names must be unique' });
    if (names.includes('id'))
      ctx.addIssue({
        code: 'custom',
        message: '`id` is added automatically, remove it from fields',
      });
    for (const f of spec.fields) {
      if ((f.kind === 'text' || f.kind === 'int') && f.min !== undefined && f.min > f.max) {
        ctx.addIssue({ code: 'custom', message: `${f.name}: min is greater than max` });
      }
      if (
        f.kind === 'enum' &&
        f.default !== undefined &&
        !f.options.some(([v]) => v === f.default)
      ) {
        ctx.addIssue({ code: 'custom', message: `${f.name}: default is not one of the options` });
      }
    }
    const first = spec.columns?.[0];
    const firstField = spec.fields.find((f) => f.name === first);
    if (first !== undefined && firstField?.kind !== 'text' && firstField?.kind !== 'email') {
      ctx.addIssue({
        code: 'custom',
        message: 'the first column names the row: use a text or email field',
      });
    }
    for (const c of spec.columns ?? []) {
      if (!names.includes(c))
        ctx.addIssue({ code: 'custom', message: `column ${c} is not a field` });
    }
  });

type Spec = z.infer<typeof specSchema>;

/** Plausible, distinct demo values: unique fields differ between rows, numbers stay in range. */
function seedValue(f: GenField, i: number): string | number | boolean | null {
  switch (f.kind) {
    case 'text': {
      const value = `${f.label} ${String(i + 1)}`;
      return value.length >= (f.min ?? 1) ? value.slice(0, f.max) : value.padEnd(f.min ?? 1, 'x');
    }
    case 'email':
      return `${f.name.toLowerCase()}${String(i + 1)}@example.com`;
    case 'textarea':
      return f.optional ? '' : `${f.label} ${String(i + 1)}`;
    case 'enum':
      return f.options[i % f.options.length]?.[0] ?? '';
    case 'bool':
      return i % 2 === 0;
    case 'int':
      return Math.min(f.max, f.min + i + 1);
    case 'money':
      return 10 + i * 5.5;
    case 'date':
      return `2026-0${String(i + 1)}-15`;
  }
}

function toEntity(spec: Spec): GenEntity {
  const fields = spec.fields as GenField[];
  const named = fields.find((f) => f.kind === 'text' || f.kind === 'email');
  if (!named) throw new Error('at least one text or email field is needed to name a row');
  const columns =
    spec.columns ??
    [
      named.name,
      ...fields.filter((f) => f !== named && f.kind !== 'textarea').map((f) => f.name),
    ].slice(0, 4);
  const seeds =
    spec.seeds ??
    [0, 1].map((i) => Object.fromEntries(fields.map((f) => [f.name, seedValue(f, i)])));
  return { singular: spec.singular, plural: spec.plural, columns, fields, seeds };
}

function bin(name: string, args: string[]): void {
  execFileSync(path.join(ROOT, 'node_modules', '.bin', name), args, { cwd: ROOT, stdio: 'pipe' });
}

function main(): void {
  const specPath = process.argv[2];
  if (specPath === undefined) {
    console.error('usage: npm run gen:entity -- entities/<plural>.json');
    process.exit(1);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, specPath), 'utf8'));
  } catch (error) {
    console.error(`cannot read ${specPath}: ${String(error)}`);
    process.exit(1);
  }
  const parsed = specSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`invalid spec ${specPath}:`);
    for (const issue of parsed.error.issues)
      console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    process.exit(1);
  }
  const entity = toEntity(parsed.data);
  if (entity.columns.length < 2) {
    console.error(
      `invalid spec ${specPath}:\n  fields: the list needs two columns, add a field that is not a textarea`,
    );
    process.exit(1);
  }
  const { files, patches } = generateEntity(entity);
  const clash = Object.keys(files).find((f) => fs.existsSync(path.join(ROOT, f)));
  if (clash !== undefined) {
    console.error(
      `${clash} already exists: the entity is already there, change it by hand instead`,
    );
    process.exit(1);
  }

  // Patch in memory first: if an anchor is gone (the file was reworked by hand), nothing is written.
  const patched = new Map<string, string>();
  try {
    for (const patch of patches) {
      const current =
        patched.get(patch.file) ?? fs.readFileSync(path.join(ROOT, patch.file), 'utf8');
      patched.set(patch.file, applyPatch(current, patch));
    }
  } catch (error) {
    console.error(
      `cannot wire ${entity.plural} into the app, nothing was written: ${String(error)}`,
    );
    process.exit(1);
  }
  for (const [file, content] of [...Object.entries(files), ...patched]) {
    fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, file), content);
  }

  bin('drizzle-kit', ['generate', '--name', `add_${entity.plural}`]);
  const touched = [...Object.keys(files), ...patched.keys()];
  try {
    bin('eslint', ['--fix', ...touched]);
  } catch {
    // Anything eslint cannot fix is reported by `npm run verify`.
  }
  bin('prettier', ['--write', ...touched, specPath]);

  console.log(`generated ${entity.plural}:`);
  for (const f of Object.keys(files)) console.log(`  created  ${f}`);
  for (const f of patched.keys()) console.log(`  updated  ${f}`);
  console.log(`  created  drizzle/*_add_${entity.plural}.sql`);
  console.log(
    '\nNext: run `npm run verify` (it passes as generated), then add what the task needs beyond the ' +
      'template (business rules in the contract and routes, relations, custom UI) and verify again.',
  );
}

main();
