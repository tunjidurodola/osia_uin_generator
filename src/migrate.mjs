#!/usr/bin/env node

/**
 * Database migration runner.
 *
 * Applies every migrations/NNN_*.sql file in order, each in its own
 * transaction, and records it in schema_migrations. Databases created before
 * migrations were tracked are baselined: if uin_pool already exists, 001 is
 * recorded as applied without being re-run (002-005 are idempotent).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, testConnection, closeDb } from './db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

export async function runMigrations({ log = console.log } = {}) {
  const db = getDb();

  await db.raw(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set((await db('schema_migrations').select('name')).map((r) => r.name));
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();

  if (applied.size === 0 && files[0] && (await db.schema.hasTable('uin_pool'))) {
    await db('schema_migrations').insert({ name: files[0] });
    applied.add(files[0]);
    log(`= ${files[0]} (baselined: schema already present)`);
  }

  const ran = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await db.transaction(async (trx) => {
      await trx.raw(sql);
      await trx('schema_migrations').insert({ name: file });
    });
    ran.push(file);
    log(`+ ${file}`);
  }
  if (ran.length === 0) log('Schema is up to date');
  return ran;
}

async function main() {
  console.log('OSIA UIN Generator - Database Migration\n');
  if (!(await testConnection())) {
    console.error('Database connection failed. Check DB_* configuration.');
    process.exit(1);
  }
  try {
    await runMigrations();
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
