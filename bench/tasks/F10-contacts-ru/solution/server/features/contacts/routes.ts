import { zValidator } from '@hono/zod-validator';
import { and, asc, desc, eq, like, ne, or } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { contacts } from '@server/db/schema';
import { conflict, invalid, notFound } from '@server/http';
import { contactInputSchema, contactPatchSchema } from '@shared/contacts';

const DUPLICATE_EMAIL = 'A contact with this email already exists';

/** `/api/contacts`. */
export function contactsRoutes(db: Db) {
  const app = new Hono();

  /** True when another contact already uses the email. */
  const emailTaken = (email: string, exceptId?: string) => {
    const where = exceptId
      ? and(eq(contacts.email, email), ne(contacts.id, exceptId))
      : eq(contacts.email, email);
    return db.select().from(contacts).where(where).all().length > 0;
  };

  /** Favourites first, then by name. `?q=` matches the name or the email; SQLite `like` ignores ASCII case. */
  app.get('/', (c) => {
    const q = c.req.query('q')?.trim();
    const pattern = q ? `%${q}%` : undefined;
    return c.json(
      db
        .select()
        .from(contacts)
        .where(
          pattern ? or(like(contacts.name, pattern), like(contacts.email, pattern)) : undefined,
        )
        .orderBy(desc(contacts.favorite), asc(contacts.name))
        .all(),
    );
  });

  app.get('/:contactId', (c) => {
    const [contact] = db
      .select()
      .from(contacts)
      .where(eq(contacts.id, c.req.param('contactId')))
      .all();
    return contact ? c.json(contact) : notFound(c);
  });

  app.post('/', zValidator('json', contactInputSchema, invalid('Invalid contact')), (c) => {
    const input = c.req.valid('json');
    if (emailTaken(input.email)) return conflict(c, DUPLICATE_EMAIL);
    const contact = { id: crypto.randomUUID(), ...input, favorite: false };
    db.insert(contacts).values(contact).run();
    return c.json(contact, 201);
  });

  app.patch(
    '/:contactId',
    zValidator('json', contactPatchSchema, invalid('Invalid contact')),
    (c) => {
      const id = c.req.param('contactId');
      const patch = c.req.valid('json');
      if (patch.email && emailTaken(patch.email, id)) return conflict(c, DUPLICATE_EMAIL);
      const [contact] = db.update(contacts).set(patch).where(eq(contacts.id, id)).returning().all();
      return contact ? c.json(contact) : notFound(c);
    },
  );

  app.delete('/:contactId', (c) => {
    const [removed] = db
      .delete(contacts)
      .where(eq(contacts.id, c.req.param('contactId')))
      .returning()
      .all();
    return removed ? c.body(null, 204) : notFound(c);
  });

  return app;
}
