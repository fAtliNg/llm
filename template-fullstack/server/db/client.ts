import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from '@server/db/schema';

const MIGRATIONS = path.resolve(import.meta.dirname, '../../drizzle');

export type Db = ReturnType<typeof createDb>;

/**
 * Opens a database and applies pending migrations.
 * `:memory:` gives every test file its own empty database in milliseconds.
 */
export function createDb(file: string = process.env.DATABASE_FILE ?? 'data/app.db') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS });
  return db;
}
