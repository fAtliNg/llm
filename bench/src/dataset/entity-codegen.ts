/**
 * Code generator for a whole entity in the full-stack template: contract, table, seed, routes with
 * tests, RTK Query endpoints, form, list, pages, router and navigation. It writes the same code the
 * reference solutions of the benchmark use (F02), so that second-wave pool tasks (filter, edit, fix a
 * bug, add a relation) can start from a project where the entity already exists.
 *
 * The output is never trusted as is: `pool-fs-setups.ts` applies it to a copy of the template, runs
 * `eslint --fix`, prettier and `npm run verify`, and keeps the result only when verify is green.
 */

export type GenField = { name: string; label: string } & (
  | { kind: 'text'; max: number; min?: number; unique?: boolean }
  | { kind: 'email'; unique?: boolean }
  | { kind: 'textarea'; max: number; optional?: boolean }
  | { kind: 'enum'; options: [value: string, label: string][]; default?: string }
  | { kind: 'bool'; default: boolean }
  | { kind: 'int'; min: number; max: number }
  | { kind: 'money' }
  | { kind: 'date'; optional?: boolean }
);

export interface GenEntity {
  singular: string;
  plural: string;
  /** Field names shown as table columns, in order. The first one is the row's name. */
  columns: string[];
  fields: GenField[];
  /** Seed rows without ids. */
  seeds: Record<string, string | number | boolean | null>[];
  /** Russian plural noun for prompts. Present on entities whose "create end to end" tasks are generated from this spec. */
  ru?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const kebab = (s: string) => snake(s).replace(/_/g, '-');
const pluralWord = (s: string) => (/(s|x|ch)$/.test(s) ? `${s}es` : /[^aeiou]y$/.test(s) ? `${s.slice(0, -1)}ies` : `${s}s`);
const article = (s: string) => (/^[aeiou]/i.test(s) ? 'an' : 'a');
const lit = (v: unknown) => (typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : String(v));

export interface Names {
  singular: string;
  plural: string;
  Singular: string;
  Plural: string;
  UPPER: string;
  idParam: string;
}

export function names(e: GenEntity): Names {
  return {
    singular: e.singular,
    plural: e.plural,
    Singular: cap(e.singular),
    Plural: cap(e.plural),
    UPPER: snake(e.singular).toUpperCase(),
    idParam: `${e.singular}Id`,
  };
}

type EnumField = Extract<GenField, { kind: 'enum' }>;
const enums = (e: GenEntity) => e.fields.filter((f): f is EnumField => f.kind === 'enum');
const enumConst = (e: GenEntity, f: GenField) => `${names(e).UPPER}_${snake(pluralWord(f.name)).toUpperCase()}`;
const enumSchema = (e: GenEntity, f: GenField) => `${e.singular}${cap(f.name)}Schema`;
const enumType = (e: GenEntity, f: GenField) => `${names(e).Singular}${cap(f.name)}`;
const enumLabels = (e: GenEntity, f: GenField) => `${names(e).UPPER}_${snake(f.name).toUpperCase()}_LABELS`;
const uniques = (e: GenEntity) => e.fields.filter((f) => (f.kind === 'text' || f.kind === 'email') && f.unique);

export const requiredMessage = (f: GenField) => `${f.label} is required`;
export const duplicateMessage = (e: GenEntity, f: GenField) =>
  `${cap(article(e.singular))} ${e.singular} with this ${f.label.toLowerCase()} already exists`;

function zodFor(e: GenEntity, f: GenField): string {
  switch (f.kind) {
    case 'text':
      return `z.string().trim().min(${String(f.min ?? 1)}, '${f.min && f.min > 1 ? `${f.label} needs at least ${String(f.min)} characters` : requiredMessage(f)}').max(${String(f.max)}, 'Keep the ${f.label.toLowerCase()} under ${String(f.max)} characters')`;
    case 'email':
      return `z.email('Enter a valid email')`;
    case 'textarea':
      return `z.string().trim()${f.optional ? '' : `.min(1, '${requiredMessage(f)}')`}.max(${String(f.max)}, 'Keep the ${f.label.toLowerCase()} under ${String(f.max)} characters')`;
    case 'enum':
      return enumSchema(e, f);
    case 'bool':
      return 'z.boolean()';
    case 'int':
      return `z.number('Enter a number').int('Enter a whole number').min(${String(f.min)}, '${f.label} must be at least ${String(f.min)}').max(${String(f.max)}, '${f.label} must be at most ${String(f.max)}')`;
    case 'money':
      return `z.number('Enter an amount').positive('${f.label} must be greater than 0').multipleOf(0.01, 'Use at most two decimals')`;
    case 'date':
      return `z.iso.date('Enter a valid date')${f.optional ? '.nullable()' : ''}`;
  }
}

function contract(e: GenEntity): string {
  const n = names(e);
  const enumBlocks = enums(e)
    .map(
      (f) => `export const ${enumConst(e, f)} = [${f.options.map(([v]) => lit(v)).join(', ')}] as const;

export const ${enumSchema(e, f)} = z.enum(${enumConst(e, f)});

export type ${enumType(e, f)} = z.infer<typeof ${enumSchema(e, f)}>;
`,
    )
    .join('\n');
  return `import { z } from 'zod';

/** Contract for ${n.plural}, shared by the API and the web app. */
${enumBlocks}
/** What the user fills in. Shared by the form and the API payloads. */
export const ${n.singular}InputSchema = z.object({
${e.fields.map((f) => `  ${f.name}: ${zodFor(e, f)},`).join('\n')}
});

export type ${n.Singular}Input = z.infer<typeof ${n.singular}InputSchema>;

/** What the API returns. */
export const ${n.singular}Schema = ${n.singular}InputSchema.extend({
  id: z.string(),
});

export type ${n.Singular} = z.infer<typeof ${n.singular}Schema>;
`;
}

function column(e: GenEntity, f: GenField): string {
  const col = lit(snake(f.name));
  switch (f.kind) {
    case 'text':
    case 'email':
      return `text(${col}).notNull()${f.unique ? '.unique()' : ''}`;
    case 'textarea':
      return `text(${col}).notNull()`;
    case 'enum':
      return `text(${col}, { enum: ${enumConst(e, f)} }).notNull()`;
    case 'bool':
      return `integer(${col}, { mode: 'boolean' }).notNull()`;
    case 'int':
      return `integer(${col}).notNull()`;
    case 'money':
      return `real(${col}).notNull()`;
    case 'date':
      return `text(${col})${f.optional ? '' : '.notNull()'}`;
  }
}

function table(e: GenEntity): string {
  const n = names(e);
  return `
export const ${n.plural} = sqliteTable('${snake(n.plural)}', {
  id: text('id').primaryKey(),
${e.fields.map((f) => `  ${f.name}: ${column(e, f)},`).join('\n')}
});

export type ${n.Singular}Row = typeof ${n.plural}.$inferSelect;
export type ${n.Singular}RowMatchesContract = Assert<Equal<${n.Singular}Row, ${n.Singular}>>;
`;
}

function routes(e: GenEntity): string {
  const n = names(e);
  const unique = uniques(e);
  const taken = unique
    .map(
      (f) => `
  /** True when another ${n.singular} already uses the ${f.label.toLowerCase()}. */
  const ${f.name}Taken = (${f.name}: string, exceptId?: string) => {
    const where = exceptId
      ? and(eq(${n.plural}.${f.name}, ${f.name}), ne(${n.plural}.id, exceptId))
      : eq(${n.plural}.${f.name}, ${f.name});
    return db.select().from(${n.plural}).where(where).all().length > 0;
  };
`,
    )
    .join('');
  return `import { zValidator } from '@hono/zod-validator';
import { ${unique.length ? 'and, eq, ne' : 'eq'} } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { ${n.plural} } from '@server/db/schema';
import { ${unique.length ? 'conflict, ' : ''}invalid, notFound } from '@server/http';
import { ${n.singular}InputSchema } from '@shared/${kebab(n.plural)}';
${unique.map((f) => `\nconst DUPLICATE_${snake(f.name).toUpperCase()} = '${duplicateMessage(e, f)}';`).join('')}

/** \`/api/${kebab(n.plural)}\`. */
export function ${n.plural}Routes(db: Db) {
  const app = new Hono();
${taken}
  app.get('/', (c) => c.json(db.select().from(${n.plural}).all()));

  app.get('/:${n.idParam}', (c) => {
    const [${n.singular}] = db.select().from(${n.plural}).where(eq(${n.plural}.id, c.req.param('${n.idParam}'))).all();
    return ${n.singular} ? c.json(${n.singular}) : notFound(c);
  });

  app.post('/', zValidator('json', ${n.singular}InputSchema, invalid('Invalid ${n.singular}')), (c) => {
    const input = c.req.valid('json');
${unique.map((f) => `    if (${f.name}Taken(input.${f.name})) return conflict(c, DUPLICATE_${snake(f.name).toUpperCase()});\n`).join('')}    const ${n.singular} = { id: crypto.randomUUID(), ...input };
    db.insert(${n.plural}).values(${n.singular}).run();
    return c.json(${n.singular}, 201);
  });

  app.patch(
    '/:${n.idParam}',
    zValidator('json', ${n.singular}InputSchema.partial(), invalid('Invalid ${n.singular}')),
    (c) => {
      const id = c.req.param('${n.idParam}');
      const patch = c.req.valid('json');
${unique.map((f) => `      if (patch.${f.name} && ${f.name}Taken(patch.${f.name}, id)) return conflict(c, DUPLICATE_${snake(f.name).toUpperCase()});\n`).join('')}      const [${n.singular}] = db.update(${n.plural}).set(patch).where(eq(${n.plural}.id, id)).returning().all();
      return ${n.singular} ? c.json(${n.singular}) : notFound(c);
    },
  );

  app.delete('/:${n.idParam}', (c) => {
    const [removed] = db.delete(${n.plural}).where(eq(${n.plural}.id, c.req.param('${n.idParam}'))).returning().all();
    return removed ? c.body(null, 204) : notFound(c);
  });

  return app;
}
`;
}

/** A valid value for tests, different from the seeds. */
export function sample(f: GenField, variant = 0): string | number | boolean | null {
  switch (f.kind) {
    case 'text':
      return (variant === 0 ? 'Sample value' : 'Another value').slice(0, f.max);
    case 'email':
      return variant === 0 ? 'sample@example.com' : 'another@example.com';
    case 'textarea':
      return 'Some longer text';
    case 'enum':
      return f.options[f.options.length - 1]?.[0] ?? '';
    case 'bool':
      return !f.default;
    case 'int':
      return Math.min(f.max, f.min + 3);
    case 'money':
      return 19.5;
    case 'date':
      return '2027-02-03';
  }
}

/** A value the API must reject, or undefined when the field cannot be invalid on its own. */
function invalidSample(f: GenField): string | number | undefined {
  switch (f.kind) {
    case 'text':
      return '';
    case 'email':
      return 'not-an-email';
    case 'textarea':
      return f.optional ? undefined : '';
    case 'enum':
      return 'no-such-option';
    case 'bool':
      return 'yes';
    case 'int':
      return f.min - 1;
    case 'money':
      return 0;
    case 'date':
      return 'tomorrow';
  }
}

const objectLiteral = (row: Record<string, unknown>, indent: string) =>
  `{\n${Object.entries(row)
    .map(([k, v]) => `${indent}  ${k}: ${lit(v)},`)
    .join('\n')}\n${indent}}`;

function routesTest(e: GenEntity): string {
  const n = names(e);
  const first = e.fields[0];
  if (!first) throw new Error(`${e.plural}: no fields`);
  const input = Object.fromEntries(e.fields.map((f) => [f.name, sample(f)]));
  const invalids = e.fields
    .map((f) => [f, invalidSample(f)] as const)
    .filter(([, v]) => v !== undefined)
    .slice(0, 3);
  const unique = uniques(e);
  const url = `/api/${kebab(n.plural)}`;
  const patchField = e.fields.find((f) => !uniques(e).includes(f)) ?? first;
  return `import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { ${n.Singular} } from '@shared/${kebab(n.plural)}';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

const json = (body: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const input = ${objectLiteral(input, '')};

describe('${url}', () => {
  it('lists the seeded ${n.plural}', async () => {
    const response = await app.request('${url}');
    expect(response.status).toBe(200);
    const list = (await response.json()) as ${n.Singular}[];
    expect(list.map((${n.singular}) => ${n.singular}.${first.name})).toEqual([${e.seeds.map((s) => lit(s[first.name])).join(', ')}]);
  });

  it('creates ${article(n.singular)} ${n.singular} and returns it by id', async () => {
    const response = await app.request('${url}', json(input));
    expect(response.status).toBe(201);
    const created = (await response.json()) as ${n.Singular};
    expect(created).toMatchObject(input);

    const fetched = await app.request(\`${url}/\${created.id}\`);
    expect(await fetched.json()).toEqual(created);
  });

  it('rejects invalid ${n.plural} with 400', async () => {
${invalids
  .map(
    ([f, v], i) =>
      i === 0
        ? `    const response = await app.request('${url}', json({ ...input, ${f.name}: ${lit(v)} }));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { message: string }).message).toBe('Invalid ${n.singular}');`
        : `    expect((await app.request('${url}', json({ ...input, ${f.name}: ${lit(v)} }))).status).toBe(400);`,
  )
  .join('\n')}
  });
${unique
  .map(
    (f) => `
  it('answers 409 for a duplicate ${f.label.toLowerCase()} on create and update', async () => {
    const duplicate = await app.request('${url}', json({ ...input, ${f.name}: ${lit(e.seeds[0]?.[f.name])} }));
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ message: '${duplicateMessage(e, f)}' });

    const update = await app.request('${url}/1', json({ ${f.name}: ${lit(e.seeds[1]?.[f.name])} }, 'PATCH'));
    expect(update.status).toBe(409);

    const same = await app.request('${url}/1', json({ ${f.name}: ${lit(e.seeds[0]?.[f.name])} }, 'PATCH'));
    expect(same.status).toBe(200);
  });
