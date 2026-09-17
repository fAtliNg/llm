import { createDb, type Db } from '@server/db/client';
import { employees, tasks } from '@server/db/schema';
import type { Employee } from '@shared/employees';
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

export const EMPLOYEE_SEED: Employee[] = [
  {
    id: '1',
    name: 'Katherine Johnson',
    email: 'katherine@example.com',
    department: 'engineering',
    startDate: '2024-03-01',
    managerId: null,
  },
  {
    id: '2',
    name: 'Dieter Rams',
    email: 'dieter@example.com',
    department: 'design',
    startDate: null,
    managerId: '1',
  },
];

/** Fills empty tables with demo data. Safe to run repeatedly. */
export function seed(db: Db): void {
  const existing = db.select().from(tasks).limit(1).all();
  if (existing.length === 0) db.insert(tasks).values(TASK_SEED).run();

  const existingEmployees = db.select().from(employees).limit(1).all();
  if (existingEmployees.length === 0) db.insert(employees).values(EMPLOYEE_SEED).run();
}

if (import.meta.filename === process.argv[1]) {
  seed(createDb());
  console.log('Seeded.');
}
