import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CONTACT_GROUPS, type Contact } from '@shared/contacts';
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

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  group: text('group', { enum: CONTACT_GROUPS }).notNull(),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
});

export type ContactRow = typeof contacts.$inferSelect;
export type ContactRowMatchesContract = Assert<Equal<ContactRow, Contact>>;
