#!/usr/bin/env node

/**
 * Database Integration Test Script
 * Tests UIN pool operations and lifecycle management
 */

import { getDb, testConnection } from './db.mjs';
import {
  preGenerateUins,
  claimUin,
  assignUin,
  releaseUin,
  updateUinStatus,
  releaseStalePreassigned,
  getUin,
  getUinAudit,
  getPoolStats
} from './poolService.mjs';

const TEST_SCOPE = 'test_scope';
const TEST_CLIENT_ID = 'test_client';

/**
 * Test database connection
 */
async function testDbConnection() {
  console.log('Test 1: Database Connection');
  console.log('============================\n');

  const connected = await testConnection();

  if (!connected) {
    console.error('✗ Database connection failed');
    process.exit(1);
  }

  console.log('✓ Database connection successful\n');
}

/**
 * Test UIN pre-generation
 */
async function testPreGeneration() {
  console.log('Test 2: UIN Pre-Generation');
  console.log('============================\n');

  try {
    console.log('Pre-generating 5 foundational UINs...');
    const result = await preGenerateUins({
      count: 5,
      mode: 'foundational',
      scope: TEST_SCOPE,
      options: {
        length: 16,
        excludeAmbiguous: true
      }
    });

    console.log(`✓ Generated ${result.inserted} UINs`);
    if (result.errors > 0) {
      console.log(`⚠ Encountered ${result.errors} errors`);
      console.log('  Error details:', result.errorDetails);
    }
    console.log('');

    return result.inserted > 0;
  } catch (error) {
    console.error('✗ Pre-generation failed:', error.message);
    return false;
  }
}

/**
 * Test pool statistics
 */
async function testPoolStats() {
  console.log('Test 3: Pool Statistics');
  console.log('============================\n');

  try {
    const stats = await getPoolStats(TEST_SCOPE);
    console.log('Pool Statistics:');
    console.log(`  Total:       ${stats.total}`);
    console.log(`  Available:   ${stats.available}`);
    console.log(`  Preassigned: ${stats.preassigned}`);
    console.log(`  Assigned:    ${stats.assigned}`);
    console.log(`  Retired:     ${stats.retired}`);
    console.log(`  Revoked:     ${stats.revoked}`);
    console.log('');

    if (stats.total === 0) {
      console.error('✗ No UINs in pool. Pre-generation may have failed.');
      return false;
    }

    console.log('✓ Pool statistics retrieved successfully\n');
    return true;
  } catch (error) {
    console.error('✗ Failed to get pool stats:', error.message);
    return false;
  }
}

/**
 * Test UIN claiming (AVAILABLE → PREASSIGNED)
 */
async function testClaimUin() {
  console.log('Test 4: Claim UIN (AVAILABLE → PREASSIGNED)');
  console.log('=============================================\n');

  try {
    console.log(`Claiming UIN from scope: ${TEST_SCOPE}...`);
    const claimed = await claimUin({
      scope: TEST_SCOPE,
      clientId: TEST_CLIENT_ID
    });

    if (!claimed) {
      console.error('✗ No available UINs to claim');
      return null;
    }

    console.log(`✓ Claimed UIN: ${claimed.uin}`);
    console.log(`  Status:     ${claimed.status}`);
    console.log(`  Claimed by: ${claimed.claimed_by}`);
    console.log(`  Claimed at: ${claimed.claimed_at}`);
    console.log('');

    return claimed;
  } catch (error) {
    console.error('✗ Claim failed:', error.message);
    return null;
  }
}

/**
 * Test UIN assignment (PREASSIGNED → ASSIGNED)
 */