`,
  )
  .join('')}
  it('updates and deletes ${article(n.singular)} ${n.singular}, 404 for unknown ids', async () => {
    const updated = await app.request('${url}/2', json({ ${patchField.name}: input.${patchField.name} }, 'PATCH'));
    expect(await updated.json()).toMatchObject({ id: '2', ${patchField.name}: input.${patchField.name} });

    expect((await app.request('${url}/2', { method: 'DELETE' })).status).toBe(204);
    expect((await app.request('${url}/2')).status).toBe(404);
    expect((await app.request('${url}/nope', json({ ${patchField.name}: input.${patchField.name} }, 'PATCH'))).status).toBe(404);
  });
});
`;
}

function model(e: GenEntity): string {
  const n = names(e);
  const list = enums(e);
  if (list.length === 0) {
    return `/** The data contract lives in \`shared/${kebab(n.plural)}.ts\`; this file adds what only the UI needs. */
export * from '@shared/${kebab(n.plural)}';
`;
  }
  return `import type { ${list.map((f) => enumType(e, f)).join(', ')} } from '@shared/${kebab(n.plural)}';

/** The data contract lives in \`shared/${kebab(n.plural)}.ts\`; this file adds what only the UI needs. */
export * from '@shared/${kebab(n.plural)}';
${list
  .map(
    (f) => `
export const ${enumLabels(e, f)}: Record<${enumType(e, f)}, string> = {
${f.options.map(([v, label]) => `  ${/^[a-z_$][\w$]*$/i.test(v) ? v : lit(v)}: ${lit(label)},`).join('\n')}
};
`,
  )
  .join('')}`;
}

