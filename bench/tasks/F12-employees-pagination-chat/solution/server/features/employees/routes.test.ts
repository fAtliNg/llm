import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { Employee, EmployeePage } from '@shared/employees';

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
};

describe('/api/employees', () => {
  it('lists the seeded employees', async () => {
    const response = await app.request('/api/employees');
    expect(response.status).toBe(200);
    const body = (await response.json()) as EmployeePage;
    expect(body.items.map((employee) => employee.name)).toEqual([
      'Dieter Rams',
      'Katherine Johnson',
    ]);
    expect(body).toMatchObject({ total: 2, page: 1, pageSize: 10 });
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

  it('pages through the employees sorted by name', async () => {
    for (const name of ['Ada', 'Zed', 'Bob']) {
      await app.request('/api/employees', json({ ...input, name, email: `${name}@example.com` }));
    }

    const first = (await (
      await app.request('/api/employees?page=1&pageSize=2')
    ).json()) as EmployeePage;
    expect(first.items.map((employee) => employee.name)).toEqual(['Ada', 'Bob']);
    expect(first.total).toBe(5);

    const last = (await (
      await app.request('/api/employees?page=3&pageSize=2')
    ).json()) as EmployeePage;
    expect(last.items.map((employee) => employee.name)).toEqual(['Zed']);

    const beyond = (await (
      await app.request('/api/employees?page=9&pageSize=2')
    ).json()) as EmployeePage;
    expect(beyond.items).toEqual([]);
  });

  it('rejects invalid pagination with 400', async () => {
    for (const query of ['page=0', 'page=x', 'pageSize=0', 'pageSize=51', 'page=1.5']) {
      const response = await app.request(`/api/employees?${query}`);
      expect(response.status).toBe(400);
      expect(((await response.json()) as { message: string }).message).toBe('Invalid pagination');
    }
  });
});
