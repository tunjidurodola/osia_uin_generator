/**
 * OSIA v2 pool lifecycle: AVAILABLE -> PREASSIGNED -> ASSIGNED -> RETIRED | REVOKED,
 * with PREASSIGNED -> AVAILABLE on release or reservation expiry.
 *
 * Every transition locks the row, checks the source state, and appends an
 * audit event carrying the caller identity and OSIA transactionId.
 */

import { getDb } from '../db.mjs';
import { getFormat, getFormatByScope, getFormatByMode, getDefaultFormat, applyFormat } from '../formatService.mjs';
import { generateIdentifier, EntropyCollector, integrityHash, DEFAULT_LENGTH } from './generator.mjs';
import { badRequest, notFound } from './errors.mjs';

const MODE_TO_DB = { FOUNDATIONAL: 'foundational', RANDOM: 'random', STRUCTURED: 'structured', SECTOR: 'sector_token' };
const DB_TO_MODE = { foundational: 'FOUNDATIONAL', random: 'RANDOM', structured: 'STRUCTURED', sector_token: 'SECTOR', sectoral: 'SECTOR' };
const STATUSES = ['AVAILABLE', 'PREASSIGNED', 'ASSIGNED', 'RETIRED', 'REVOKED'];
const CHUNK = 500;

const iso = (v) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString());

function entropyFromMeta(meta) {
  const p = meta && meta.provenance;
  if (!p || typeof p !== 'object' || typeof p.hardware !== 'boolean') return undefined;
  const fips = Number(p.fipsLevel) || 0;
  return {
    hardware: p.hardware,
    source: String(p.source || (p.hardware ? 'Hardware TRNG' : 'Node.js CSPRNG')).slice(0, 128),
    fipsLevel: p.hardware && fips > 0 ? fips : null
  };
}

async function resolveFormat(row, overrideFormatId) {
  if (overrideFormatId) return getFormat(overrideFormatId);
  return (row.scope && (await getFormatByScope(row.scope)))
    || (row.mode && (await getFormatByMode(row.mode)))
    || getDefaultFormat();
}

/**
 * Map uin_pool rows to OSIA UinRecord objects (display format resolved per row).
 */
export async function toUinRecords(rows) {
  if (rows.length === 0) return [];
  const overrides = await getDb()('uin_format_overrides').whereIn('uin', rows.map((r) => r.uin)).select('uin', 'format_id');
  const byUin = new Map(overrides.map((o) => [o.uin, o.format_id]));
  const out = [];
  for (const row of rows) {
    const format = await resolveFormat(row, byUin.get(row.uin));
    const meta = row.meta || {};
    const rec = {
      uin: row.uin,
      status: row.status,
      mode: DB_TO_MODE[row.mode] || 'RANDOM',
      createdAt: iso(row.iat),
      updatedAt: iso(row.ts)
    };
    if (format) {
      rec.formattedUin = applyFormat(row.uin, format);
      rec.formatCode = format.format_code;
    }
    if (row.scope) rec.scope = String(row.scope).slice(0, 64);
    rec.claimedBy = row.claimed_by != null ? String(row.claimed_by).slice(0, 128) : null;
    rec.assignedToRef = row.assigned_to_ref != null ? String(row.assigned_to_ref).slice(0, 128) : null;
    rec.reason = typeof meta.reason === 'string' ? meta.reason.slice(0, 256) : null;
    const entropy = entropyFromMeta(meta);
    if (entropy) rec.entropy = entropy;
    out.push(rec);
  }
  return out;
}

async function toUinRecord(row) {
  return (await toUinRecords([row]))[0];
}

function audit(trx, { uin, eventType, oldStatus = null, newStatus = null, ctx, reason, extra = {} }) {
  return trx('uin_audit').insert({
    uin,
    event_type: eventType,
    old_status: oldStatus,
    new_status: newStatus,
    actor_system: ctx.subject,
    actor_ref: ctx.transactionId,
    details: { transactionId: ctx.transactionId, ...(reason ? { reason } : {}), ...extra }
  });
}

const mergeMeta = (db, patch, remove = []) => {
  let expr = "coalesce(meta, '{}'::jsonb)";
  for (const k of remove) expr = `(${expr} - '${k}')`;
  return db.raw(`${expr} || ?::jsonb`, [JSON.stringify(patch)]);
};

// ─── Queries ────────────────────────────────────────────────────────────────

export async function poolStats(scope) {
  const q = getDb()('uin_pool').select('status').count('* as count').groupBy('status');
  if (scope) q.where({ scope });
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let total = 0;
  for (const row of await q) {
    const n = Number(row.count);
    byStatus[row.status] = n;
    total += n;
  }
  return { scope: scope ?? null, total, byStatus };
}

