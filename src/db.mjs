/**
 * Database connection and Knex configuration
 * Uses PostgreSQL with connection pooling
 */

import knex from 'knex';
import { getConfig } from './config.mjs';
import fs from 'fs';

/**
 * Build a pg SSL option from environment. DigitalOcean Managed PG requires
 * TLS (sslmode=require). When NODE_EXTRA_CA_CERTS points at the DO CA we
 * verify the chain; otherwise we still encrypt but skip CA verification.
 */
function buildSsl() {
  const mode = (process.env.PGSSLMODE || '').toLowerCase();
  if (!mode || mode === 'disable') return undefined;
  const caPath = process.env.NODE_EXTRA_CA_CERTS;
  if (caPath) {
    try {
      const ca = fs.readFileSync(caPath, 'utf8');
      return { ca, rejectUnauthorized: true };
    } catch (e) {
      console.warn('[DB] Could not read CA at', caPath, '-', e.message);
    }
  }
  // Encrypt without CA verification (sslmode=require semantics)
  return { rejectUnauthorized: false };
}


let dbInstance = null;

/**
 * Get or create Knex database instance
 * @returns {import('knex').Knex} Knex instance
 */
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const config = getConfig();

  dbInstance = knex({
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      ssl: buildSsl(),
    },
    searchPath: ['public'],
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    acquireConnectionTimeout: 10000,
  });

  return dbInstance;
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
  }
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export async function testConnection() {
  try {
    const db = getDb();
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

export const db = getDb();
export default db;
