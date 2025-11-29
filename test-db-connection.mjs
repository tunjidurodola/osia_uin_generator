#!/usr/bin/env node

/**
 * Quick database connection test
 */

import { getDb, testConnection } from './src/db.mjs';

async function test() {
  try {
    console.log('Testing database connection...\n');

    const connected = await testConnection();

    if (!connected) {
      console.error('✗ Database connection FAILED');
      process.exit(1);
    }

    console.log('✓ Database connection SUCCESS\n');

    const db = getDb();
    const result = await db.raw('SELECT current_database(), current_user, version()');

    console.log('Database Info:');
    console.log('  Database:', result.rows[0].current_database);
    console.log('  User:', result.rows[0].current_user);
    console.log('  Version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    console.log('');

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

test();