export async function peek({ status, scope, limit = 10 }) {
  const q = getDb()('uin_pool').orderBy('iat', 'asc').limit(limit).select('*');
  if (status) q.where({ status });
  if (scope) q.where({ scope });
  return toUinRecords(await q);
}

export async function getRecord(uin) {
  const row = await getDb()('uin_pool').where({ uin }).first();
  if (!row) throw notFound('UIN not found');
  return toUinRecord(row);
}

export async function findRow(uin) {
  return getDb()('uin_pool').where({ uin }).first();
}

function mapEvent(row) {
  switch (row.event_type) {
    case 'GENERATED':
    case 'PRE_GENERATED':
      return 'PRE_GENERATED';
    case 'PREASSIGNED':
    case 'CLAIMED':
      return 'CLAIMED';
    case 'ASSIGNED':
    case 'RELEASED':
    case 'RETIRED':
    case 'REVOKED':
    case 'VALIDATED':
      return row.event_type;
    case 'STATUS_CHANGED':
      return { AVAILABLE: 'RELEASED', PREASSIGNED: 'CLAIMED', ASSIGNED: 'ASSIGNED', RETIRED: 'RETIRED', REVOKED: 'REVOKED' }[row.new_status] || null;
    default:
      return null;
  }
}

export async function auditTrail(uin) {
  const db = getDb();
  const rows = await db('uin_audit').where({ uin }).orderBy('created_at', 'asc').orderBy('id', 'asc');
  if (rows.length === 0 && !(await findRow(uin))) throw notFound('UIN not found');
  const events = [];
  for (const row of rows) {
    const eventType = mapEvent(row);
    if (!eventType) continue;
    const d = row.details || {};
    const e = { id: String(row.id), uin: row.uin, eventType, timestamp: iso(row.created_at) };
    if (row.old_status) e.previousStatus = row.old_status;
    if (row.new_status) e.newStatus = row.new_status;
    if (row.actor_system) e.actor = String(row.actor_system).slice(0, 128);
    if (typeof d.reason === 'string') e.reason = d.reason.slice(0, 256);
    if (typeof d.transactionId === 'string') e.transactionId = d.transactionId.slice(0, 128);
    events.push(e);
  }
  return events;
}

// ─── Lifecycle operations ───────────────────────────────────────────────────

export async function preGenerate(req, ctx) {
  const mode = req.mode || 'FOUNDATIONAL';
  if (mode === 'SECTOR' || mode === 'STRUCTURED') {
    throw badRequest(`${mode} identifiers cannot be pre-generated into the pool`);
  }
  const db = getDb();
  const scope = req.scope || 'foundational';

  let formatId = null;
  if (req.formatCode) {
    const f = await getFormat(req.formatCode);
    if (!f) throw badRequest(`unknown formatCode "${req.formatCode}"`);
    formatId = f.id;
  }

  const genReq = {
    mode,
    length: req.length ?? DEFAULT_LENGTH,
    charset: req.charset,
    excludeAmbiguous: req.excludeAmbiguous,
    checksum: req.checksum
  };
  const collector = new EntropyCollector({ prefetch: 65536 });
  let generated = 0;
  let attempts = 0;

  while (generated < req.count) {
    if (attempts++ > 10 + Math.ceil(req.count / CHUNK) * 2) {
      throw new Error('pre-generation could not produce enough unique UINs');
    }
    const want = Math.min(CHUNK, req.count - generated);
    const rows = [];
    const seen = new Set();
    for (let i = 0; i < want; i++) {
      const r = await generateIdentifier(genReq, collector);
      if (seen.has(r.uin)) continue;
      seen.add(r.uin);
      rows.push({
        uin: r.uin,
        mode: MODE_TO_DB[mode],
        scope,
        status: 'AVAILABLE',
        hash_rmd160: integrityHash(r.uin),
        transaction_id: ctx.transactionId,
        meta: { checksum: { algorithm: r.checksum }, charset: req.charset || 'ALPHANUMERIC', provenance: r.entropy || null }
      });
    }
    await db.transaction(async (trx) => {
      const inserted = await trx('uin_pool').insert(rows).onConflict('uin').ignore().returning('uin');
      const uins = inserted.map((x) => x.uin);
      if (uins.length === 0) return;
      await trx('uin_audit').insert(uins.map((uin) => ({
        uin,
        event_type: 'PRE_GENERATED',
        old_status: null,
        new_status: 'AVAILABLE',
        actor_system: ctx.subject,
        actor_ref: ctx.transactionId,
        details: { transactionId: ctx.transactionId, scope }
      })));
      if (formatId) {
        await trx('uin_format_overrides').insert(uins.map((uin) => ({ uin, format_id: formatId }))).onConflict('uin').merge();
      }
      generated += uins.length;
    });
  }

  const res = { generated, scope, status: 'AVAILABLE' };
  const entropy = collector.provenance();
  if (entropy) res.entropy = entropy;
  return res;
}

