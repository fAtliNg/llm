import { zValidator } from '@hono/zod-validator';
import { and, eq, ne } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { invoices } from '@server/db/schema';
import { conflict, invalid, notFound } from '@server/http';
import { invoiceInputSchema, type InvoiceStatus } from '@shared/invoices';

const DUPLICATE_NUMBER = 'An invoice with this number already exists';
const WRONG_STATE = 'Invoice is not in the right state';
const PAID_IS_FINAL = 'A paid invoice cannot be deleted';

/** `/api/invoices`. */
export function invoicesRoutes(db: Db) {
  const app = new Hono();

  const find = (id: string) => db.select().from(invoices).where(eq(invoices.id, id)).all()[0];

  const numberTaken = (number: string, exceptId?: string) => {
    const where = exceptId
      ? and(eq(invoices.number, number), ne(invoices.id, exceptId))
      : eq(invoices.number, number);
    return db.select().from(invoices).where(where).all().length > 0;
  };

  /** The status only moves one step forward: draft, sent, paid. */
  const transition = (from: InvoiceStatus, to: InvoiceStatus) =>
    app.post(`/:invoiceId/${to === 'sent' ? 'send' : 'pay'}`, (c) => {
      const invoice = find(c.req.param('invoiceId'));
      if (!invoice) return notFound(c);
      if (invoice.status !== from) return conflict(c, WRONG_STATE);
      const [updated] = db
        .update(invoices)
        .set({ status: to })
        .where(eq(invoices.id, invoice.id))
        .returning()
        .all();
      return c.json(updated);
    });

  app.get('/', (c) => c.json(db.select().from(invoices).orderBy(invoices.number).all()));

  app.get('/:invoiceId', (c) => {
    const invoice = find(c.req.param('invoiceId'));
    return invoice ? c.json(invoice) : notFound(c);
  });

  app.post('/', zValidator('json', invoiceInputSchema, invalid('Invalid invoice')), (c) => {
    const input = c.req.valid('json');
    if (numberTaken(input.number)) return conflict(c, DUPLICATE_NUMBER);
    const invoice = { id: crypto.randomUUID(), ...input, status: 'draft' as const };
    db.insert(invoices).values(invoice).run();
    return c.json(invoice, 201);
  });

  app.patch(
    '/:invoiceId',
    zValidator('json', invoiceInputSchema.partial(), invalid('Invalid invoice')),
    (c) => {
      const id = c.req.param('invoiceId');
      const patch = c.req.valid('json');
      if (patch.number && numberTaken(patch.number, id)) return conflict(c, DUPLICATE_NUMBER);
      const [invoice] = db.update(invoices).set(patch).where(eq(invoices.id, id)).returning().all();
      return invoice ? c.json(invoice) : notFound(c);
    },
  );

  transition('draft', 'sent');
  transition('sent', 'paid');

  app.delete('/:invoiceId', (c) => {
    const invoice = find(c.req.param('invoiceId'));
    if (!invoice) return notFound(c);
    if (invoice.status === 'paid') return conflict(c, PAID_IS_FINAL);
    db.delete(invoices).where(eq(invoices.id, invoice.id)).run();
    return c.body(null, 204);
  });

  return app;
}
