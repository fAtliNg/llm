import { zValidator } from '@hono/zod-validator';
import { and, eq, gt, lt, ne } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { bookings } from '@server/db/schema';
import { conflict, invalid, notFound } from '@server/http';
import { bookingFieldsSchema, bookingInputSchema, type BookingInput } from '@shared/bookings';

const OVERLAP = 'This room is already booked for that time';

/** `/api/bookings`. */
export function bookingsRoutes(db: Db) {
  const app = new Hono();

  /** True when another booking of the same room and date intersects the hours. Back-to-back is fine. */
  const overlaps = (booking: BookingInput, exceptId?: string) =>
    db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.room, booking.room),
          eq(bookings.date, booking.date),
          lt(bookings.startHour, booking.endHour),
          gt(bookings.endHour, booking.startHour),
          exceptId ? ne(bookings.id, exceptId) : undefined,
        ),
      )
      .all().length > 0;

  app.get('/', (c) =>
    c.json(db.select().from(bookings).orderBy(bookings.date, bookings.startHour).all()),
  );

  app.get('/:bookingId', (c) => {
    const [booking] = db
      .select()
      .from(bookings)
      .where(eq(bookings.id, c.req.param('bookingId')))
      .all();
    return booking ? c.json(booking) : notFound(c);
  });

  app.post('/', zValidator('json', bookingInputSchema, invalid('Invalid booking')), (c) => {
    const input = c.req.valid('json');
    if (overlaps(input)) return conflict(c, OVERLAP);
    const booking = { id: crypto.randomUUID(), ...input };
    db.insert(bookings).values(booking).run();
    return c.json(booking, 201);
  });

  app.patch(
    '/:bookingId',
    zValidator('json', bookingFieldsSchema.partial(), invalid('Invalid booking')),
    (c) => {
      const id = c.req.param('bookingId');
      const [current] = db.select().from(bookings).where(eq(bookings.id, id)).all();
      if (!current) return notFound(c);

      // The rules apply to the booking as it will be stored, not to the patch alone.
      const merged = bookingInputSchema.safeParse({ ...current, ...c.req.valid('json') });
      if (!merged.success) {
        return c.json({ message: 'Invalid booking', issues: merged.error.issues }, 400);
      }
      if (overlaps(merged.data, id)) return conflict(c, OVERLAP);

      const [booking] = db
        .update(bookings)
        .set(merged.data)
        .where(eq(bookings.id, id))
        .returning()
        .all();
      return booking ? c.json(booking) : notFound(c);
    },
  );

  app.delete('/:bookingId', (c) => {
    const [removed] = db
      .delete(bookings)
      .where(eq(bookings.id, c.req.param('bookingId')))
      .returning()
      .all();
    return removed ? c.body(null, 204) : notFound(c);
  });

  return app;
}
