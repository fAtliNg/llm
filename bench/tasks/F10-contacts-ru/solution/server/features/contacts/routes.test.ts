import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { Contact } from '@shared/contacts';

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
  email: 'sample@example.com',
  phone: '+4915112345678',
  group: 'work',
};

describe('/api/contacts', () => {
  it('lists the seeded contacts', async () => {
    const response = await app.request('/api/contacts');
    expect(response.status).toBe(200);
    const list = (await response.json()) as Contact[];
    expect(list.map((contact) => contact.name)).toEqual([
      'Barbara Liskov',
      'Alan Kay',
      'Grace Hopper',
    ]);
  });

  it('creates a contact and returns it by id', async () => {
    const response = await app.request('/api/contacts', json(input));
    expect(response.status).toBe(201);
    const created = (await response.json()) as Contact;
    expect(created).toMatchObject(input);

    const fetched = await app.request(`/api/contacts/${created.id}`);
    expect(await fetched.json()).toEqual(created);
  });

  it('rejects invalid contacts with 400', async () => {
    const response = await app.request('/api/contacts', json({ ...input, name: '' }));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { message: string }).message).toBe('Invalid contact');
    expect(
      (await app.request('/api/contacts', json({ ...input, email: 'not-an-email' }))).status,
    ).toBe(400);
    expect(
      (await app.request('/api/contacts', json({ ...input, group: 'no-such-option' }))).status,
    ).toBe(400);
  });

  it('answers 409 for a duplicate email on create and update', async () => {
    const duplicate = await app.request(
      '/api/contacts',
      json({ ...input, email: 'grace@example.com' }),
    );
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ message: 'A contact with this email already exists' });

    const update = await app.request(
      '/api/contacts/1',
      json({ email: 'alan.kay@example.com' }, 'PATCH'),
    );
    expect(update.status).toBe(409);

    const same = await app.request(
      '/api/contacts/1',
      json({ email: 'grace@example.com' }, 'PATCH'),
    );
    expect(same.status).toBe(200);
  });

  it('updates and deletes a contact, 404 for unknown ids', async () => {
    const updated = await app.request('/api/contacts/2', json({ name: input.name }, 'PATCH'));
    expect(await updated.json()).toMatchObject({ id: '2', name: input.name });

    expect((await app.request('/api/contacts/2', { method: 'DELETE' })).status).toBe(204);
    expect((await app.request('/api/contacts/2')).status).toBe(404);
    expect(
      (await app.request('/api/contacts/nope', json({ name: input.name }, 'PATCH'))).status,
    ).toBe(404);
  });

  it('searches the name and the email, ignoring case', async () => {
    const byName = (await (await app.request('/api/contacts?q=HOPP')).json()) as Contact[];
    expect(byName.map((contact) => contact.name)).toEqual(['Grace Hopper']);
    const byEmail = (await (await app.request('/api/contacts?q=alan.kay@')).json()) as Contact[];
    expect(byEmail.map((contact) => contact.name)).toEqual(['Alan Kay']);
    expect(await (await app.request('/api/contacts?q=zzz')).json()).toEqual([]);
  });

  it('toggles the favourite flag with PATCH and rejects a badly formatted phone', async () => {
    const response = await app.request('/api/contacts/1', json({ favorite: true }, 'PATCH'));
    expect(await response.json()).toMatchObject({ id: '1', favorite: true, name: 'Grace Hopper' });

    const list = (await (await app.request('/api/contacts')).json()) as Contact[];
    expect(list.map((contact) => contact.name)).toEqual([
      'Barbara Liskov',
      'Grace Hopper',
      'Alan Kay',
    ]);

    expect((await app.request('/api/contacts', json({ ...input, phone: '12345' }))).status).toBe(
      400,
    );
  });
});
