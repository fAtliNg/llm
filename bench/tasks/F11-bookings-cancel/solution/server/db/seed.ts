import { createDb, type Db } from '@server/db/client';
import { bookings, tasks } from '@server/db/schema';
import type { Booking } from '@shared/bookings';
import type { Task } from '@shared/tasks';

export const TASK_SEED: Task[] = [
  { id: '1', title: 'Set up the project', description: '', status: 'done', priority: 'high' },
  {
    id: '2',
    title: 'Write the task form',
    description: 'Validation with zod, fields from shadcn',
    status: 'in_progress',
    priority: 'medium',
  },
  { id: '3', title: 'Add tests', description: '', status: 'todo', priority: 'low' },
];

export const BOOKING_SEED: Booking[] = [
  {
    id: '1',
    title: 'Sprint planning',
    room: 'atlas',
    date: '2026-10-05',
    startHour: 10,
    endHour: 12,
    cancelledAt: null,
  },
  {
    id: '2',
    title: 'Design review',
    room: 'cosmos',
    date: '2026-10-06',
    startHour: 14,
    endHour: 15,
    cancelledAt: null,
  },
];

/** Fills empty tables with demo data. Safe to run repeatedly. */
export function seed(db: Db): void {
  const existing = db.select().from(tasks).limit(1).all();
  if (existing.length === 0) db.insert(tasks).values(TASK_SEED).run();

  const existingBookings = db.select().from(bookings).limit(1).all();
  if (existingBookings.length === 0) db.insert(bookings).values(BOOKING_SEED).run();
}

if (import.meta.filename === process.argv[1]) {
  seed(createDb());
  console.log('Seeded.');
}
