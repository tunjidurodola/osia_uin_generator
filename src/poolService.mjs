/**
 * Pool Service - Database operations for UIN lifecycle management
 * Handles CRUD operations on uin_pool and uin_audit tables
 */

import { getDb } from './db.mjs';
import { generateUin } from './uinGenerator.mjs';

/**
 * Insert audit log entry
 * @param {object} params - Audit parameters
 * @returns {Promise<object>} Inserted audit record
 */
async function insertAudit({ uin, eventType, oldStatus, newStatus, actorSystem, actorRef, details }) {
  const db = getDb();

  const [audit] = await db('uin_audit')
    .insert({
      uin,
      event_type: eventType,
      old_status: oldStatus || null,
      new_status: newStatus || null,
      actor_system: actorSystem || 'SYSTEM',
      actor_ref: actorRef || null,
      details: details || {}
    })
    .returning('*');

  return audit;
}

/**
 * Pre-generate a batch of UINs into uin_pool
 * @param {object} params - Generation parameters
 * @param {number} params.count - Number of UINs to generate
 * @param {string} params.mode - Generation mode
 * @param {string} params.scope - Scope/sector
 * @param {object} params.options - UIN generation options
 * @returns {Promise<object>} Summary of generation
 */
export async function preGenerateUins({ count, mode, scope, options = {} }) {
  if (count < 1 || count > 100000) {
    throw new Error('Count must be between 1 and 100,000');
  }

  const db = getDb();
  const generated = [];
  const errors = [];

  console.log(`Pre-generating ${count} UINs (mode: ${mode}, scope: ${scope})...`);

  for (let i = 0; i < count; i++) {
    try {
      // Generate UIN
      const result = generateUin({ mode, ...options });

      // Check if UIN already exists
      const existing = await db('uin_pool')
        .where({ uin: result.value })
        .first();

      if (existing) {
        errors.push({ uin: result.value, error: 'UIN already exists' });
        continue;
      }

      // Insert into pool
      const [inserted] = await db('uin_pool')
        .insert({
          uin: result.value,
          mode: result.mode,
          scope: scope || mode,
          iat: db.fn.now(),
          status: 'AVAILABLE',
          ts: db.fn.now(),
          hash_rmd160: result.hash_rmd160,
          meta: {
            checksum: result.checksum || null,
            rawComponents: result.rawComponents || null
          }
        })
        .returning('*');

      // Insert audit log
      await insertAudit({
        uin: result.value,
        eventType: 'GENERATED',
        oldStatus: null,
        newStatus: 'AVAILABLE',
        actorSystem: 'POOL_SERVICE',
        actorRef: null,
        details: { mode, scope, generated_at: new Date().toISOString() }
      });

      generated.push(inserted);

      // Log progress every 1000 UINs
      if ((i + 1) % 1000 === 0) {
        console.log(`  Generated ${i + 1}/${count} UINs...`);
      }
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }

  console.log(`✓ Pre-generation complete: ${generated.length} generated, ${errors.length} errors`);

  return {
    inserted: generated.length,
    errors: errors.length,
    errorDetails: errors.length > 0 ? errors.slice(0, 10) : []
  };
}

/**
 * Claim/pre-assign one AVAILABLE UIN (concurrency-safe)
 * @param {object} params - Claim parameters
 * @param {string} params.scope - Scope to claim from
 * @param {string} params.clientId - Client/system identifier
 * @returns {Promise<object|null>} Claimed UIN or null if none available
 */
export async function claimUin({ scope, clientId }) {
  const db = getDb();

  // Use FOR UPDATE SKIP LOCKED for concurrency-safe claim
  const result = await db.transaction(async (trx) => {
    // Find and lock one AVAILABLE UIN
    const query = trx('uin_pool')
      .where({ status: 'AVAILABLE' })
      .orderBy('iat', 'asc')
      .forUpdate()
      .skipLocked()
      .limit(1);

    if (scope) {
      query.where({ scope });
    }

    const [uin] = await query;

    if (!uin) {
      return null;
    }

    // Update to PREASSIGNED
    const [updated] = await trx('uin_pool')
      .where({ uin: uin.uin })
      .update({
        status: 'PREASSIGNED',
        claimed_by: clientId,
        claimed_at: trx.fn.now(),
        ts: trx.fn.now()
      })
      .returning('*');

    // Insert audit log
    await trx('uin_audit').insert({
      uin: uin.uin,
      event_type: 'PREASSIGNED',
      old_status: 'AVAILABLE',
      new_status: 'PREASSIGNED',
      actor_system: clientId || 'UNKNOWN',
      actor_ref: null,
      details: { scope, claimed_at: new Date().toISOString() }
    });

    return updated;
  });

  return result;
}

/**
 * Assign a PREASSIGNED UIN to a person/record
 * @param {object} params - Assignment parameters
 * @param {string} params.uin - UIN to assign
 * @param {string} params.assignedToRef - External reference ID
 * @param {string} params.actorSystem - System performing assignment
 * @param {string} params.actorRef - Transaction/case reference
 * @returns {Promise<object>} Updated UIN record
 */
export async function assignUin({ uin, assignedToRef, actorSystem, actorRef }) {
  const db = getDb();

  const result = await db.transaction(async (trx) => {
    // Get current UIN
    const current = await trx('uin_pool')
      .where({ uin })
      .first();

    if (!current) {
      throw new Error(`UIN not found: ${uin}`);
    }

    if (current.status !== 'PREASSIGNED') {
      throw new Error(`UIN must be in PREASSIGNED status, current status: ${current.status}`);
    }

    // Update to ASSIGNED
    const [updated] = await trx('uin_pool')
      .where({ uin })
      .update({
        status: 'ASSIGNED',
        assigned_to_ref: assignedToRef,
        assigned_at: trx.fn.now(),
        ts: trx.fn.now()
      })
      .returning('*');

    // Insert audit log
    await trx('uin_audit').insert({
      uin,
      event_type: 'ASSIGNED',
      old_status: 'PREASSIGNED',
      new_status: 'ASSIGNED',
      actor_system: actorSystem || 'UNKNOWN',
      actor_ref: actorRef || null,
      details: {
        assigned_to_ref: assignedToRef,
        assigned_at: new Date().toISOString()
      }
    });

    return updated;
  });

  return result;
}

/**
 * Release a PREASSIGNED UIN back to AVAILABLE
 * @param {object} params - Release parameters
 * @param {string} params.uin - UIN to release
 * @param {string} params.actorSystem - System performing release
 * @param {string} params.actorRef - Transaction/case reference
 * @returns {Promise<object>} Updated UIN record
 */
export async function releaseUin({ uin, actorSystem, actorRef }) {
  const db = getDb();

  const result = await db.transaction(async (trx) => {
    // Get current UIN
    const current = await trx('uin_pool')
      .where({ uin })
      .first();

    if (!current) {
      throw new Error(`UIN not found: ${uin}`);
    }

    if (current.status !== 'PREASSIGNED') {
      throw new Error(`UIN must be in PREASSIGNED status, current status: ${current.status}`);
    }

    // Update to AVAILABLE
    const [updated] = await trx('uin_pool')
      .where({ uin })
      .update({
        status: 'AVAILABLE',
        claimed_by: null,
        claimed_at: null,
        ts: trx.fn.now()
      })
      .returning('*');

    // Insert audit log
    await trx('uin_audit').insert({
      uin,
      event_type: 'RELEASED',
      old_status: 'PREASSIGNED',
      new_status: 'AVAILABLE',
      actor_system: actorSystem || 'SYSTEM',
      actor_ref: actorRef || null,
      details: {
        released_at: new Date().toISOString(),
        reason: 'Manual release'
      }
    });

    return updated;
  });

  return result;
}

/**
 * Update UIN status (retire, revoke, etc.)
 * @param {object} params - Status update parameters
 * @param {string} params.uin - UIN to update
 * @param {string} params.newStatus - New status
 * @param {string} params.reason - Reason for status change
 * @param {string} params.actorSystem - System performing update
 * @param {string} params.actorRef - Transaction/case reference
 * @returns {Promise<object>} Updated UIN record
 */
export async function updateUinStatus({ uin, newStatus, reason, actorSystem, actorRef }) {
  const db = getDb();

  const validStatuses = ['AVAILABLE', 'PREASSIGNED', 'ASSIGNED', 'RETIRED', 'REVOKED'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
  }

  const result = await db.transaction(async (trx) => {
    // Get current UIN
    const current = await trx('uin_pool')
      .where({ uin })
      .first();

    if (!current) {
      throw new Error(`UIN not found: ${uin}`);
    }

    const oldStatus = current.status;

    // Update status
    const [updated] = await trx('uin_pool')
      .where({ uin })
      .update({
        status: newStatus,
        ts: trx.fn.now()
      })
      .returning('*');

    // Insert audit log
    await trx('uin_audit').insert({
      uin,
      event_type: newStatus === 'RETIRED' ? 'RETIRED' : newStatus === 'REVOKED' ? 'REVOKED' : 'STATUS_CHANGED',
      old_status: oldStatus,
      new_status: newStatus,
      actor_system: actorSystem || 'SYSTEM',
      actor_ref: actorRef || null,
      details: {
        reason: reason || 'No reason provided',
        changed_at: new Date().toISOString()
      }
    });

    return updated;
  });

  return result;
}

/**
 * Release stale PREASSIGNED UINs back to AVAILABLE
 * @param {object} params - Cleanup parameters
 * @param {number} params.olderThanMinutes - Release UINs pre-assigned longer than this
 * @returns {Promise<object>} Summary of cleanup
 */
export async function releaseStalePreassigned({ olderThanMinutes }) {
  const db = getDb();

  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  const result = await db.transaction(async (trx) => {
    // Find stale PREASSIGNED UINs
    const staleUins = await trx('uin_pool')
      .where({ status: 'PREASSIGNED' })
      .where('claimed_at', '<', cutoffTime)
      .select('*');

    let released = 0;

    for (const uin of staleUins) {
      // Update to AVAILABLE
      await trx('uin_pool')
        .where({ uin: uin.uin })
        .update({
          status: 'AVAILABLE',
          claimed_by: null,
          claimed_at: null,
          ts: trx.fn.now()
        });

      // Insert audit log
      await trx('uin_audit').insert({
        uin: uin.uin,
        event_type: 'RELEASED',
        old_status: 'PREASSIGNED',
        new_status: 'AVAILABLE',
        actor_system: 'CLEANUP_SERVICE',
        actor_ref: null,
        details: {
          reason: 'Stale preassignment cleanup',
          claimed_at: uin.claimed_at,
          released_at: new Date().toISOString(),
          stale_minutes: olderThanMinutes
        }
      });

      released++;
    }

    return { released, processed: staleUins.length };
  });

  return result;
}

/**
 * Get UIN by value
 * @param {string} uin - UIN to lookup
 * @returns {Promise<object|null>} UIN record or null
 */
export async function getUin(uin) {
  const db = getDb();
  return await db('uin_pool')
    .where({ uin })
    .first();
}

/**
 * Get UIN audit history
 * @param {string} uin - UIN to get history for
 * @returns {Promise<Array>} Audit records
 */
export async function getUinAudit(uin) {
  const db = getDb();
  return await db('uin_audit')
    .where({ uin })
    .orderBy('created_at', 'desc');
}

/**
 * Get pool statistics
 * @param {string} scope - Optional scope filter
 * @returns {Promise<object>} Statistics
 */
export async function getPoolStats(scope = null) {
  const db = getDb();

  const query = db('uin_pool')
    .select('status')
    .count('* as count')
    .groupBy('status');

  if (scope) {
    query.where({ scope });
  }

  const results = await query;

  const stats = {
    total: 0,
    available: 0,
    preassigned: 0,
    assigned: 0,
    retired: 0,
    revoked: 0
  };

  results.forEach(row => {
    const status = row.status.toLowerCase();
    const count = parseInt(row.count);
    stats[status] = count;
    stats.total += count;
  });

  return stats;
}

export default {
  preGenerateUins,
  claimUin,
  assignUin,
  releaseUin,
  updateUinStatus,
  releaseStalePreassigned,
  getUin,
  getUinAudit,
  getPoolStats
};
