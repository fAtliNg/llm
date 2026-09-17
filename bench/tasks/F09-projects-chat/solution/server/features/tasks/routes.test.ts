import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { Task } from '@shared/tasks';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

const json = (body: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

describe('/api/tasks', () => {
  it('lists the seeded tasks', async () => {
    const response = await app.request('/api/tasks');
    expect(response.status).toBe(200);
    const tasks = (await response.json()) as Task[];
    expect(tasks.map((task) => task.title)).toEqual([
      'Set up the project',
      'Write the task form',
      'Add tests',
    ]);
  });

  it('creates a task and returns it with an id', async () => {
    const input = {
      title: 'Ship it',
      description: '',
      status: 'todo',
      priority: 'high',
      projectId: '2',
    };
    const response = await app.request('/api/tasks', json(input));
    expect(response.status).toBe(201);
    const created = (await response.json()) as Task;
    expect(created).toMatchObject(input);

    const fetched = await app.request(`/api/tasks/${created.id}`);
    expect(await fetched.json()).toEqual(created);
  });

  it('rejects an invalid task with 400 and the issues', async () => {
    const response = await app.request('/api/tasks', json({ title: '' }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string; issues: unknown[] };
    expect(body.message).toBe('Invalid task');
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it('updates part of a task', async () => {
    const response = await app.request('/api/tasks/3', json({ status: 'done' }, 'PATCH'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: '3', status: 'done', title: 'Add tests' });
  });

  it('deletes a task and answers 404 afterwards', async () => {
    expect((await app.request('/api/tasks/3', { method: 'DELETE' })).status).toBe(204);
    expect((await app.request('/api/tasks/3')).status).toBe(404);
    expect((await app.request('/api/tasks/3', { method: 'DELETE' })).status).toBe(404);
  });

  it('rejects an unknown project on create and update, and clears the project with null', async () => {
    const task = { title: 'Orphan', description: '', status: 'todo', priority: 'low' };
    const created = await app.request('/api/tasks', json({ ...task, projectId: 'nope' }));
    expect(created.status).toBe(400);
    expect(await created.json()).toEqual({ message: 'Unknown project' });

    const moved = await app.request('/api/tasks/1', json({ projectId: 'nope' }, 'PATCH'));
    expect(moved.status).toBe(400);

    const cleared = await app.request('/api/tasks/1', json({ projectId: null }, 'PATCH'));
    expect(await cleared.json()).toMatchObject({ id: '1', projectId: null });
  });
});