export async function claim(req, ctx) {
  const db = getDb();
  const scope = req.scope || 'foundational';
  const claimedBy = req.claimedBy || ctx.subject;
  const row = await db.transaction(async (trx) => {
    const [candidate] = await trx('uin_pool')
      .where({ status: 'AVAILABLE', scope })
      .orderBy('iat', 'asc')
      .forUpdate()
      .skipLocked()
      .limit(1);
    if (!candidate) return null;
    const patch = req.ttlSeconds ? { claimTtlSeconds: req.ttlSeconds } : {};
    const [updated] = await trx('uin_pool')
      .where({ uin: candidate.uin })
      .update({
        status: 'PREASSIGNED',
        claimed_by: claimedBy,
        claimed_at: trx.fn.now(),
        ts: trx.fn.now(),
        meta: mergeMeta(trx, { ...patch, reason: null }, ['claimTtlSeconds'])
      })
      .returning('*');
    await audit(trx, {
      uin: candidate.uin, eventType: 'CLAIMED', oldStatus: 'AVAILABLE', newStatus: 'PREASSIGNED', ctx,
      extra: { scope, claimedBy, ...(req.ttlSeconds ? { ttlSeconds: req.ttlSeconds } : {}) }
    });
    return updated;
  });
  if (!row) throw notFound(`no AVAILABLE UIN in scope "${scope}"`);
  return toUinRecord(row);
}

async function transition(uin, from, to, ctx, buildUpdate, auditFields) {
  const db = getDb();
  const row = await db.transaction(async (trx) => {
    const current = await trx('uin_pool').where({ uin }).forUpdate().first();
    if (!current) throw notFound('UIN not found');
    if (!from.includes(current.status)) {
      throw badRequest(`UIN is ${current.status}; this operation requires ${from.join(' or ')}`);
    }
    const [updated] = await trx('uin_pool')
      .where({ uin })
      .update({ status: to, ts: trx.fn.now(), ...buildUpdate(trx) })
      .returning('*');
    await audit(trx, { uin, oldStatus: current.status, newStatus: to, ctx, ...auditFields });
    return updated;
  });
  return toUinRecord(row);
}

export function assign(req, ctx) {
  return transition(req.uin, ['PREASSIGNED'], 'ASSIGNED', ctx, (trx) => ({
    assigned_to_ref: req.entityId,
    assigned_at: trx.fn.now(),
    meta: mergeMeta(trx, { reason: null }, ['claimTtlSeconds'])
  }), { eventType: 'ASSIGNED', extra: { entityId: req.entityId } });
}

export function release(req, ctx) {
  return transition(req.uin, ['PREASSIGNED'], 'AVAILABLE', ctx, (trx) => ({
    claimed_by: null,
    claimed_at: null,
    meta: mergeMeta(trx, { reason: req.reason ?? null }, ['claimTtlSeconds'])
  }), { eventType: 'RELEASED', reason: req.reason });
}

export function setTerminalStatus(req, ctx) {
  return transition(req.uin, ['ASSIGNED'], req.status, ctx, (trx) => ({
    meta: mergeMeta(trx, { reason: req.reason ?? null })
  }), { eventType: req.status, reason: req.reason });
}

export async function cleanupPreassigned(req, ctx) {
  const db = getDb();
  const olderThan = req.olderThanSeconds ?? 3600;
  return db.transaction(async (trx) => {
    const q = trx('uin_pool')
      .where({ status: 'PREASSIGNED' })
      .whereRaw("claimed_at < now() - make_interval(secs => coalesce((meta->>'claimTtlSeconds')::int, ?))", [olderThan]);
    if (req.scope) q.where({ scope: req.scope });
    const released = await q
      .update({
        status: 'AVAILABLE',
        claimed_by: null,
        claimed_at: null,
        ts: trx.fn.now(),
        meta: mergeMeta(trx, { reason: 'Reservation expired' }, ['claimTtlSeconds'])
      })
      .returning('uin');
    if (released.length > 0) {
      await trx('uin_audit').insert(released.map(({ uin }) => ({
        uin,
        event_type: 'RELEASED',
        old_status: 'PREASSIGNED',
        new_status: 'AVAILABLE',
        actor_system: ctx.subject,
        actor_ref: ctx.transactionId,
        details: { transactionId: ctx.transactionId, reason: 'Reservation expired' }
      })));
    }
    return { releasedCount: released.length };
  });
}

export async function recordValidation(uin, ctx) {
  await audit(getDb(), { uin, eventType: 'VALIDATED', ctx });
}
