import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { Project, ProjectListItem } from '@shared/projects';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

const json = (body: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const input = {
  name: 'Sample value',
  description: 'Some longer text',
};

describe('/api/projects', () => {
  it('lists the seeded projects', async () => {
    const response = await app.request('/api/projects');
    expect(response.status).toBe(200);
    const list = (await response.json()) as ProjectListItem[];
    expect(list.map((project) => [project.name, project.taskCount])).toEqual([
      ['Website', 2],
      ['Mobile app', 0],
    ]);
  });

  it('creates a project and returns it by id', async () => {
    const response = await app.request('/api/projects', json(input));
    expect(response.status).toBe(201);
    const created = (await response.json()) as Project;
    expect(created).toMatchObject(input);

    const fetched = await app.request(`/api/projects/${created.id}`);
    expect(await fetched.json()).toEqual(created);
  });

  it('rejects invalid projects with 400', async () => {
    const response = await app.request('/api/projects', json({ ...input, name: '' }));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { message: string }).message).toBe('Invalid project');
  });

  it('answers 409 for a duplicate name on create and update', async () => {
    const duplicate = await app.request('/api/projects', json({ ...input, name: 'Website' }));
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ message: 'A project with this name already exists' });

    const update = await app.request('/api/projects/1', json({ name: 'Mobile app' }, 'PATCH'));
    expect(update.status).toBe(409);

    const same = await app.request('/api/projects/1', json({ name: 'Website' }, 'PATCH'));
    expect(same.status).toBe(200);
  });

  it('refuses to delete a project that still has tasks', async () => {
    const response = await app.request('/api/projects/1', { method: 'DELETE' });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: 'Project still has tasks' });
    expect((await app.request('/api/projects/1')).status).toBe(200);
  });

  it('updates and deletes a project, 404 for unknown ids', async () => {
    const updated = await app.request(
      '/api/projects/2',
      json({ description: input.description }, 'PATCH'),
    );
    expect(await updated.json()).toMatchObject({ id: '2', description: input.description });

    expect((await app.request('/api/projects/2', { method: 'DELETE' })).status).toBe(204);
    expect((await app.request('/api/projects/2')).status).toBe(404);
    expect(
      (await app.request('/api/projects/nope', json({ description: input.description }, 'PATCH')))
        .status,
    ).toBe(404);
  });
});
