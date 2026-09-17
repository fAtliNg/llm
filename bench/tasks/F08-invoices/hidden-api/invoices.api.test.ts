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

interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: string;
}

const input = { number: 'INV-7318', customer: 'Bench Kappa-318', amount: 1234.56 };
const post = (body: unknown) => app.request('/api/invoices', send('POST', body));
const act = (id: string, action: string) =>
  app.request(`/api/invoices/${id}/${action}`, { method: 'POST' });

describe('F08 invoices API', () => {
  it('seeds a sent and a draft invoice', async () => {
    const list = (await (await app.request('/api/invoices')).json()) as Invoice[];
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some((invoice) => invoice.status === 'sent')).toBe(true);
    expect(list.some((invoice) => invoice.status === 'draft')).toBe(true);
  });

  it('creates a draft whatever the client sends, reads it and lists by number', async () => {
    const created = await post({ ...input, status: 'paid' });
    expect(created.status).toBe(201);
    const invoice = (await created.json()) as Invoice;
    expect(invoice).toMatchObject({ ...input, status: 'draft' });
    expect(await (await app.request(`/api/invoices/${invoice.id}`)).json()).toEqual(invoice);

    await post({ ...input, number: 'INV-7000' });
    const numbers = ((await (await app.request('/api/invoices')).json()) as Invoice[]).map(
      (item) => item.number,
    );
    expect(numbers).toEqual([...numbers].sort());
    expect(numbers).toContain('INV-7000');
  });

  it('rejects invalid bodies with 400', async () => {
    for (const number of ['7318', 'INV-12', 'INV-12345', 'inv-0001', '']) {
      expect((await post({ ...input, number })).status).toBe(400);
    }
    expect((await post({ ...input, customer: '  ' })).status).toBe(400);
    expect((await post({ ...input, amount: 0 })).status).toBe(400);
    expect((await post({ ...input, amount: -5 })).status).toBe(400);
    expect((await post({ ...input, amount: 10.999 })).status).toBe(400);
    expect((await post({ ...input, amount: '10' })).status).toBe(400);
  });

  it('answers 409 for a duplicate number on create and update', async () => {
    const first = (await (await post(input)).json()) as Invoice;
    const duplicate = await post({ ...input, customer: 'Someone else' });
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({
      message: 'An invoice with this number already exists',
    });

    const second = (await (await post({ ...input, number: 'INV-7319' })).json()) as Invoice;
    const patched = await app.request(
      `/api/invoices/${second.id}`,
      send('PATCH', { number: first.number }),
    );
    expect(patched.status).toBe(409);
    const same = await app.request(
      `/api/invoices/${second.id}`,
      send('PATCH', { number: 'INV-7319', amount: 5 }),
    );
    expect(same.status).toBe(200);
    expect(await same.json()).toMatchObject({ amount: 5, status: 'draft' });
  });

  it('moves the status one step at a time', async () => {
    const invoice = (await (await post(input)).json()) as Invoice;

    const early = await act(invoice.id, 'pay');
    expect(early.status).toBe(409);
    expect(await early.json()).toEqual({ message: 'Invoice is not in the right state' });

    const sent = await act(invoice.id, 'send');
    expect(sent.status).toBe(200);
    expect(await sent.json()).toMatchObject({ id: invoice.id, status: 'sent' });
    expect((await act(invoice.id, 'send')).status).toBe(409);

    const paid = await act(invoice.id, 'pay');
    expect(await paid.json()).toMatchObject({ id: invoice.id, status: 'paid' });
    expect((await act(invoice.id, 'pay')).status).toBe(409);
    expect((await act(invoice.id, 'send')).status).toBe(409);

    expect((await act('no-such-id', 'send')).status).toBe(404);
    expect((await act('no-such-id', 'pay')).status).toBe(404);
  });

  it('does not let PATCH change the status', async () => {
    const invoice = (await (await post(input)).json()) as Invoice;
    await app.request(`/api/invoices/${invoice.id}`, send('PATCH', { status: 'paid' }));
    const stored = (await (await app.request(`/api/invoices/${invoice.id}`)).json()) as Invoice;
    expect(stored.status).toBe('draft');
  });

  it('deletes drafts and sent invoices, but not paid ones', async () => {
    const draft = (await (await post(input)).json()) as Invoice;
    expect((await app.request(`/api/invoices/${draft.id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await app.request(`/api/invoices/${draft.id}`)).status).toBe(404);
    expect((await app.request(`/api/invoices/${draft.id}`, { method: 'DELETE' })).status).toBe(404);

    const other = (await (await post(input)).json()) as Invoice;
    await act(other.id, 'send');
    await act(other.id, 'pay');
    const refused = await app.request(`/api/invoices/${other.id}`, { method: 'DELETE' });
    expect(refused.status).toBe(409);
    expect(await refused.json()).toEqual({ message: 'A paid invoice cannot be deleted' });
    expect((await app.request(`/api/invoices/${other.id}`)).status).toBe(200);
  });
});
