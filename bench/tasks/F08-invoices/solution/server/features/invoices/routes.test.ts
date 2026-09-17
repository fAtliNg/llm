import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { Invoice } from '@shared/invoices';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

const json = (body: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const input = { number: 'INV-0100', customer: 'Initech', amount: 99.9 };

describe('/api/invoices', () => {
  it('lists the seeded invoices by number', async () => {
    const response = await app.request('/api/invoices');
    expect(response.status).toBe(200);
    const list = (await response.json()) as Invoice[];
    expect(list.map((invoice) => invoice.number)).toEqual(['INV-0001', 'INV-0002']);
  });

  it('creates a draft, whatever status the client sends', async () => {
    const response = await app.request('/api/invoices', json({ ...input, status: 'paid' }));
    expect(response.status).toBe(201);
    const created = (await response.json()) as Invoice;
    expect(created).toMatchObject({ ...input, status: 'draft' });
    expect(await (await app.request(`/api/invoices/${created.id}`)).json()).toEqual(created);
  });

  it('rejects invalid invoices with 400 and duplicates with 409', async () => {
    const invalid = await app.request('/api/invoices', json({ ...input, number: '100' }));
    expect(invalid.status).toBe(400);
    expect(((await invalid.json()) as { message: string }).message).toBe('Invalid invoice');
    expect((await app.request('/api/invoices', json({ ...input, amount: 0 }))).status).toBe(400);
    expect((await app.request('/api/invoices', json({ ...input, amount: 1.001 }))).status).toBe(
      400,
    );

    const duplicate = await app.request('/api/invoices', json({ ...input, number: 'INV-0001' }));
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({
      message: 'An invoice with this number already exists',
    });
  });

  it('moves a draft to sent and then to paid, one step at a time', async () => {
    expect((await app.request('/api/invoices/2/pay', { method: 'POST' })).status).toBe(409);

    const sent = await app.request('/api/invoices/2/send', { method: 'POST' });
    expect(await sent.json()).toMatchObject({ id: '2', status: 'sent' });
    expect((await app.request('/api/invoices/2/send', { method: 'POST' })).status).toBe(409);

    const paid = await app.request('/api/invoices/2/pay', { method: 'POST' });
    expect(await paid.json()).toMatchObject({ id: '2', status: 'paid' });

    expect((await app.request('/api/invoices/nope/send', { method: 'POST' })).status).toBe(404);
  });

  it('does not let PATCH change the status', async () => {
    const response = await app.request(
      '/api/invoices/2',
      json({ customer: 'Globex LLC', status: 'paid' }, 'PATCH'),
    );
    expect(await response.json()).toMatchObject({ customer: 'Globex LLC', status: 'draft' });
  });

  it('deletes invoices unless they are paid', async () => {
    expect((await app.request('/api/invoices/2', { method: 'DELETE' })).status).toBe(204);
    expect((await app.request('/api/invoices/2')).status).toBe(404);

    await app.request('/api/invoices/1/pay', { method: 'POST' });
    const paid = await app.request('/api/invoices/1', { method: 'DELETE' });
    expect(paid.status).toBe(409);
    expect(await paid.json()).toEqual({ message: 'A paid invoice cannot be deleted' });
  });
});
