import { sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

import { DEPARTMENTS, type Employee } from '@shared/employees';
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

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  department: text('department', { enum: DEPARTMENTS }).notNull(),
  startDate: text('start_date'),
  /** Self-reference. The API clears it for the reports before a manager is deleted. */
  managerId: text('manager_id').references((): AnySQLiteColumn => employees.id),
});

export type EmployeeRow = typeof employees.$inferSelect;
export type EmployeeRowMatchesContract = Assert<Equal<EmployeeRow, Employee>>;