async function testAssignUin(uin) {
  console.log('Test 5: Assign UIN (PREASSIGNED → ASSIGNED)');
  console.log('============================================\n');

  if (!uin) {
    console.error('✗ No UIN provided for assignment test');
    return false;
  }

  try {
    const assignedToRef = 'PERSON-123456';
    console.log(`Assigning UIN ${uin.uin} to ${assignedToRef}...`);

    const assigned = await assignUin({
      uin: uin.uin,
      assignedToRef: assignedToRef,
      actorSystem: 'TEST_SYSTEM',
      actorRef: 'TEST-TXN-001'
    });

    console.log(`✓ Assigned UIN: ${assigned.uin}`);
    console.log(`  Status:          ${assigned.status}`);
    console.log(`  Assigned to:     ${assigned.assigned_to_ref}`);
    console.log(`  Assigned at:     ${assigned.assigned_at}`);
    console.log('');

    return assigned;
  } catch (error) {
    console.error('✗ Assignment failed:', error.message);
    return null;
  }
}

/**
 * Test UIN release (PREASSIGNED → AVAILABLE)
 */
async function testReleaseUin() {
  console.log('Test 6: Release UIN (PREASSIGNED → AVAILABLE)');
  console.log('==============================================\n');

  try {
    // First claim a UIN
    console.log('Claiming a UIN to test release...');
    const claimed = await claimUin({
      scope: TEST_SCOPE,
      clientId: 'test_client_2'
    });

    if (!claimed) {
      console.error('✗ No available UINs to claim for release test');
      return false;
    }

    console.log(`✓ Claimed UIN: ${claimed.uin}`);

    // Now release it
    console.log(`Releasing UIN ${claimed.uin}...`);
    const released = await releaseUin({
      uin: claimed.uin,
      actorSystem: 'TEST_SYSTEM',
      actorRef: 'TEST-RELEASE-001'
    });

    console.log(`✓ Released UIN: ${released.uin}`);
    console.log(`  Status: ${released.status}`);
    console.log(`  Claimed by: ${released.claimed_by || '(null)'}`);
    console.log('');

    return true;
  } catch (error) {
    console.error('✗ Release failed:', error.message);
    return false;
  }
}

/**
 * Test status updates (RETIRED, REVOKED)
 */
async function testStatusUpdate(uin) {
  console.log('Test 7: Update UIN Status (ASSIGNED → RETIRED)');
  console.log('===============================================\n');

  if (!uin) {
    console.error('✗ No UIN provided for status update test');
    return false;
  }

  try {
    console.log(`Retiring UIN ${uin.uin}...`);
    const retired = await updateUinStatus({
      uin: uin.uin,
      newStatus: 'RETIRED',
      reason: 'Person deceased',
      actorSystem: 'TEST_SYSTEM',
      actorRef: 'TEST-RETIRE-001'
    });

    console.log(`✓ Updated UIN: ${retired.uin}`);
    console.log(`  Status: ${retired.status}`);
    console.log('');

    return true;
  } catch (error) {
    console.error('✗ Status update failed:', error.message);
    return false;
  }
}

/**
 * Test audit log retrieval
 */
async function testAuditLog(uin) {
  console.log('Test 8: Audit Log Retrieval');
  console.log('============================\n');

  if (!uin) {
    console.error('✗ No UIN provided for audit test');
    return false;
  }

  try {
    console.log(`Retrieving audit log for UIN ${uin.uin}...`);
    const audit = await getUinAudit(uin.uin);

    console.log(`✓ Found ${audit.length} audit entries:\n`);

    audit.forEach((entry, index) => {
      console.log(`  Entry ${index + 1}:`);
      console.log(`    Event Type:   ${entry.event_type}`);
      console.log(`    Old Status:   ${entry.old_status || '(null)'}`);
      console.log(`    New Status:   ${entry.new_status || '(null)'}`);
      console.log(`    Actor System: ${entry.actor_system}`);
      console.log(`    Created At:   ${entry.created_at}`);
      console.log('');
    });

    return audit.length > 0;
  } catch (error) {
    console.error('✗ Audit retrieval failed:', error.message);
    return false;
  }
}

/**
 * Test UIN lookup
 */
