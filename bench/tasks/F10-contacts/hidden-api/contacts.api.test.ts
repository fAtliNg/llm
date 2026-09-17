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

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  group: string;
  favorite: boolean;
}

const input = { name: 'Bench Kappa-318', email: 'kappa-318@bench.test', phone: '+4915112345678', group: 'family' };
const post = (body: unknown) => app.request('/api/contacts', send('POST', body));
const list = async (query = '') => (await (await app.request(`/api/contacts${query}`)).json()) as Contact[];

describe('F10 contacts API', () => {
  it('seeds three contacts with one favourite, favourites first', async () => {
    const contacts = await list();
    expect(contacts.length).toBeGreaterThanOrEqual(3);
    expect(contacts.filter((contact) => contact.favorite)).toHaveLength(1);
    expect(contacts[0]?.favorite).toBe(true);
  });

  it('creates a contact that is not a favourite, whatever the client sends', async () => {
    const created = await post({ ...input, favorite: true });
    expect(created.status).toBe(201);
    const contact = (await created.json()) as Contact;
    expect(contact).toMatchObject({ ...input, favorite: false });
    expect(await (await app.request(`/api/contacts/${contact.id}`)).json()).toEqual(contact);

    const noPhone = await post({ ...input, email: 'no-phone@bench.test', phone: null });
    expect(noPhone.status).toBe(201);
    expect(((await noPhone.json()) as Contact).phone).toBeNull();
  });

  it('rejects invalid bodies with 400 and a duplicate email with 409', async () => {
    expect((await post({ ...input, name: ' ' })).status).toBe(400);
    expect((await post({ ...input, email: 'nope' })).status).toBe(400);
    expect((await post({ ...input, group: 'enemies' })).status).toBe(400);
    for (const phone of ['4915112345678', '+12', '+49 151 1234', '+1234567890123456', '']) {
      expect((await post({ ...input, phone })).status).toBe(400);
    }

    expect((await post(input)).status).toBe(201);
    const duplicate = await post({ ...input, name: 'Someone else' });
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ message: 'A contact with this email already exists' });
  });

  it('sorts favourites first and then by name', async () => {
    const ids: Record<string, string> = {};
    for (const name of ['Bench Zeta', 'Bench Alpha', 'Bench Mid']) {
      const created = (await (
        await post({ ...input, name, email: `${name.replace(' ', '-').toLowerCase()}@bench.test` })
      ).json()) as Contact;
      ids[name] = created.id;
    }
    const toggled = await app.request(`/api/contacts/${ids['Bench Zeta'] ?? ''}`, send('PATCH', { favorite: true }));
    expect(toggled.status).toBe(200);
    expect(await toggled.json()).toMatchObject({ name: 'Bench Zeta', favorite: true });

    const contacts = await list();
    const favourites = contacts.filter((contact) => contact.favorite).map((contact) => contact.name);
    const others = contacts.filter((contact) => !contact.favorite).map((contact) => contact.name);
    expect(contacts.map((contact) => contact.name)).toEqual([...favourites, ...others]);
    expect(favourites).toEqual([...favourites].sort((a, b) => a.localeCompare(b)));
    expect(others).toEqual([...others].sort((a, b) => a.localeCompare(b)));
    expect(favourites).toContain('Bench Zeta');
    expect(others.indexOf('Bench Alpha')).toBeLessThan(others.indexOf('Bench Mid'));

    await app.request(`/api/contacts/${ids['Bench Zeta'] ?? ''}`, send('PATCH', { favorite: false }));
    expect((await list()).filter((contact) => contact.favorite).map((c) => c.name)).not.toContain('Bench Zeta');
  });

  it('searches the name and the email, ignoring case', async () => {
    await post({ ...input, name: 'Bench Quokka', email: 'first@bench.test' });
    await post({ ...input, name: 'Bench Other', email: 'wombat-77@bench.test' });

    expect((await list('?q=QUOKKA')).map((contact) => contact.name)).toEqual(['Bench Quokka']);
    expect((await list('?q=Wombat-77')).map((contact) => contact.name)).toEqual(['Bench Other']);
    expect((await list('?q=bench')).length).toBe(2);
    expect(await list('?q=no-such-text-anywhere')).toEqual([]);
    expect((await list('?q=')).length).toBeGreaterThanOrEqual(5);
  });

  it('updates and deletes a contact, 404 for unknown ids', async () => {
    const contact = (await (await post(input)).json()) as Contact;
    const patched = await app.request(`/api/contacts/${contact.id}`, send('PATCH', { phone: null, group: 'work' }));
    expect(await patched.json()).toMatchObject({ name: input.name, phone: null, group: 'work', favorite: false });
    expect((await app.request(`/api/contacts/${contact.id}`, send('PATCH', { phone: 'abc' }))).status).toBe(400);

    expect((await app.request(`/api/contacts/${contact.id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await app.request(`/api/contacts/${contact.id}`)).status).toBe(404);
    expect((await app.request('/api/contacts/no-such-id', send('PATCH', { favorite: true }))).status).toBe(404);
  });
});
