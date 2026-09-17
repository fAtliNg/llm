import { Hono } from 'hono';

import type { Db } from '@server/db/client';
import { employeesRoutes } from '@server/features/employees/routes';
import { tasksRoutes } from '@server/features/tasks/routes';

/**
 * Builds the API around a database. The dev server passes the file database, tests pass an
 * in-memory one, and the web tests reach the same app through MSW (`src/mocks/server.ts`).
 *
 * Register every feature router here.
 */
export function createApp(db: Db) {
  const app = new Hono().basePath('/api');

  app.route('/tasks', tasksRoutes(db));
  app.route('/employees', employeesRoutes(db));

  app.notFound((c) => c.json({ message: 'Not found' }, 404));
  app.onError((error, c) => {
    console.error(error);
    return c.json({ message: 'Internal server error' }, 500);
  });

  return app;
}
