import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

const post = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const names = async (url: string) =>
  ((await (await app.request(url)).json()) as { name: string }[]).map((item) => item.name);

describe('F03 department filter in the API', () => {
  it('returns only the requested department', async () => {
    await app.request(
      '/api/employees',
      post({
        name: 'Bench Nu-127',
        email: 'nu-127@bench.test',
        department: 'sales',
        startDate: null,
      }),
    );
    await app.request(
      '/api/employees',
      post({
        name: 'Bench Xi-864',
        email: 'xi-864@bench.test',
        department: 'design',
        startDate: null,
      }),
    );

    expect(await names('/api/employees?department=sales')).toEqual(['Bench Nu-127']);
    expect(await names('/api/employees?department=design')).toContain('Bench Xi-864');
    expect(await names('/api/employees?department=design')).not.toContain('Bench Nu-127');
  });

  it('returns everyone without the parameter', async () => {
    await app.request(
      '/api/employees',
      post({
        name: 'Bench Omicron-390',
        email: 'omicron-390@bench.test',
        department: 'sales',
        startDate: null,
      }),
    );
    const all = await names('/api/employees');
    expect(all).toContain('Bench Omicron-390');
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it('answers 400 for an unknown department', async () => {
    const response = await app.request('/api/employees?department=finance');
    expect(response.status).toBe(400);
    expect(((await response.json()) as { message: string }).message).toBe('Invalid department');
  });
});
