import { names, sample, type GenEntity, type GenField } from './entity-codegen.ts';

/**
 * Hidden API tests for the second-wave pool tasks, and a reference implementation for each of them.
 *
 * Pool tasks had no hidden tests: "solved" meant a green verify, a non-empty diff and a few greps, so a
 * teacher that filters in JavaScript instead of SQL, or forgets the 400, still produced a training
 * example. The tests here check behaviour through `app.request` only: nothing about file layout.
 *
 * A test that is wrong rejects every correct solution of its family, so none is trusted as written:
 * `pool-fs-hidden-check.ts` runs each one against the reference (must pass) and against the untouched
 * starting project (must fail).
 */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const lit = (v: unknown) => JSON.stringify(v);

/** Source of a function `make(i, extra)` that builds a valid, unique input for the entity. */
function makeInput(e: GenEntity): string {
  const lines = e.fields.map((f) => {
    if (f.kind === 'text' && f.unique) return `    ${f.name}: \`U\${String(i).padStart(3, '0')}-bench\`.slice(0, ${String(f.max)}),`;
    if (f.kind === 'email') return `    ${f.name}: \`bench-\${String(i)}@bench.test\`,`;
    return `    ${f.name}: ${lit(sample(f))},`;
  });
  return `let counter = 0;
function make(extra: Record<string, unknown> = {}) {
  counter += 1;
  const i = counter;
  return {
${lines.join('\n')}
    ...extra,
  };
}`;
}

function header(e: GenEntity, title: string, body: string): string {
  const k = kebab(e.plural);
  return `import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

type Row = Record<string, unknown> & { id: string };

${makeInput(e)}

async function create(extra: Record<string, unknown> = {}) {
  const response = await app.request('/api/${k}', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(make(extra)),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Row;
}

const list = async (query = '') => {
  const response = await app.request(\`/api/${k}\${query}\`);
  expect(response.status).toBe(200);
  return (await response.json()) as Row[];
};

describe('${title}', () => {
${body}
});
`;
}

export interface Hidden {
  /** File name under `hidden-api/`. */
  file: string;
  test: string;
  /** Turns the generated routes file into a correct solution of the API part. */
  reference: (routes: string) => string;
}

function addDrizzleImports(routes: string, extra: string[]): string {
  return routes.replace(/import \{ ([^}]+) \} from 'drizzle-orm';/, (_m, list: string) => {
    const all = [...new Set([...list.split(',').map((x) => x.trim()), ...extra])].sort();
    return `import { ${all.join(', ')} } from 'drizzle-orm';`;
  });
}

function replaceList(routes: string, e: GenEntity, handler: string): string {
  const anchor = `  app.get('/', (c) => c.json(db.select().from(${e.plural}).all()));`;
  if (!routes.includes(anchor)) throw new Error(`${e.plural}: list handler not found`);
  return routes.replace(anchor, handler);
}

export function hiddenFilter(e: GenEntity, f: Extract<GenField, { kind: 'enum' }>): Hidden {
  const n = names(e);
  const k = kebab(n.plural);
  const schema = `${e.singular}${cap(f.name)}Schema`;
  const values = f.options.map(([v]) => v);
  return {
    file: 'filter.api.test.ts',
    test: header(e, `filter ${n.plural} by ${f.name}`, `  it('returns only the matching ${n.plural}', async () => {
    const created: Record<string, Row> = {};
    for (const value of ${lit(values)}) created[value] = await create({ ${f.name}: value });

    for (const value of ${lit(values)}) {
      const rows = await list(\`?${f.name}=\${value}\`);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.${f.name} === value)).toBe(true);
      expect(rows.map((row) => row.id)).toContain(created[value]?.id);
    }
  });

  it('returns everything without the parameter', async () => {
    const before = (await list()).length;
    await create({ ${f.name}: ${lit(values[0])} });
    await create({ ${f.name}: ${lit(values[1] ?? values[0])} });
    expect((await list()).length).toBe(before + 2);
  });

  it('answers 400 for an unknown value', async () => {
    const response = await app.request('/api/${k}?${f.name}=no-such-value');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: 'Invalid ${f.label.toLowerCase()}' });
  });`),
    reference: (routes) =>
      replaceList(
        routes.replace(`import { ${e.singular}InputSchema } from`, `import { ${schema}, ${e.singular}InputSchema } from`),
        e,
        `  app.get('/', (c) => {
    const value = c.req.query('${f.name}');
    if (value === undefined) return c.json(db.select().from(${e.plural}).all());
    const parsed = ${schema}.safeParse(value);
    if (!parsed.success) return c.json({ message: 'Invalid ${f.label.toLowerCase()}' }, 400);
    return c.json(db.select().from(${e.plural}).where(eq(${e.plural}.${f.name}, parsed.data)).all());
  });`,
      ),
  };
}

