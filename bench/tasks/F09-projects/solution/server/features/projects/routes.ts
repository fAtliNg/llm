import { zValidator } from '@hono/zod-validator';
import { and, count, eq, getTableColumns, ne } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { projects, tasks } from '@server/db/schema';
import { conflict, invalid, notFound } from '@server/http';
import { projectInputSchema } from '@shared/projects';

const DUPLICATE_NAME = 'A project with this name already exists';

/** `/api/projects`. */
export function projectsRoutes(db: Db) {
  const app = new Hono();

  /** True when another project already uses the name. */
  const nameTaken = (name: string, exceptId?: string) => {
    const where = exceptId
      ? and(eq(projects.name, name), ne(projects.id, exceptId))
      : eq(projects.name, name);
    return db.select().from(projects).where(where).all().length > 0;
  };

  /** Every project with the number of its tasks, counted in SQL. */
  app.get('/', (c) =>
    c.json(
      db
        .select({ ...getTableColumns(projects), taskCount: count(tasks.id) })
        .from(projects)
        .leftJoin(tasks, eq(tasks.projectId, projects.id))
        .groupBy(projects.id)
        .all(),
    ),
  );

  app.get('/:projectId', (c) => {
    const [project] = db
      .select()
      .from(projects)
      .where(eq(projects.id, c.req.param('projectId')))
      .all();
    return project ? c.json(project) : notFound(c);
  });

  app.post('/', zValidator('json', projectInputSchema, invalid('Invalid project')), (c) => {
    const input = c.req.valid('json');
    if (nameTaken(input.name)) return conflict(c, DUPLICATE_NAME);
    const project = { id: crypto.randomUUID(), ...input };
    db.insert(projects).values(project).run();
    return c.json(project, 201);
  });

  app.patch(
    '/:projectId',
    zValidator('json', projectInputSchema.partial(), invalid('Invalid project')),
    (c) => {
      const id = c.req.param('projectId');
      const patch = c.req.valid('json');
      if (patch.name && nameTaken(patch.name, id)) return conflict(c, DUPLICATE_NAME);
      const [project] = db.update(projects).set(patch).where(eq(projects.id, id)).returning().all();
      return project ? c.json(project) : notFound(c);
    },
  );

  app.delete('/:projectId', (c) => {
    const id = c.req.param('projectId');
    const hasTasks =
      db.select().from(tasks).where(eq(tasks.projectId, id)).limit(1).all().length > 0;
    if (hasTasks) return conflict(c, 'Project still has tasks');
    const [removed] = db.delete(projects).where(eq(projects.id, id)).returning().all();
    return removed ? c.body(null, 204) : notFound(c);
  });

  return app;
}
