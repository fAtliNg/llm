import { zValidator } from '@hono/zod-validator';
import { and, eq, ne } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { employees } from '@server/db/schema';
import { conflict, invalid, notFound } from '@server/http';
import { employeeInputSchema } from '@shared/employees';

const DUPLICATE_EMAIL = 'An employee with this email already exists';

/** `/api/employees`. */
export function employeesRoutes(db: Db) {
  const app = new Hono();

  /** True when another employee already uses the email. */
  const emailTaken = (email: string, exceptId?: string) => {
    const where = exceptId
      ? and(eq(employees.email, email), ne(employees.id, exceptId))
      : eq(employees.email, email);
    return db.select().from(employees).where(where).all().length > 0;
  };

  app.get('/', (c) => c.json(db.select().from(employees).all()));

  app.get('/:employeeId', (c) => {
    const [employee] = db
      .select()
      .from(employees)
      .where(eq(employees.id, c.req.param('employeeId')))
      .all();
    return employee ? c.json(employee) : notFound(c);
  });

  app.post('/', zValidator('json', employeeInputSchema, invalid('Invalid employee')), (c) => {
    const input = c.req.valid('json');
    if (emailTaken(input.email)) return conflict(c, DUPLICATE_EMAIL);
    const employee = { id: crypto.randomUUID(), ...input };
    db.insert(employees).values(employee).run();
    return c.json(employee, 201);
  });

  app.patch(
    '/:employeeId',
    zValidator('json', employeeInputSchema.partial(), invalid('Invalid employee')),
    (c) => {
      const id = c.req.param('employeeId');
      const patch = c.req.valid('json');
      if (patch.email && emailTaken(patch.email, id)) return conflict(c, DUPLICATE_EMAIL);
      const [employee] = db
        .update(employees)
        .set(patch)
        .where(eq(employees.id, id))
        .returning()
        .all();
      return employee ? c.json(employee) : notFound(c);
    },
  );

  app.delete('/:employeeId', (c) => {
    const [removed] = db
      .delete(employees)
      .where(eq(employees.id, c.req.param('employeeId')))
      .returning()
      .all();
    return removed ? c.body(null, 204) : notFound(c);
  });

  return app;
}
