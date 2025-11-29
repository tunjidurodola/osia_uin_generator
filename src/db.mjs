/**
 * Database connection and Knex configuration
 * Uses PostgreSQL with connection pooling
 */

import knex from 'knex';
import { getConfig } from './config.mjs';

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
