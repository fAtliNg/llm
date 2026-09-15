import type { Contact, ContactInput } from '@/features/contacts/model';
import type { Task, TaskInput } from '@/features/tasks/model';

/** In-memory database shared by the browser worker (dev) and the node server (tests). */
const seed: Task[] = [
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

let tasks: Task[] = structuredClone(seed);
let nextId = seed.length + 1;

const contactSeed: Contact[] = [
  { id: '1', name: 'Grace Hopper', email: 'grace@example.com' },
  { id: '2', name: 'Linus Torvalds', email: 'linus@example.com' },
];

let contacts: Contact[] = structuredClone(contactSeed);
let nextContactId = contactSeed.length + 1;

export const db = {
  reset(): void {
    tasks = structuredClone(seed);
    nextId = seed.length + 1;
    contacts = structuredClone(contactSeed);
    nextContactId = contactSeed.length + 1;
  },
  listContacts(): Contact[] {
    return contacts;
  },
  createContact(input: ContactInput): Contact {
    const contact: Contact = { id: String(nextContactId++), ...input };
    contacts.push(contact);
    return contact;
  },
  list(): Task[] {
    return tasks;
  },
  find(id: string): Task | undefined {
    return tasks.find((task) => task.id === id);
  },
  create(input: TaskInput): Task {
    const task: Task = { id: String(nextId++), ...input };
    tasks.push(task);
    return task;
  },
  update(id: string, input: Partial<TaskInput>): Task | undefined {
    const index = tasks.findIndex((task) => task.id === id);
    const current = tasks[index];
    if (!current) return undefined;
    const updated: Task = { ...current, ...input };
    tasks[index] = updated;
    return updated;
  },
  remove(id: string): boolean {
    const before = tasks.length;
    tasks = tasks.filter((task) => task.id !== id);
    return tasks.length < before;
  },
};
