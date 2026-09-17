import { createDb, type Db } from '@server/db/client';
import { invoices, tasks } from '@server/db/schema';
import type { Invoice } from '@shared/invoices';
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

export const INVOICE_SEED: Invoice[] = [
  { id: '1', number: 'INV-0001', customer: 'Acme Corp', amount: 1250, status: 'sent' },
  { id: '2', number: 'INV-0002', customer: 'Globex', amount: 480.5, status: 'draft' },
];

/** Fills empty tables with demo data. Safe to run repeatedly. */
export function seed(db: Db): void {
  const existing = db.select().from(tasks).limit(1).all();
  if (existing.length === 0) db.insert(tasks).values(TASK_SEED).run();

  const existingInvoices = db.select().from(invoices).limit(1).all();
  if (existingInvoices.length === 0) db.insert(invoices).values(INVOICE_SEED).run();
}

if (import.meta.filename === process.argv[1]) {
  seed(createDb());
  console.log('Seeded.');
}
