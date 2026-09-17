import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { Employee } from '@shared/employees';

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
  name: 'Margaret Hamilton',
  email: 'margaret@example.com',
  department: 'engineering',
  startDate: '2025-01-15',
  managerId: null,
};

describe('/api/employees', () => {
  it('lists the seeded employees', async () => {
    const response = await app.request('/api/employees');
    expect(response.status).toBe(200);
    const list = (await response.json()) as Employee[];
    expect(list.map((employee) => employee.name)).toEqual(['Katherine Johnson', 'Dieter Rams']);
  });

  it('creates an employee and returns it by id', async () => {
    const response = await app.request('/api/employees', json(input));
    expect(response.status).toBe(201);
    const created = (await response.json()) as Employee;
    expect(created).toMatchObject(input);

    const fetched = await app.request(`/api/employees/${created.id}`);
    expect(await fetched.json()).toEqual(created);
  });

  it('rejects an invalid employee with 400', async () => {
    const response = await app.request('/api/employees', json({ ...input, email: 'nope' }));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { message: string }).message).toBe('Invalid employee');
  });

  it('answers 409 for a duplicate email on create and update', async () => {
    const duplicate = await app.request(
      '/api/employees',
      json({ ...input, email: 'dieter@example.com' }),
    );
    expect(duplicate.status).toBe(409);

    const update = await app.request(
      '/api/employees/1',
      json({ email: 'dieter@example.com' }, 'PATCH'),
    );
    expect(update.status).toBe(409);

    const same = await app.request(
      '/api/employees/1',
      json({ email: 'katherine@example.com' }, 'PATCH'),
    );
    expect(same.status).toBe(200);
  });

  it('checks the manager and clears it when the manager is deleted', async () => {
    const unknown = await app.request('/api/employees', json({ ...input, managerId: 'nope' }));
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toEqual({ message: 'Unknown manager' });

    const self = await app.request('/api/employees/1', json({ managerId: '1' }, 'PATCH'));
    expect(self.status).toBe(400);
    expect(await self.json()).toEqual({ message: 'An employee cannot manage themselves' });

    expect((await app.request('/api/employees/1', { method: 'DELETE' })).status).toBe(204);
    const report = (await (await app.request('/api/employees/2')).json()) as Employee;
    expect(report.managerId).toBeNull();
  });

  it('updates and deletes an employee, 404 for unknown ids', async () => {
    const updated = await app.request('/api/employees/2', json({ department: 'sales' }, 'PATCH'));
    expect(await updated.json()).toMatchObject({
      id: '2',
      department: 'sales',
      name: 'Dieter Rams',
    });

    expect((await app.request('/api/employees/2', { method: 'DELETE' })).status).toBe(204);
    expect((await app.request('/api/employees/2')).status).toBe(404);
    expect((await app.request('/api/employees/nope', json({ name: 'X' }, 'PATCH'))).status).toBe(
      404,
    );
  });
});
