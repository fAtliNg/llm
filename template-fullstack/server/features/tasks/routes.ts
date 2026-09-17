import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { tasks } from '@server/db/schema';
import { invalid, notFound } from '@server/http';
import { taskInputSchema } from '@shared/tasks';

/** `/api/tasks`. Every feature exports a function that takes the database and returns its router. */
export function tasksRoutes(db: Db) {
  const app = new Hono();

  app.get('/', (c) => c.json(db.select().from(tasks).all()));

  app.get('/:taskId', (c) => {
    const [task] = db
      .select()
      .from(tasks)
      .where(eq(tasks.id, c.req.param('taskId')))
      .all();
    return task ? c.json(task) : notFound(c);
  });

  app.post('/', zValidator('json', taskInputSchema, invalid('Invalid task')), (c) => {
    const task = { id: crypto.randomUUID(), ...c.req.valid('json') };
    db.insert(tasks).values(task).run();
    return c.json(task, 201);
  });

  app.patch(
    '/:taskId',
    zValidator('json', taskInputSchema.partial(), invalid('Invalid task')),
    (c) => {
      const id = c.req.param('taskId');
      const [task] = db
        .update(tasks)
        .set(c.req.valid('json'))
        .where(eq(tasks.id, id))
        .returning()
        .all();
      return task ? c.json(task) : notFound(c);
    },
  );

  app.delete('/:taskId', (c) => {
    const [removed] = db
      .delete(tasks)
      .where(eq(tasks.id, c.req.param('taskId')))
      .returning()
      .all();
    return removed ? c.body(null, 204) : notFound(c);
  });

  return app;
}
