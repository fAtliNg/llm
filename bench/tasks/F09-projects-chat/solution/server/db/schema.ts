import { sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

import { type Project } from '@shared/projects';
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '@shared/tasks';
import type { Assert, Equal } from '@shared/type-assert';

/** One table per entity. After changing this file run `npm run db:generate` to create the migration. */
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status', { enum: TASK_STATUSES }).notNull().default('todo'),
  priority: text('priority', { enum: TASK_PRIORITIES }).notNull().default('medium'),
  projectId: text('project_id').references((): AnySQLiteColumn => projects.id),
});

/** Compile-time guard: a row must be exactly what the contract promises. Drift fails `npm run typecheck`. */
export type TaskRow = typeof tasks.$inferSelect;
export type TaskRowMatchesContract = Assert<Equal<TaskRow, Task>>;

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type ProjectRowMatchesContract = Assert<Equal<ProjectRow, Project>>;
