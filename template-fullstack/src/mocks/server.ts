import { http, passthrough } from 'msw';
import { setupServer } from 'msw/node';

import { createApp } from '@server/app';
import { createTestDb } from '@server/test-db';

/**
 * Web tests talk to the real API, in process: MSW catches every `/api` request and hands it to
 * the Hono app backed by an in-memory database. There is no separate mock implementation to keep
 * in sync. Override a route in a test with `server.use(http.get('/api/...', ...))` to simulate
 * failures.
 */
let app = createApp(createTestDb());

/** Fresh database with the demo rows; called after every test. */
export function resetBackend(): void {
  app = createApp(createTestDb());
}

export const server = setupServer(
  http.all('*/api/*', ({ request }) => app.fetch(request)),
  http.all('*', () => passthrough()),
);
