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

interface Booking {
  id: string;
  title: string;
  room: string;
  date: string;
  startHour: number;
  endHour: number;
}

const input = {
  title: 'Bench Kappa-318',
  room: 'borealis',
  date: '2031-04-05',
  startHour: 13,
  endHour: 15,
};

const post = (body: unknown) => app.request('/api/bookings', send('POST', body));

describe('F05 bookings API', () => {
  it('seeds at least two bookings and lists them', async () => {
    const response = await app.request('/api/bookings');
    expect(response.status).toBe(200);
    expect(((await response.json()) as Booking[]).length).toBeGreaterThanOrEqual(2);
  });

  it('creates, reads and deletes a booking', async () => {
    const created = await post(input);
    expect(created.status).toBe(201);
    const booking = (await created.json()) as Booking;
    expect(booking).toMatchObject(input);
    expect(await (await app.request(`/api/bookings/${booking.id}`)).json()).toEqual(booking);

    expect((await app.request(`/api/bookings/${booking.id}`, { method: 'DELETE' })).status).toBe(
      204,
    );
    expect((await app.request(`/api/bookings/${booking.id}`)).status).toBe(404);
    expect((await app.request(`/api/bookings/${booking.id}`, { method: 'DELETE' })).status).toBe(
      404,
    );
  });

  it('lists bookings sorted by date and start hour', async () => {
    await post({ ...input, date: '2031-04-06', startHour: 9, endHour: 10, title: 'Bench C' });
    await post({ ...input, date: '2031-04-05', startHour: 16, endHour: 17, title: 'Bench B' });
    await post({ ...input, date: '2031-04-05', startHour: 8, endHour: 9, title: 'Bench A' });
    const list = (await (await app.request('/api/bookings')).json()) as Booking[];
    expect(list.filter((b) => b.title.startsWith('Bench ')).map((b) => b.title)).toEqual([
      'Bench A',
      'Bench B',
      'Bench C',
    ]);
  });

  it('rejects invalid bodies with 400', async () => {
    expect((await post({ ...input, title: '' })).status).toBe(400);
    expect((await post({ ...input, room: 'attic' })).status).toBe(400);
    expect((await post({ ...input, date: 'tomorrow' })).status).toBe(400);
    expect((await post({ ...input, startHour: 7 })).status).toBe(400);
    expect((await post({ ...input, endHour: 21 })).status).toBe(400);
    expect((await post({ ...input, startHour: 13.5 })).status).toBe(400);
    expect((await post({ ...input, endHour: 13 })).status).toBe(400);
    expect((await post({ ...input, startHour: 15, endHour: 14 })).status).toBe(400);
  });

  it('answers 409 for intersecting bookings of the same room and date only', async () => {
    expect((await post(input)).status).toBe(201);

    for (const [startHour, endHour] of [
      [13, 15],
      [12, 14],
      [14, 16],
      [14, 15],
      [12, 16],
    ]) {
      const clash = await post({ ...input, title: 'Clash', startHour, endHour });
      expect(clash.status).toBe(409);
      expect(await clash.json()).toEqual({ message: 'This room is already booked for that time' });
    }

    expect((await post({ ...input, startHour: 15, endHour: 16 })).status).toBe(201);
    expect((await post({ ...input, startHour: 12, endHour: 13 })).status).toBe(201);
    expect((await post({ ...input, room: 'cosmos' })).status).toBe(201);
    expect((await post({ ...input, date: '2031-04-07' })).status).toBe(201);
  });

  it('applies the rules to the merged booking on PATCH', async () => {
    const first = (await (await post(input)).json()) as Booking;
    const second = (await (
      await post({ ...input, startHour: 16, endHour: 18, title: 'Bench Second' })
    ).json()) as Booking;

    const renamed = await app.request(
      `/api/bookings/${first.id}`,
      send('PATCH', { title: 'Bench Renamed' }),
    );
    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toMatchObject({ ...input, id: first.id, title: 'Bench Renamed' });

    const backwards = await app.request(`/api/bookings/${first.id}`, send('PATCH', { endHour: 13 }));
    expect(backwards.status).toBe(400);

    const clash = await app.request(`/api/bookings/${second.id}`, send('PATCH', { startHour: 14 }));
    expect(clash.status).toBe(409);

    const stored = (await (await app.request(`/api/bookings/${second.id}`)).json()) as Booking;
    expect(stored.startHour).toBe(16);

    const moved = await app.request(
      `/api/bookings/${second.id}`,
      send('PATCH', { startHour: 15, endHour: 17 }),
    );
    expect(moved.status).toBe(200);

    expect(
      (await app.request('/api/bookings/no-such-id', send('PATCH', { title: 'x' }))).status,
    ).toBe(404);
  });
});