export function hiddenBoolFilter(e: GenEntity, f: GenField): Hidden {
  const n = names(e);
  const k = kebab(n.plural);
  return {
    file: 'boolfilter.api.test.ts',
    test: header(e, `filter ${n.plural} by ${f.name}`, `  it('returns only the matching ${n.plural} for true and for false', async () => {
    const yes = await create({ ${f.name}: true });
    const no = await create({ ${f.name}: false });

    const on = await list('?${f.name}=true');
    expect(on.every((row) => row.${f.name} === true)).toBe(true);
    expect(on.map((row) => row.id)).toContain(yes.id);

    const off = await list('?${f.name}=false');
    expect(off.every((row) => row.${f.name} === false)).toBe(true);
    expect(off.map((row) => row.id)).toContain(no.id);

    const all = await list();
    expect(all.length).toBe(on.length + off.length);
  });

  it('answers 400 for any other value', async () => {
    for (const value of ['yes', '1']) {
      const response = await app.request(\`/api/${k}?${f.name}=\${value}\`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ message: 'Invalid ${f.name}' });
    }
  });`),
    reference: (routes) =>
      replaceList(
        routes,
        e,
        `  app.get('/', (c) => {
    const value = c.req.query('${f.name}');
    if (value === undefined) return c.json(db.select().from(${e.plural}).all());
    if (value !== 'true' && value !== 'false') return c.json({ message: 'Invalid ${f.name}' }, 400);
    return c.json(db.select().from(${e.plural}).where(eq(${e.plural}.${f.name}, value === 'true')).all());
  });`,
      ),
  };
}

export function hiddenSearch(e: GenEntity, f: GenField): Hidden {
  const n = names(e);
  // The marker must fit the shortest field (plates: 10 characters) and survive a lower-case query.
  const marker = 'QZX7';
  return {
    file: 'search.api.test.ts',
    test: header(e, `search ${n.plural} by ${f.name}`, `  it('finds ${n.plural} by a part of the ${f.label.toLowerCase()}, ignoring case', async () => {
    const first = await create({ ${f.name}: '${marker}-01' });
    const second = await create({ ${f.name}: 'A-${marker.toLowerCase()}-2' });
    await create();

    for (const q of ['${marker}', '${marker.toLowerCase()}']) {
      const rows = await list(\`?q=\${q}\`);
      expect(rows.map((row) => row.id).sort()).toEqual([first.id, second.id].sort());
    }
  });

  it('returns an empty list when nothing matches and everything without the parameter', async () => {
    const before = (await list()).length;
    await create();
    expect(await list('?q=no-such-text-anywhere')).toEqual([]);
    expect((await list()).length).toBe(before + 1);
  });`),
    reference: (routes) =>
      replaceList(
        addDrizzleImports(routes, ['like']),
        e,
        `  app.get('/', (c) => {
    const q = c.req.query('q')?.trim();
    return c.json(
      db
        .select()
        .from(${e.plural})
        .where(q ? like(${e.plural}.${f.name}, \`%\${q}%\`) : undefined)
        .all(),
    );
  });`,
      ),
  };
}

export function hiddenSort(e: GenEntity, f: GenField): Hidden {
  const n = names(e);
  const k = kebab(n.plural);
  const base = f.kind === 'int' ? f.min : 1.5;
  const values = [base + 2, base, base + 1];
  return {
    file: 'sort.api.test.ts',
    test: header(e, `sort ${n.plural} by ${f.name}`, `  const values = (rows: Row[]) => rows.map((row) => row.${f.name} as number);

  it('sorts ascending and descending on the server', async () => {
    for (const value of ${lit(values)}) await create({ ${f.name}: value });

    const up = values(await list('?sort=${f.name}'));
    expect(up).toEqual([...up].sort((a, b) => a - b));
    const down = values(await list('?sort=-${f.name}'));
    expect(down).toEqual([...down].sort((a, b) => b - a));
    expect(up.length).toBe(down.length);
    expect(up.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps working without the parameter and answers 400 for anything else', async () => {
    const before = (await list()).length;
    await create();
    expect((await list()).length).toBe(before + 1);

    for (const value of ['id', 'bogus']) {
      const response = await app.request(\`/api/${k}?sort=\${encodeURIComponent(value)}\`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ message: 'Invalid sort' });
    }
  });`),
    reference: (routes) =>
      replaceList(
        addDrizzleImports(routes, ['asc', 'desc']),
        e,
        `  app.get('/', (c) => {
    const sort = c.req.query('sort');
    if (sort === undefined) return c.json(db.select().from(${e.plural}).all());
    if (sort !== '${f.name}' && sort !== '-${f.name}') return c.json({ message: 'Invalid sort' }, 400);
    const order = sort.startsWith('-') ? desc(${e.plural}.${f.name}) : asc(${e.plural}.${f.name});
    return c.json(db.select().from(${e.plural}).orderBy(order).all());
  });`,
      ),
  };
}

