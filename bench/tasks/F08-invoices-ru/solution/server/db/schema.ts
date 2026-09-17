import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { INVOICE_STATUSES, type Invoice } from '@shared/invoices';
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

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  number: text('number').notNull().unique(),
  customer: text('customer').notNull(),
  amount: real('amount').notNull(),
  status: text('status', { enum: INVOICE_STATUSES }).notNull().default('draft'),
});

export type InvoiceRow = typeof invoices.$inferSelect;
export type InvoiceRowMatchesContract = Assert<Equal<InvoiceRow, Invoice>>;
