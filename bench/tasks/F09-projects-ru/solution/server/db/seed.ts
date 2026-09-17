import { createDb, type Db } from '@server/db/client';
import { projects, tasks } from '@server/db/schema';
import type { Project } from '@shared/projects';
import type { Task } from '@shared/tasks';

export const TASK_SEED: Task[] = [
  {
    id: '1',
    title: 'Set up the project',
    description: '',
    status: 'done',
    priority: 'high',
    projectId: '1',
  },
  {
    id: '2',
    title: 'Write the task form',
    description: 'Validation with zod, fields from shadcn',
    status: 'in_progress',
    priority: 'medium',
    projectId: '1',
  },
  {
    id: '3',
    title: 'Add tests',
    description: '',
    status: 'todo',
    priority: 'low',
    projectId: null,
  },
];

export const PROJECT_SEED: Project[] = [
  {
    id: '1',
    name: 'Website',
    description: 'Public site and docs',
  },
  {
    id: '2',
    name: 'Mobile app',
    description: '',
  },
];

/** Fills empty tables with demo data. Safe to run repeatedly. */
export function seed(db: Db): void {
  // Projects first: tasks reference them.
  const existingProjects = db.select().from(projects).limit(1).all();
  if (existingProjects.length === 0) db.insert(projects).values(PROJECT_SEED).run();

  const existing = db.select().from(tasks).limit(1).all();
  if (existing.length === 0) db.insert(tasks).values(TASK_SEED).run();
}

if (import.meta.filename === process.argv[1]) {
  seed(createDb());
  console.log('Seeded.');
}
