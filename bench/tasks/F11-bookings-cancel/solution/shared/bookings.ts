import { z } from 'zod';

/** Contract for room bookings, shared by the API and the web app. */
export const ROOMS = ['atlas', 'borealis', 'cosmos'] as const;

export const roomSchema = z.enum(ROOMS);

export type Room = z.infer<typeof roomSchema>;

export const FIRST_HOUR = 8;
export const LAST_HOUR = 20;

const hour = z
  .number('Enter an hour')
  .int('Enter a whole hour')
  .min(FIRST_HOUR, `Hours go from ${String(FIRST_HOUR)} to ${String(LAST_HOUR)}`)
  .max(LAST_HOUR, `Hours go from ${String(FIRST_HOUR)} to ${String(LAST_HOUR)}`);

/** The plain fields. Kept separate because refined schemas cannot be extended or made partial. */
export const bookingFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Keep the title under 100 characters'),
  room: roomSchema,
  /** ISO date `YYYY-MM-DD`. */
  date: z.iso.date('Enter a valid date'),
  startHour: hour,
  endHour: hour,
});

/** What the user fills in. Shared by the form and the API payloads. */
export const bookingInputSchema = bookingFieldsSchema.refine(
  (booking) => booking.endHour > booking.startHour,
  { path: ['endHour'], message: 'End must be after start' },
);

export type BookingInput = z.infer<typeof bookingInputSchema>;

/** What the API returns. */
export const bookingSchema = bookingFieldsSchema.extend({
  id: z.string(),
  /** Set by the API when the booking is cancelled. A cancelled booking no longer occupies the room. */
  cancelledAt: z.iso.datetime().nullable(),
});

export type Booking = z.infer<typeof bookingSchema>;
