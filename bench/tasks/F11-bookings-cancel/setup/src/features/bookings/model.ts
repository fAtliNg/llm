import type { Booking, Room } from '@shared/bookings';

/** The data contract lives in `shared/bookings.ts`; this file adds what only the UI needs. */
export * from '@shared/bookings';

export const ROOM_LABELS: Record<Room, string> = {
  atlas: 'Atlas',
  borealis: 'Borealis',
  cosmos: 'Cosmos',
};

/** `9:00–11:00` */
export function formatHours({ startHour, endHour }: Pick<Booking, 'startHour' | 'endHour'>) {
  return `${String(startHour)}:00–${String(endHour)}:00`;
}
