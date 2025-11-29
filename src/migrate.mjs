#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies SQL schema from migrations folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, testConnection } from './db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('OSIA UIN Generator - Database Migration');
  console.log('========================================\n');

  // Test connection
  console.log('Testing database connection...');
  const connected = await testConnection();

  if (!connected) {
    console.error('✗ Database connection failed. Please check configuration.');
    process.exit(1);
  }

  console.log('✓ Database connection successful\n');

  const db = getDb();

  // Read migration file
  const migrationPath = path.join(__dirname, '../migrations/001_init_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`✗ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`Reading migration: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log('Applying migration...\n');

    // Execute the SQL
    await db.raw(sql);

    console.log('✓ Migration applied successfully!\n');

    // Verify tables were created
    const tables = await db.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('uin_pool', 'uin_audit')
      ORDER BY table_name;
    `);

    console.log('Created tables:');
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Verify enum type
    const types = await db.raw(`
      SELECT typname
      FROM pg_type
      WHERE typname = 'uin_status';
    `);

    if (types.rows.length > 0) {
      console.log(`  ✓ uin_status (enum type)`);
    }

    console.log('\nMigration complete!');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠ Schema already exists. Skipping migration.');
    } else {
      console.error('✗ Migration failed:', error.message);
      process.exit(1);
    }
  } finally {
    await db.destroy();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Migration error:', error);
  process.exit(1);
});
