import { createDb, type Db } from '@server/db/client';
import { contacts, tasks } from '@server/db/schema';
import type { Contact } from '@shared/contacts';
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

export const CONTACT_SEED: Contact[] = [
  {
    id: '1',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    phone: '+12025550143',
    group: 'work',
    favorite: false,
  },
  {
    id: '2',
    name: 'Alan Kay',
    email: 'alan.kay@example.com',
    phone: null,
    group: 'friends',
    favorite: false,
  },
  {
    id: '3',
    name: 'Barbara Liskov',
    email: 'barbara@example.com',
    phone: '+16175550199',
    group: 'work',
    favorite: true,
  },
];

/** Fills empty tables with demo data. Safe to run repeatedly. */
export function seed(db: Db): void {
  const existing = db.select().from(tasks).limit(1).all();
  if (existing.length === 0) db.insert(tasks).values(TASK_SEED).run();

  const existingContacts = db.select().from(contacts).limit(1).all();
  if (existingContacts.length === 0) db.insert(contacts).values(CONTACT_SEED).run();
}

if (import.meta.filename === process.argv[1]) {
  seed(createDb());
  console.log('Seeded.');
}