export function hiddenStats(e: GenEntity, f: Extract<GenField, { kind: 'enum' }>): Hidden {
  const n = names(e);
  const k = kebab(n.plural);
  const key = `by${cap(f.name)}`;
  const values = f.options.map(([v]) => v);
  const idRoute = `  app.get('/:${n.idParam}'`;
  return {
    file: 'stats.api.test.ts',
    test: header(e, `${n.plural} stats`, `  interface Stats {
    total: number;
    ${key}: Record<string, number>;
  }
  const stats = async () => {
    const response = await app.request('/api/${k}/stats');
    expect(response.status).toBe(200);
    return (await response.json()) as Stats;
  };

  it('counts every value, including the ones with no ${n.plural}', async () => {
    const before = await stats();
    expect(Object.keys(before.${key}).sort()).toEqual(${lit([...values].sort())});
    expect(Object.values(before.${key}).reduce((a, b) => a + b, 0)).toBe(before.total);
    expect(before.total).toBe((await list()).length);
  });

  it('follows new ${n.plural}', async () => {
    const before = await stats();
    await create({ ${f.name}: ${lit(values[0])} });
    await create({ ${f.name}: ${lit(values[0])} });
    await create({ ${f.name}: ${lit(values[values.length - 1])} });

    const after = await stats();
    expect(after.total).toBe(before.total + 3);
    expect(after.${key}[${lit(values[0])}]).toBe((before.${key}[${lit(values[0])}] ?? 0) + ${values.length === 1 ? '3' : '2'});
    expect(after.${key}[${lit(values[values.length - 1])}]).toBe((before.${key}[${lit(values[values.length - 1])}] ?? 0) + ${values.length === 1 ? '3' : '1'});
  });

  it('does not break reading one ${e.singular} by id', async () => {
    const created = await create();
    const response = await app.request(\`/api/${k}/\${created.id}\`);
    expect(response.status).toBe(200);
    expect((await app.request('/api/${k}/no-such-id')).status).toBe(404);
  });`),
    reference: (routes) => {
      if (!routes.includes(idRoute)) throw new Error(`${e.plural}: id route not found`);
      const constant = `${n.UPPER}_${pluralUpper(f.name)}`;
      return addDrizzleImports(routes, ['count'])
        .replace(`import { ${e.singular}InputSchema } from`, `import { ${constant}, ${e.singular}InputSchema } from`)
        .replace(
          idRoute,
          `  /** Registered before \`/:${n.idParam}\`, otherwise "stats" would be read as an id. */
  app.get('/stats', (c) => {
    const rows = db
      .select({ key: ${e.plural}.${f.name}, n: count() })
      .from(${e.plural})
      .groupBy(${e.plural}.${f.name})
      .all();
    const ${key} = Object.fromEntries(${constant}.map((value) => [value, 0])) as Record<string, number>;
    for (const row of rows) ${key}[row.key] = row.n;
    return c.json({ total: rows.reduce((sum, row) => sum + row.n, 0), ${key} });
  });

${idRoute}`,
        );
    },
  };
}

function pluralUpper(name: string): string {
  const plural = /(s|x|ch)$/.test(name) ? `${name}es` : /[^aeiou]y$/.test(name) ? `${name.slice(0, -1)}ies` : `${name}s`;
  return plural.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).toUpperCase();
}

/** For the planted delete bug the reference is the untouched generated feature. */
export function hiddenDelete(e: GenEntity): Hidden {
  const n = names(e);
  const k = kebab(n.plural);
  return {
    file: 'delete.api.test.ts',
    test: header(e, `delete ${n.plural}`, `  it('deletes an existing ${e.singular} and only that one', async () => {
    const keep = await create();
    const remove = await create();

    expect((await app.request(\`/api/${k}/\${remove.id}\`, { method: 'DELETE' })).status).toBe(204);
    expect((await app.request(\`/api/${k}/\${remove.id}\`)).status).toBe(404);
    expect((await app.request(\`/api/${k}/\${keep.id}\`)).status).toBe(200);
    expect((await list()).map((row) => row.id)).not.toContain(remove.id);
  });

  it('answers 404 for an unknown id', async () => {
    expect((await app.request('/api/${k}/no-such-id', { method: 'DELETE' })).status).toBe(404);
  });`),
    reference: (routes) => routes,
  };
}