function api(e: GenEntity): string {
  const n = names(e);
  return `import { baseApi } from '@/api/base-api';
import type { ${n.Singular}, ${n.Singular}Input } from '@/features/${kebab(n.plural)}/model';

/** ${n.Singular} endpoints injected into the shared API. Same cache strategy as tasks. */
export const ${n.plural}Api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    get${n.Plural}: build.query<${n.Singular}[], void>({
      query: () => '${kebab(n.plural)}',
      providesTags: (result = []) => [
        { type: '${n.Singular}', id: 'LIST' },
        ...result.map(({ id }) => ({ type: '${n.Singular}' as const, id })),
      ],
    }),

    create${n.Singular}: build.mutation<${n.Singular}, ${n.Singular}Input>({
      query: (body) => ({ url: '${kebab(n.plural)}', method: 'POST', body }),
      invalidatesTags: [{ type: '${n.Singular}', id: 'LIST' }],
    }),
  }),
});

export const { useGet${n.Plural}Query, useCreate${n.Singular}Mutation } = ${n.plural}Api;
`;
}

function emptyValue(f: GenField): string {
  switch (f.kind) {
    case 'text':
    case 'email':
    case 'textarea':
      return `''`;
    case 'enum':
      return lit(f.default ?? f.options[0]?.[0]);
    case 'bool':
      return String(f.default);
    case 'int':
    case 'money':
      return 'Number.NaN';
    case 'date':
      return f.optional ? 'null' : `''`;
  }
}

