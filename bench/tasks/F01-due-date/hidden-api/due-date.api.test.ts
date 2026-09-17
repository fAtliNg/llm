import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

const send = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const base = { title: 'Bench zeta-417', description: '', status: 'todo', priority: 'low' };

describe('F01 due date in the API', () => {
  it('stores a due date and returns it from the list and by id', async () => {
    const created = await app.request(
      '/api/tasks',
      send('POST', { ...base, dueDate: '2031-02-03' }),
    );
    expect(created.status).toBe(201);
    const task = (await created.json()) as { id: string; dueDate: string | null };
    expect(task.dueDate).toBe('2031-02-03');

    const byId = (await (await app.request(`/api/tasks/${task.id}`)).json()) as {
      dueDate: string | null;
    };
    expect(byId.dueDate).toBe('2031-02-03');

    const list = (await (await app.request('/api/tasks')).json()) as {
      id: string;
      dueDate: string | null;
    }[];
    expect(list.find((item) => item.id === task.id)?.dueDate).toBe('2031-02-03');
  });

  it('accepts null and clears a date with PATCH', async () => {
    const created = await app.request('/api/tasks', send('POST', { ...base, dueDate: null }));
    expect(created.status).toBe(201);
    const task = (await created.json()) as { id: string; dueDate: string | null };
    expect(task.dueDate).toBeNull();

    await app.request(`/api/tasks/${task.id}`, send('PATCH', { dueDate: '2031-05-06' }));
    const cleared = await app.request(`/api/tasks/${task.id}`, send('PATCH', { dueDate: null }));
    expect(((await cleared.json()) as { dueDate: string | null }).dueDate).toBeNull();
  });

  it('rejects a value that is not a date', async () => {
    const response = await app.request(
      '/api/tasks',
      send('POST', { ...base, dueDate: 'next friday' }),
    );
    expect(response.status).toBe(400);
  });

  it('keeps existing tasks readable', async () => {
    const list = (await (await app.request('/api/tasks')).json()) as { title: string }[];
    expect(list.map((task) => task.title)).toContain('Add tests');
  });
});
