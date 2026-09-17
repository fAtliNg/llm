import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';
import type { Booking } from '@shared/bookings';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(createTestDb());
});

const json = (body: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const input = { title: 'Retro', room: 'borealis', date: '2026-11-02', startHour: 9, endHour: 11 };

describe('/api/bookings', () => {
  it('lists the seeded bookings', async () => {
    const response = await app.request('/api/bookings');
    expect(response.status).toBe(200);
    const list = (await response.json()) as Booking[];
    expect(list.map((booking) => booking.title)).toEqual(['Sprint planning', 'Design review']);
  });

  it('creates a booking and returns it by id', async () => {
    const response = await app.request('/api/bookings', json(input));
    expect(response.status).toBe(201);
    const created = (await response.json()) as Booking;
    expect(created).toMatchObject(input);

    const fetched = await app.request(`/api/bookings/${created.id}`);
    expect(await fetched.json()).toEqual(created);
  });

  it('rejects invalid bookings with 400', async () => {
    const backwards = await app.request('/api/bookings', json({ ...input, endHour: 9 }));
    expect(backwards.status).toBe(400);
    expect(((await backwards.json()) as { message: string }).message).toBe('Invalid booking');

    expect((await app.request('/api/bookings', json({ ...input, room: 'attic' }))).status).toBe(
      400,
    );
    expect((await app.request('/api/bookings', json({ ...input, startHour: 7 }))).status).toBe(400);
  });

  it('answers 409 when the room is taken, but allows back-to-back and other rooms', async () => {
    expect((await app.request('/api/bookings', json(input))).status).toBe(201);

    const clash = await app.request(
      '/api/bookings',
      json({ ...input, startHour: 10, endHour: 12 }),
    );
    expect(clash.status).toBe(409);
    expect(await clash.json()).toEqual({ message: 'This room is already booked for that time' });

    const after = await app.request(
      '/api/bookings',
      json({ ...input, startHour: 11, endHour: 12 }),
    );
    expect(after.status).toBe(201);
    const elsewhere = await app.request('/api/bookings', json({ ...input, room: 'atlas' }));
    expect(elsewhere.status).toBe(201);
  });

  it('validates the merged booking on update', async () => {
    const moved = await app.request('/api/bookings/1', json({ endHour: 13 }, 'PATCH'));
    expect(moved.status).toBe(200);
    expect(await moved.json()).toMatchObject({ id: '1', startHour: 10, endHour: 13 });

    expect((await app.request('/api/bookings/1', json({ endHour: 10 }, 'PATCH'))).status).toBe(400);

    await app.request(
      '/api/bookings',
      json({ ...input, room: 'atlas', date: '2026-10-05', startHour: 8, endHour: 10 }),
    );
    const clash = await app.request('/api/bookings/1', json({ startHour: 9 }, 'PATCH'));
    expect(clash.status).toBe(409);

    expect((await app.request('/api/bookings/nope', json({ title: 'x' }, 'PATCH'))).status).toBe(
      404,
    );
  });

  it('allows the same room and hours on another date', async () => {
    expect((await app.request('/api/bookings', json(input))).status).toBe(201);
    const nextDay = await app.request('/api/bookings', json({ ...input, date: '2026-11-03' }));
    expect(nextDay.status).toBe(201);
  });

  it('deletes a booking', async () => {
    expect((await app.request('/api/bookings/2', { method: 'DELETE' })).status).toBe(204);
    expect((await app.request('/api/bookings/2')).status).toBe(404);
  });
});