function control(e: GenEntity, f: GenField): string {
  const id = `${kebab(e.singular)}-${kebab(f.name)}`;
  const wrap = (inner: string) => `        <Controller
          name="${f.name}"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="${id}">${f.label}</FieldLabel>
${inner}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />`;
  switch (f.kind) {
    case 'text':
      return wrap(`              <Input {...field} id="${id}" aria-invalid={fieldState.invalid} />`);
    case 'email':
      return wrap(`              <Input {...field} id="${id}" type="email" aria-invalid={fieldState.invalid} />`);
    case 'textarea':
      return wrap(`              <Textarea {...field} id="${id}" aria-invalid={fieldState.invalid} />`);
    case 'enum':
      return wrap(`              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="${id}" aria-invalid={fieldState.invalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {${enumConst(e, f)}.map((option) => (
                    <SelectItem key={option} value={option}>
                      {${enumLabels(e, f)}[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>`);
    case 'bool':
      return `        <Controller
          name="${f.name}"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <input
                id="${id}"
                type="checkbox"
                className="size-4"
                checked={field.value}
                onChange={(event) => {
                  field.onChange(event.target.checked);
                }}
                onBlur={field.onBlur}
                ref={field.ref}
              />
              <FieldLabel htmlFor="${id}">${f.label}</FieldLabel>
            </Field>
          )}
        />`;
    case 'int':
    case 'money':
      return wrap(`              <Input
                {...field}
                id="${id}"
                type="number"${f.kind === 'money' ? '\n                step="0.01"' : ''}
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={(event) => {
                  field.onChange(event.target.valueAsNumber);
                }}
                aria-invalid={fieldState.invalid}
              />`);
    case 'date':
      return wrap(
        f.optional
          ? `              <Input
                {...field}
                id="${id}"
                type="date"
                value={field.value ?? ''}
                onChange={(event) => {
                  field.onChange(event.target.value || null);
                }}
                aria-invalid={fieldState.invalid}
              />`
          : `              <Input {...field} id="${id}" type="date" aria-invalid={fieldState.invalid} />`,
      );
  }
}

