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

const input = { title: 'Bench Rho-127', room: 'cosmos', date: '2032-02-02', startHour: 10, endHour: 12 };
const post = (body: unknown) => app.request('/api/bookings', send('POST', body));

describe('F06 overlap only within one date', () => {
  it('allows the same room and hours on other dates', async () => {
    expect((await post(input)).status).toBe(201);
    expect((await post({ ...input, date: '2032-02-03' })).status).toBe(201);
    expect((await post({ ...input, date: '2032-02-01', startHour: 11, endHour: 13 })).status).toBe(
      201,
    );
  });

  it('still rejects a real conflict', async () => {
    expect((await post(input)).status).toBe(201);
    const clash = await post({ ...input, startHour: 11, endHour: 13 });
    expect(clash.status).toBe(409);
    expect(await clash.json()).toEqual({ message: 'This room is already booked for that time' });
  });

  it('moving a booking to a free date with PATCH works, to a taken one does not', async () => {
    const first = (await (await post(input)).json()) as { id: string };
    expect((await post({ ...input, date: '2032-02-05' })).status).toBe(201);

    const free = await app.request(`/api/bookings/${first.id}`, send('PATCH', { date: '2032-02-04' }));
    expect(free.status).toBe(200);
    const taken = await app.request(`/api/bookings/${first.id}`, send('PATCH', { date: '2032-02-05' }));
    expect(taken.status).toBe(409);
  });
});
