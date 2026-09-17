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

interface Employee {
  id: string;
  name: string;
  managerId: string | null;
}

let counter = 0;
async function create(extra: Record<string, unknown> = {}) {
  counter += 1;
  const response = await app.request(
    '/api/employees',
    send('POST', {
      name: `Bench Person-${String(counter)}`,
      email: `person-${String(counter)}@bench.test`,
      department: 'design',
      startDate: null,
      managerId: null,
      ...extra,
    }),
  );
  return response;
}

describe('F07 manager in the API', () => {
  it('seeds a report and a manager', async () => {
    const list = (await (await app.request('/api/employees')).json()) as Employee[];
    const ids = new Set(list.map((employee) => employee.id));
    const reports = list.filter((employee) => employee.managerId !== null);
    expect(reports.length).toBeGreaterThanOrEqual(1);
    for (const report of reports) expect(ids.has(report.managerId ?? '')).toBe(true);
    expect(list.some((employee) => employee.managerId === null)).toBe(true);
  });

  it('stores and returns the manager', async () => {
    const boss = (await (await create()).json()) as Employee;
    expect(boss.managerId).toBeNull();
    const created = await create({ managerId: boss.id });
    expect(created.status).toBe(201);
    const report = (await created.json()) as Employee;
    expect(report.managerId).toBe(boss.id);
    expect(await (await app.request(`/api/employees/${report.id}`)).json()).toMatchObject({
      managerId: boss.id,
    });
  });

  it('rejects an unknown manager on create and update', async () => {
    const unknown = await create({ managerId: 'no-such-employee' });
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toMatchObject({ message: 'Unknown manager' });

    const someone = (await (await create()).json()) as Employee;
    const patched = await app.request(
      `/api/employees/${someone.id}`,
      send('PATCH', { managerId: 'no-such-employee' }),
    );
    expect(patched.status).toBe(400);
    expect(await patched.json()).toMatchObject({ message: 'Unknown manager' });
  });

  it('rejects an employee managing themselves', async () => {
    const someone = (await (await create()).json()) as Employee;
    const response = await app.request(
      `/api/employees/${someone.id}`,
      send('PATCH', { managerId: someone.id }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      message: 'An employee cannot manage themselves',
    });
  });

  it('sets and clears the manager with PATCH without touching other fields', async () => {
    const boss = (await (await create()).json()) as Employee;
    const someone = (await (await create()).json()) as Employee;

    const set = await app.request(`/api/employees/${someone.id}`, send('PATCH', { managerId: boss.id }));
    expect(set.status).toBe(200);
    expect(await set.json()).toMatchObject({ name: someone.name, managerId: boss.id });

    const renamed = await app.request(`/api/employees/${someone.id}`, send('PATCH', { name: 'Bench Renamed' }));
    expect(await renamed.json()).toMatchObject({ name: 'Bench Renamed', managerId: boss.id });

    const cleared = await app.request(`/api/employees/${someone.id}`, send('PATCH', { managerId: null }));
    expect(await cleared.json()).toMatchObject({ managerId: null });
  });

  it('deleting a manager leaves the reports without one', async () => {
    const boss = (await (await create()).json()) as Employee;
    const first = (await (await create({ managerId: boss.id })).json()) as Employee;
    const second = (await (await create({ managerId: boss.id })).json()) as Employee;

    expect((await app.request(`/api/employees/${boss.id}`, { method: 'DELETE' })).status).toBe(204);
    for (const report of [first, second]) {
      const stored = (await (await app.request(`/api/employees/${report.id}`)).json()) as Employee;
      expect(stored.managerId).toBeNull();
    }
  });
});