function form(e: GenEntity): string {
  const n = names(e);
  const kinds = new Set(e.fields.map((f) => f.kind));
  const list = enums(e);
  const modelImports = [...list.flatMap((f) => [enumLabels(e, f), enumConst(e, f)]), `${n.singular}InputSchema`, `type ${n.Singular}Input`];
  return `import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
${[...kinds].some((k) => k !== 'enum' && k !== 'bool' && k !== 'textarea') ? "import { Input } from '@/components/ui/input';\n" : ''}${
    kinds.has('enum')
      ? `import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
`
      : ''
  }${kinds.has('textarea') ? "import { Textarea } from '@/components/ui/textarea';\n" : ''}import { ${modelImports.join(', ')} } from '@/features/${kebab(n.plural)}/model';

interface ${n.Singular}FormProps {
  defaultValues?: Partial<${n.Singular}Input>;
  onSubmit: (values: ${n.Singular}Input) => Promise<void> | void;
  submitLabel?: string;
}

const empty${n.Singular}: ${n.Singular}Input = {
${e.fields.map((f) => `  ${f.name}: ${emptyValue(f)},`).join('\n')}
};

export function ${n.Singular}Form({ defaultValues, onSubmit, submitLabel = 'Save' }: ${n.Singular}FormProps) {
  const form = useForm<${n.Singular}Input>({
    resolver: zodResolver(${n.singular}InputSchema),
    defaultValues: { ...empty${n.Singular}, ...defaultValues },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void form.handleSubmit((values) => onSubmit(values))(event)}
      className="max-w-lg"
    >
      <FieldGroup>
${e.fields.map((f) => control(e, f)).join('\n\n')}

        <Field orientation="horizontal">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
`;
}

