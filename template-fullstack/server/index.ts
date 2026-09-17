import { serve } from '@hono/node-server';

import { createApp } from '@server/app';
import { createDb } from '@server/db/client';
import { seed } from '@server/db/seed';

const db = createDb();
seed(db);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: createApp(db).fetch, port }, () => {
  console.log(`API on http://localhost:${String(port)}/api`);
});