async function testLookup(uin) {
  console.log('Test 9: UIN Lookup');
  console.log('===================\n');

  if (!uin) {
    console.error('✗ No UIN provided for lookup test');
    return false;
  }

  try {
    console.log(`Looking up UIN ${uin.uin}...`);
    const found = await getUin(uin.uin);

    if (!found) {
      console.error('✗ UIN not found');
      return false;
    }

    console.log(`✓ Found UIN: ${found.uin}`);
    console.log(`  Mode:            ${found.mode}`);
    console.log(`  Scope:           ${found.scope}`);
    console.log(`  Status:          ${found.status}`);
    console.log(`  Hash (RMD160):   ${found.hash_rmd160}`);
    console.log(`  Issued At:       ${found.iat}`);
    console.log(`  Assigned To:     ${found.assigned_to_ref || '(null)'}`);
    console.log('');

    return true;
  } catch (error) {
    console.error('✗ Lookup failed:', error.message);
    return false;
  }
}

/**
 * Test stale preassignment cleanup
 */
async function testStaleCleanup() {
  console.log('Test 10: Stale Preassignment Cleanup');
  console.log('=====================================\n');

  try {
    // This will find preassigned UINs older than 0 minutes (all of them)
    // In real usage, you'd use a realistic threshold like 30 or 60 minutes
    console.log('Cleaning up stale preassignments (threshold: 0 minutes for testing)...');
    const result = await releaseStalePreassigned({
      olderThanMinutes: 0
    });

    console.log(`✓ Cleanup complete:`);
    console.log(`  Processed: ${result.processed}`);
    console.log(`  Released:  ${result.released}`);
    console.log('');

    return true;
  } catch (error) {
    console.error('✗ Cleanup failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  OSIA UIN Generator - Database Test Suite     ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  let db;
  const results = [];

  try {
    // Test 1: Connection
    await testDbConnection();
    results.push({ test: 'Connection', passed: true });

    // Test 2: Pre-generation
    const preGenOk = await testPreGeneration();
    results.push({ test: 'Pre-generation', passed: preGenOk });

    if (!preGenOk) {
      throw new Error('Pre-generation failed. Cannot continue tests.');
    }

    // Test 3: Pool stats
    const statsOk = await testPoolStats();
    results.push({ test: 'Pool Statistics', passed: statsOk });

    // Test 4: Claim UIN
    const claimedUin = await testClaimUin();
    results.push({ test: 'Claim UIN', passed: !!claimedUin });

    // Test 5: Assign UIN
    const assignedUin = await testAssignUin(claimedUin);
    results.push({ test: 'Assign UIN', passed: !!assignedUin });

    // Test 6: Release UIN
    const releaseOk = await testReleaseUin();
    results.push({ test: 'Release UIN', passed: releaseOk });

    // Test 7: Status update
    const statusOk = await testStatusUpdate(assignedUin);
    results.push({ test: 'Status Update', passed: statusOk });

    // Test 8: Audit log
    const auditOk = await testAuditLog(assignedUin);
    results.push({ test: 'Audit Log', passed: auditOk });

    // Test 9: Lookup
    const lookupOk = await testLookup(assignedUin);
    results.push({ test: 'UIN Lookup', passed: lookupOk });

    // Test 10: Cleanup
    const cleanupOk = await testStaleCleanup();
    results.push({ test: 'Stale Cleanup', passed: cleanupOk });

    // Final stats
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              Test Results Summary              ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    results.forEach((result, index) => {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} Test ${index + 1}: ${result.test}`);
    });

    console.log('\n' + '─'.repeat(50));
    console.log(`Total:  ${results.length} tests`);
    console.log(`Passed: ${passed} tests`);
    console.log(`Failed: ${failed} tests`);
    console.log('─'.repeat(50) + '\n');

    if (failed === 0) {
      console.log('✓ All tests passed!\n');
      process.exit(0);
    } else {
      console.log('✗ Some tests failed. Please review the output above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Test suite failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Clean up database connection
    db = getDb();
    if (db) {
      await db.destroy();
    }
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
