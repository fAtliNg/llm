import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ROOMS, type Booking } from '@shared/bookings';
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '@shared/tasks';
import type { Assert, Equal } from '@shared/type-assert';

/** One table per entity. After changing this file run `npm run db:generate` to create the migration. */
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status', { enum: TASK_STATUSES }).notNull().default('todo'),
  priority: text('priority', { enum: TASK_PRIORITIES }).notNull().default('medium'),
});

/** Compile-time guard: a row must be exactly what the contract promises. Drift fails `npm run typecheck`. */
export type TaskRow = typeof tasks.$inferSelect;
export type TaskRowMatchesContract = Assert<Equal<TaskRow, Task>>;

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  room: text('room', { enum: ROOMS }).notNull(),
  date: text('date').notNull(),
  startHour: integer('start_hour').notNull(),
  endHour: integer('end_hour').notNull(),
  cancelledAt: text('cancelled_at'),
});

export type BookingRow = typeof bookings.$inferSelect;
export type BookingRowMatchesContract = Assert<Equal<BookingRow, Booking>>;
