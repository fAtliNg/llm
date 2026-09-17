import { createDb, type Db } from '@server/db/client';
import { tasks } from '@server/db/schema';
import type { Task } from '@shared/tasks';

export const TASK_SEED: Task[] = [
  {
    id: '1',
    title: 'Set up the project',
    description: '',
    status: 'done',
    priority: 'high',
    dueDate: null,
  },
  {
    id: '2',
    title: 'Write the task form',
    description: 'Validation with zod, fields from shadcn',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-10-01',
  },
  { id: '3', title: 'Add tests', description: '', status: 'todo', priority: 'low', dueDate: null },
];

/** Fills empty tables with demo data. Safe to run repeatedly. */
export function seed(db: Db): void {
  const existing = db.select().from(tasks).limit(1).all();
  if (existing.length === 0) db.insert(tasks).values(TASK_SEED).run();
}

if (import.meta.filename === process.argv[1]) {
  seed(createDb());
  console.log('Seeded.');
}
