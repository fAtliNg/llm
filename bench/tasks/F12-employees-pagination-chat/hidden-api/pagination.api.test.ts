import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

interface Page {
  items: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
}

async function add(count: number) {
  for (let i = 1; i <= count; i += 1) {
    const response = await app.request('/api/employees', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: `Bench ${String(i).padStart(3, '0')}`,
        email: `bench-${String(i)}@bench.test`,
        department: 'design',
        startDate: null,
      }),
    });
    expect(response.status).toBe(201);
  }
}

const get = async (query = '') => {
  const response = await app.request(`/api/employees${query}`);
  return { status: response.status, body: (await response.json()) as Page };
};

describe('F12 pagination in the API', () => {
  it('returns the first ten by default, sorted by name, with the total', async () => {
    await add(23);
    const { status, body } = await get();
    expect(status).toBe(200);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
    expect(body.total).toBeGreaterThanOrEqual(25);
    expect(body.items).toHaveLength(10);
    expect(body.items.map((item) => item.name)).toEqual(
      Array.from({ length: 10 }, (_, i) => `Bench ${String(i + 1).padStart(3, '0')}`),
    );
  });

  it('walks the pages without gaps or repeats', async () => {
    await add(23);
    const seen: string[] = [];
    const { body: first } = await get('?page=1&pageSize=7');
    const pages = Math.ceil(first.total / 7);
    for (let page = 1; page <= pages; page += 1) {
      const { body } = await get(`?page=${String(page)}&pageSize=7`);
      expect(body.page).toBe(page);
      expect(body.pageSize).toBe(7);
      expect(body.total).toBe(first.total);
      seen.push(...body.items.map((item) => item.id));
    }
    expect(seen).toHaveLength(first.total);
    expect(new Set(seen).size).toBe(first.total);

    const { status, body: beyond } = await get(`?page=${String(pages + 1)}&pageSize=7`);
    expect(status).toBe(200);
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(first.total);
  });

  it('accepts page sizes from 1 to 50', async () => {
    await add(3);
    expect((await get('?pageSize=1')).body.items).toHaveLength(1);
    expect((await get('?pageSize=50')).status).toBe(200);
  });

  it('rejects invalid pagination with 400', async () => {
    for (const query of ['?page=0', '?page=-1', '?page=abc', '?page=1.5', '?pageSize=0', '?pageSize=51', '?pageSize=ten']) {
      const response = await app.request(`/api/employees${query}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ message: 'Invalid pagination' });
    }
  });
});
