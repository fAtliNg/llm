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

interface Project {
  id: string;
  name: string;
  description: string;
  taskCount?: number;
}
interface Task {
  id: string;
  title: string;
  projectId: string | null;
}

const task = { title: 'Bench Task-318', description: '', status: 'todo', priority: 'low' };
const list = async () => (await (await app.request('/api/projects')).json()) as Project[];
const countOf = async (id: string) => (await list()).find((project) => project.id === id)?.taskCount;

async function createProject(name: string) {
  const response = await app.request('/api/projects', send('POST', { name, description: '' }));
  expect(response.status).toBe(201);
  return (await response.json()) as Project;
}

describe('F09 projects API', () => {
  it('seeds two projects, two tasks in the first one and one task without a project', async () => {
    const projects = await list();
    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects.map((project) => project.taskCount).sort()).toEqual([0, 2]);

    const tasks = (await (await app.request('/api/tasks')).json()) as Task[];
    expect(tasks.filter((item) => item.projectId === null)).toHaveLength(1);
  });

  it('creates, reads, updates and deletes a project', async () => {
    const project = await createProject('Bench Kappa-318');
    expect(project).toMatchObject({ name: 'Bench Kappa-318', description: '' });
    expect(await (await app.request(`/api/projects/${project.id}`)).json()).toMatchObject({
      id: project.id,
      name: 'Bench Kappa-318',
    });

    const patched = await app.request(
      `/api/projects/${project.id}`,
      send('PATCH', { description: 'Bench description' }),
    );
    expect(patched.status).toBe(200);
    expect(await patched.json()).toMatchObject({
      name: 'Bench Kappa-318',
      description: 'Bench description',
    });

    expect((await app.request(`/api/projects/${project.id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await app.request(`/api/projects/${project.id}`)).status).toBe(404);
    expect((await app.request('/api/projects/no-such-id', send('PATCH', { name: 'x' }))).status).toBe(
      404,
    );
  });

  it('rejects invalid projects with 400 and duplicate names with 409', async () => {
    expect((await app.request('/api/projects', send('POST', { name: ' ', description: '' }))).status).toBe(400);
    expect(
      (await app.request('/api/projects', send('POST', { name: 'x'.repeat(61), description: '' }))).status,
    ).toBe(400);

    await createProject('Bench Lambda-206');
    const duplicate = await app.request(
      '/api/projects',
      send('POST', { name: 'Bench Lambda-206', description: 'again' }),
    );
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ message: 'A project with this name already exists' });
  });

  it('stores the project of a task and rejects unknown projects', async () => {
    const project = await createProject('Bench Mu-553');
    const created = await app.request('/api/tasks', send('POST', { ...task, projectId: project.id }));
    expect(created.status).toBe(201);
    const stored = (await created.json()) as Task;
    expect(stored.projectId).toBe(project.id);

    const unknown = await app.request('/api/tasks', send('POST', { ...task, projectId: 'no-such-project' }));
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toMatchObject({ message: 'Unknown project' });

    const moved = await app.request(`/api/tasks/${stored.id}`, send('PATCH', { projectId: 'no-such-project' }));
    expect(moved.status).toBe(400);

    const renamed = await app.request(`/api/tasks/${stored.id}`, send('PATCH', { title: 'Bench Renamed' }));
    expect(await renamed.json()).toMatchObject({ title: 'Bench Renamed', projectId: project.id });
  });

  it('counts tasks per project as they are created, moved and deleted', async () => {
    const first = await createProject('Bench Nu-847');
    const second = await createProject('Bench Xi-112');
    expect(await countOf(first.id)).toBe(0);

    const a = (await (await app.request('/api/tasks', send('POST', { ...task, projectId: first.id }))).json()) as Task;
    const b = (await (await app.request('/api/tasks', send('POST', { ...task, projectId: first.id }))).json()) as Task;
    expect(await countOf(first.id)).toBe(2);

    await app.request(`/api/tasks/${a.id}`, send('PATCH', { projectId: second.id }));
    expect(await countOf(first.id)).toBe(1);
    expect(await countOf(second.id)).toBe(1);

    await app.request(`/api/tasks/${b.id}`, { method: 'DELETE' });
    expect(await countOf(first.id)).toBe(0);

    await app.request(`/api/tasks/${a.id}`, send('PATCH', { projectId: null }));
    expect(await countOf(second.id)).toBe(0);
  });

  it('refuses to delete a project that still has tasks', async () => {
    const project = await createProject('Bench Omicron-390');
    const created = (await (await app.request('/api/tasks', send('POST', { ...task, projectId: project.id }))).json()) as Task;

    const refused = await app.request(`/api/projects/${project.id}`, { method: 'DELETE' });
    expect(refused.status).toBe(409);
    expect(await refused.json()).toEqual({ message: 'Project still has tasks' });

    await app.request(`/api/tasks/${created.id}`, { method: 'DELETE' });
    expect((await app.request(`/api/projects/${project.id}`, { method: 'DELETE' })).status).toBe(204);
  });
});