/** user-event steps that fill the form with `sample` values; fields with a usable default are skipped. */
export function fillSteps(e: GenEntity, indent: string, first: 'get' | 'find' = 'get'): string {
  const steps: string[] = [];
  for (const f of e.fields) {
    const query = steps.length === 0 && first === 'find' ? `await screen.findByLabelText('${f.label}')` : `screen.getByLabelText('${f.label}')`;
    if (f.kind === 'enum' || f.kind === 'bool') continue;
    if (f.kind === 'textarea' && f.optional) continue;
    if (f.kind === 'date' && f.optional) continue;
    steps.push(`${indent}await user.type(${query}, '${String(sample(f))}');`);
  }
  return steps.join('\n');
}

/** What the form submits after `fillSteps`. */
export function filledValues(e: GenEntity): Record<string, unknown> {
  return Object.fromEntries(
    e.fields.map((f) => {
      if (f.kind === 'enum') return [f.name, f.default ?? f.options[0]?.[0]];
      if (f.kind === 'bool') return [f.name, f.default];
      if (f.kind === 'textarea' && f.optional) return [f.name, ''];
      if (f.kind === 'date' && f.optional) return [f.name, null];
      return [f.name, sample(f)];
    }),
  );
}

function formTest(e: GenEntity): string {
  const n = names(e);
  const required = e.fields.filter((f) => f.kind === 'text' && !f.min);
  return `import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ${n.Singular}Form } from '@/features/${kebab(n.plural)}/${kebab(n.singular)}-form';
import { renderWithProviders } from '@/test/render';

describe('${n.Singular}Form', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<${n.Singular}Form onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

${required.map((f, i) => `    expect(${i === 0 ? 'await screen.findByText' : 'screen.getByText'}('${requiredMessage(f)}')).toBeInTheDocument();`).join('\n')}
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the entered values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<${n.Singular}Form onSubmit={onSubmit} />);

${fillSteps(e, '    ')}
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(${objectLiteral(filledValues(e), '    ')});
  });
});
`;
}

function cell(e: GenEntity, f: GenField, row: string): string {
  switch (f.kind) {
    case 'enum':
      return `{${enumLabels(e, f)}[${row}.${f.name}]}`;
    case 'bool':
      return `{${row}.${f.name} ? 'Yes' : 'No'}`;
    case 'money':
      return `{${row}.${f.name}.toFixed(2)}`;
    case 'date':
      return f.optional ? `{${row}.${f.name} ?? '—'}` : `{${row}.${f.name}}`;
    default:
      return `{${row}.${f.name}}`;
  }
}

/** Text of a table cell for a given value, the way `cell` renders it. */
export function cellText(f: GenField, value: unknown): string {
  if (f.kind === 'enum') return f.options.find(([v]) => v === value)?.[1] ?? '';
  if (f.kind === 'bool') return value ? 'Yes' : 'No';
  if (f.kind === 'money') return (value as number).toFixed(2);
  if (f.kind === 'date' && value === null) return '—';
  return String(value);
}

