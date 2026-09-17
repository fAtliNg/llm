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
  email: string;
  department: string;
  startDate: string | null;
}

const input = {
  name: 'Bench Kappa-318',
  email: 'kappa-318@bench.test',
  department: 'design',
  startDate: '2030-04-05',
};

describe('F02 employees API', () => {
  it('seeds at least two employees and lists them', async () => {
    const response = await app.request('/api/employees');
    expect(response.status).toBe(200);
    expect(((await response.json()) as Employee[]).length).toBeGreaterThanOrEqual(2);
  });

  it('creates, reads, updates and deletes an employee', async () => {
    const created = await app.request('/api/employees', send('POST', input));
    expect(created.status).toBe(201);
    const employee = (await created.json()) as Employee;
    expect(employee).toMatchObject(input);

    expect(await (await app.request(`/api/employees/${employee.id}`)).json()).toEqual(employee);

    const patched = await app.request(
      `/api/employees/${employee.id}`,
      send('PATCH', { department: 'sales', startDate: null }),
    );
    expect(patched.status).toBe(200);
    expect(await patched.json()).toMatchObject({
      id: employee.id,
      department: 'sales',
      startDate: null,
      name: input.name,
    });

    expect((await app.request(`/api/employees/${employee.id}`, { method: 'DELETE' })).status).toBe(
      204,
    );
    expect((await app.request(`/api/employees/${employee.id}`)).status).toBe(404);
  });

  it('rejects invalid bodies with 400', async () => {
    expect(
      (await app.request('/api/employees', send('POST', { ...input, email: 'not-an-email' })))
        .status,
    ).toBe(400);
    expect((await app.request('/api/employees', send('POST', { ...input, name: '' }))).status).toBe(
      400,
    );
    expect(
      (await app.request('/api/employees', send('POST', { ...input, department: 'finance' })))
        .status,
    ).toBe(400);
    expect(
      (await app.request('/api/employees', send('POST', { ...input, startDate: 'soon' }))).status,
    ).toBe(400);
  });

  it('answers 409 with the agreed message for a duplicate email', async () => {
    expect((await app.request('/api/employees', send('POST', input))).status).toBe(201);
    const duplicate = await app.request(
      '/api/employees',
      send('POST', { ...input, name: 'Bench Other-944' }),
    );
    expect(duplicate.status).toBe(409);
    expect(((await duplicate.json()) as { message: string }).message).toBe(
      'An employee with this email already exists',
    );
  });

  it('answers 404 for unknown ids', async () => {
    expect((await app.request('/api/employees/bench-missing')).status).toBe(404);
    expect(
      (await app.request('/api/employees/bench-missing', send('PATCH', { name: 'X' }))).status,
    ).toBe(404);
    expect((await app.request('/api/employees/bench-missing', { method: 'DELETE' })).status).toBe(
      404,
    );
  });
});
