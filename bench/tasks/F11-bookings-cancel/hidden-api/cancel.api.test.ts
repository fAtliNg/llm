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
  startHour: number;
  cancelledAt: string | null;
}

const input = { title: 'Bench Rho-127', room: 'cosmos', date: '2032-03-04', startHour: 10, endHour: 12 };
const post = (body: unknown) => app.request('/api/bookings', send('POST', body));
const cancel = (id: string) => app.request(`/api/bookings/${id}/cancel`, { method: 'POST' });

describe('F11 cancelling bookings', () => {
  it('new and seeded bookings are active, and clients cannot set cancelledAt', async () => {
    const list = (await (await app.request('/api/bookings')).json()) as Booking[];
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.every((booking) => booking.cancelledAt === null)).toBe(true);

    const created = await post({ ...input, cancelledAt: '2030-01-01T00:00:00.000Z' });
    expect(created.status).toBe(201);
    const booking = (await created.json()) as Booking;
    expect(booking.cancelledAt).toBeNull();

    await app.request(`/api/bookings/${booking.id}`, send('PATCH', { cancelledAt: '2030-01-01T00:00:00.000Z' }));
    const stored = (await (await app.request(`/api/bookings/${booking.id}`)).json()) as Booking;
    expect(stored.cancelledAt).toBeNull();
  });

  it('cancels once with a timestamp, 409 the second time, 404 for unknown ids', async () => {
    const booking = (await (await post(input)).json()) as Booking;
    const before = Date.now();

    const cancelled = await cancel(booking.id);
    expect(cancelled.status).toBe(200);
    const body = (await cancelled.json()) as Booking;
    expect(body.id).toBe(booking.id);
    expect(Math.abs(new Date(body.cancelledAt ?? '').getTime() - before)).toBeLessThan(60_000);

    const again = await cancel(booking.id);
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({ message: 'Booking is already cancelled' });
    expect((await cancel('no-such-id')).status).toBe(404);

    const list = (await (await app.request('/api/bookings')).json()) as Booking[];
    expect(list.find((item) => item.id === booking.id)?.cancelledAt).toBe(body.cancelledAt);
  });

  it('a cancelled booking frees the room for create and for PATCH', async () => {
    const first = (await (await post(input)).json()) as Booking;
    expect((await post({ ...input, title: 'Clash' })).status).toBe(409);

    await cancel(first.id);
    const second = await post({ ...input, title: 'Bench Takes the slot' });
    expect(second.status).toBe(201);

    const third = (await (await post({ ...input, title: 'Bench Later', startHour: 14, endHour: 16 })).json()) as Booking;
    const clash = await app.request(`/api/bookings/${third.id}`, send('PATCH', { startHour: 11, endHour: 13 }));
    expect(clash.status).toBe(409);

    await cancel(((await second.json()) as Booking).id);
    const moved = await app.request(`/api/bookings/${third.id}`, send('PATCH', { startHour: 11, endHour: 13 }));
    expect(moved.status).toBe(200);
  });
});