function list(e: GenEntity): string {
  const n = names(e);
  const cols = e.columns.map((name) => {
    const f = e.fields.find((x) => x.name === name);
    if (!f) throw new Error(`${e.plural}: unknown column ${name}`);
    return f;
  });
  const labels = cols.filter((f) => f.kind === 'enum').map((f) => enumLabels(e, f));
  return `import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ${[...labels, `type ${n.Singular}`].join(', ')} } from '@/features/${kebab(n.plural)}/model';

export function ${n.Singular}List({ ${n.plural} }: { ${n.plural}: ${n.Singular}[] }) {
  if (${n.plural}.length === 0) {
    return <p className="text-sm text-muted-foreground">No ${n.plural} yet. Add the first one.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
${cols.map((f) => `          <TableHead>${f.label}</TableHead>`).join('\n')}
        </TableRow>
      </TableHeader>
      <TableBody>
        {${n.plural}.map((${n.singular}) => (
          <TableRow key={${n.singular}.id}>
${cols.map((f, i) => `            <TableCell${i === 0 ? ' className="font-medium"' : ''}>${cell(e, f, n.singular)}</TableCell>`).join('\n')}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
`;
}

function listPage(e: GenEntity): string {
  const n = names(e);
  const k = kebab(n.plural);
  return `import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGet${n.Plural}Query } from '@/features/${k}/api';
import { ${n.Singular}List } from '@/features/${k}/${kebab(n.singular)}-list';

export function ${n.Plural}Page() {
  const { data: ${n.plural}, isLoading, isError, refetch } = useGet${n.Plural}Query();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">${n.Plural}</h1>
        <Button asChild>
          <Link to="/${k}/new">New ${n.singular}</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading ${n.plural}">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load ${n.plural}</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {${n.plural} && <${n.Singular}List ${n.plural}={${n.plural}} />}
    </section>
  );
}
`;
}

function newPage(e: GenEntity): string {
  const n = names(e);
  const k = kebab(n.plural);
  return `import { useNavigate } from 'react-router';

import { useCreate${n.Singular}Mutation } from '@/features/${k}/api';
import { ${n.Singular}Form } from '@/features/${k}/${kebab(n.singular)}-form';
import type { ${n.Singular}Input } from '@/features/${k}/model';

export function ${n.Singular}NewPage() {
  const navigate = useNavigate();
  const [create${n.Singular}] = useCreate${n.Singular}Mutation();

  async function handleSubmit(values: ${n.Singular}Input) {
    await create${n.Singular}(values).unwrap();
    await navigate('/${k}');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New ${n.singular}</h1>
      <${n.Singular}Form onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
`;
}

function pageTest(e: GenEntity): string {
  const n = names(e);
  const k = kebab(n.plural);
  const first = e.fields.find((f) => f.name === e.columns[0]);
  const second = e.fields.find((f) => f.name === e.columns[1]);
  if (!first || !second) throw new Error(`${e.plural}: needs two columns`);
  const seed = e.seeds[0] ?? {};
  return `import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('${n.Plural}', () => {
  it('lists the ${n.plural} from the API', async () => {
    renderApp(['/${k}']);

    const row = await screen.findByRole('row', { name: /^${String(seed[first.name])}/ });
    expect(within(row).getByText('${cellText(second, seed[second.name])}')).toBeInTheDocument();
  });

  it('creates ${article(n.singular)} ${n.singular} and returns to the list', async () => {
    const { user } = renderApp(['/${k}/new']);

${fillSteps(e, '    ', 'find')}
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: '${n.Plural}' })).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /^${String(sample(first))}/ })).toBeInTheDocument();
  });
});
`;
}

export interface Patch {
  file: string;
  /** Inserted before (or after) the anchor; the anchor must exist exactly once... or at least once. */
  anchor: string;
  insert: string;
  where: 'before' | 'after' | 'replace';
}

export interface Generated {
  files: Record<string, string>;
  patches: Patch[];
}

