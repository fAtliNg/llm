import { createDb } from '@server/db/client';
import { seed } from '@server/db/seed';

/** A fresh in-memory database with the demo rows. Tests create one per test, not per file. */
export function createTestDb() {
  const db = createDb(':memory:');
  seed(db);
  return db;
}