export function generateEntity(e: GenEntity): Generated {
  const n = names(e);
  const k = kebab(n.plural);
  const ks = kebab(n.singular);
  const kinds = new Set(e.fields.map((f) => f.kind));
  const sqliteImports = ['sqliteTable', 'text', ...(kinds.has('bool') || kinds.has('int') ? ['integer'] : []), ...(kinds.has('money') ? ['real'] : [])].sort();
  const contractImports = [...enums(e).map((f) => enumConst(e, f)), `type ${n.Singular}`];
  const seedRows = e.seeds.map((row, i) => ({ id: String(i + 1), ...row }));

  return {
    files: {
      [`shared/${k}.ts`]: contract(e),
      [`server/features/${k}/routes.ts`]: routes(e),
      [`server/features/${k}/routes.test.ts`]: routesTest(e),
      [`src/features/${k}/model.ts`]: model(e),
      [`src/features/${k}/api.ts`]: api(e),
      [`src/features/${k}/${ks}-form.tsx`]: form(e),
      [`src/features/${k}/${ks}-form.test.tsx`]: formTest(e),
      [`src/features/${k}/${ks}-list.tsx`]: list(e),
      [`src/pages/${k}-page.tsx`]: listPage(e),
      [`src/pages/${k}-page.test.tsx`]: pageTest(e),
      [`src/pages/${ks}-new-page.tsx`]: newPage(e),
    },
    patches: [
      { file: 'server/db/schema.ts', anchor: "import { sqliteTable, text } from 'drizzle-orm/sqlite-core';", insert: `import { ${sqliteImports.join(', ')} } from 'drizzle-orm/sqlite-core';`, where: 'replace' },
      { file: 'server/db/schema.ts', anchor: "import { TASK_PRIORITIES", insert: `import { ${contractImports.join(', ')} } from '@shared/${k}';\n`, where: 'before' },
      { file: 'server/db/schema.ts', anchor: '@@end', insert: table(e), where: 'after' },
      { file: 'server/db/seed.ts', anchor: "import { tasks } from '@server/db/schema';", insert: `import { ${n.plural}, tasks } from '@server/db/schema';\nimport type { ${n.Singular} } from '@shared/${k}';`, where: 'replace' },
      {
        file: 'server/db/seed.ts',
        anchor: '/** Fills empty tables',
        insert: `export const ${n.UPPER}_SEED: ${n.Singular}[] = [\n${seedRows.map((row) => `  ${objectLiteral(row, '  ')},`).join('\n')}\n];\n\n`,
        where: 'before',
      },
      {
        file: 'server/db/seed.ts',
        anchor: '  if (existing.length === 0) db.insert(tasks).values(TASK_SEED).run();\n',
        insert: `\n  const existing${n.Plural} = db.select().from(${n.plural}).limit(1).all();\n  if (existing${n.Plural}.length === 0) db.insert(${n.plural}).values(${n.UPPER}_SEED).run();\n`,
        where: 'after',
      },
      { file: 'server/app.ts', anchor: "import { tasksRoutes }", insert: `import { ${n.plural}Routes } from '@server/features/${k}/routes';\n`, where: 'before' },
      { file: 'server/app.ts', anchor: "  app.route('/tasks', tasksRoutes(db));\n", insert: `  app.route('/${k}', ${n.plural}Routes(db));\n`, where: 'after' },
      { file: 'src/api/base-api.ts', anchor: "tagTypes: ['Task'],", insert: `tagTypes: ['Task', '${n.Singular}'],`, where: 'replace' },
      { file: 'src/app/router.tsx', anchor: "import { NotFoundPage }", insert: `import { ${n.Singular}NewPage } from '@/pages/${ks}-new-page';\nimport { ${n.Plural}Page } from '@/pages/${k}-page';\n`, where: 'before' },
      { file: 'src/app/router.tsx', anchor: "      { path: '*', Component: NotFoundPage },", insert: `      { path: '${k}', Component: ${n.Plural}Page },\n      { path: '${k}/new', Component: ${n.Singular}NewPage },\n`, where: 'before' },
      { file: 'src/app/root-layout.tsx', anchor: '        </nav>', insert: `          <NavLink to="/${k}" className={navLinkClass}>\n            ${n.Plural}\n          </NavLink>\n`, where: 'before' },
    ],
  };
}

export function applyPatch(content: string, patch: Patch): string {
  if (patch.anchor === '@@end') return `${content.trimEnd()}\n${patch.insert}`;
  const at = content.indexOf(patch.anchor);
  if (at < 0) throw new Error(`${patch.file}: anchor not found: ${patch.anchor.slice(0, 50)}`);
  if (patch.where === 'replace') return content.slice(0, at) + patch.insert + content.slice(at + patch.anchor.length);
  const pos = patch.where === 'before' ? at : at + patch.anchor.length;
  return content.slice(0, pos) + patch.insert + content.slice(pos);
}
