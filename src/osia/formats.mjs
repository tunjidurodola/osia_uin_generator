/**
 * OSIA FormatConfig <-> uin_formats mapping and display formatting.
 */

import { getDb } from '../db.mjs';
import { applyFormat, getFormat, invalidateFormatCache } from '../formatService.mjs';
import { badRequest, notFound } from './errors.mjs';

/**
 * Group a canonical UIN for display. Segments are taken in order; once the
 * list is exhausted the last segment length repeats, so `[4]` means
 * "groups of four" for any length.
 */
export function groupUin(uin, segmentLengths, separator = '', prefix = '', suffix = '') {
  const parts = [];
  let pos = 0;
  let idx = 0;
  while (pos < uin.length) {
    const len = segmentLengths[Math.min(idx, segmentLengths.length - 1)];
    parts.push(uin.slice(pos, pos + len));
    pos += len;
    idx++;
  }
  return `${prefix || ''}${parts.join(separator || '')}${suffix || ''}`;
}

export function rowToFormatConfig(row) {
  const segments = Array.isArray(row.segment_lengths)
    ? row.segment_lengths
    : String(row.segment_lengths).replace(/[{}]/g, '').split(',').map(Number);
  const out = {
    code: row.format_code,
    name: row.name,
    separator: row.separator || '',
    groupSize: segments[0],
    segmentLengths: segments
  };
  if (row.prefix) out.prefix = row.prefix;
  if (row.suffix) out.suffix = row.suffix;
  if (row.description) out.description = row.description;
  return out;
}

/**
 * Resolve the display form requested by GenerateRequest.formatting.
 * @returns {Promise<string|undefined>}
 */
export async function formatForResponse(uin, formatting) {
  if (!formatting) return undefined;
  if (formatting.formatCode) {
    const row = await getFormat(formatting.formatCode);
    if (!row) throw badRequest(`unknown formatCode "${formatting.formatCode}"`);
    return applyFormat(uin, row);
  }
  if (formatting.enabled !== true) return undefined;
  return groupUin(
    uin,
    [formatting.groupSize ?? 4],
    formatting.separator ?? '-',
    formatting.prefix,
    formatting.suffix
  );
}

function segmentsFrom(cfg) {
  if (cfg.segmentLengths) return cfg.segmentLengths;
  if (cfg.groupSize !== undefined) return [cfg.groupSize];
  return undefined;
}

export async function listFormats() {
  const rows = await getDb()('uin_formats').select('*').orderBy('is_default', 'desc').orderBy('format_code', 'asc');
  return rows.map(rowToFormatConfig);
}

export async function getFormatConfig(code) {
  const row = await getDb()('uin_formats').where({ format_code: code }).first();
  if (!row) throw notFound(`format "${code}" not found`);
  return rowToFormatConfig(row);
}

export async function createFormatConfig(cfg, actor) {
  const db = getDb();
  if (cfg.segmentLengths && cfg.segmentLengths[0] !== cfg.groupSize) {
    throw badRequest('groupSize must equal the first entry of segmentLengths');
  }
  const exists = await db('uin_formats').where({ format_code: cfg.code }).first();
  if (exists) throw badRequest(`format "${cfg.code}" already exists`);
  const segments = segmentsFrom(cfg);
  const [row] = await db('uin_formats')
    .insert({
      format_code: cfg.code,
      name: cfg.name,
      description: cfg.description ?? null,
      separator: cfg.separator,
      segment_lengths: segments,
      total_length: cfg.segmentLengths ? segments.reduce((a, b) => a + b, 0) : 0,
      prefix: cfg.prefix ?? '',
      suffix: cfg.suffix ?? '',
      display_case: 'preserve',
      created_by: actor
    })
    .returning('*');
  invalidateFormatCache();
  return rowToFormatConfig(row);
}

export async function updateFormatConfig(code, patch) {
  const db = getDb();
  const current = await db('uin_formats').where({ format_code: code }).first();
  if (!current) throw notFound(`format "${code}" not found`);
  if (patch.segmentLengths && patch.groupSize !== undefined && patch.segmentLengths[0] !== patch.groupSize) {
    throw badRequest('groupSize must equal the first entry of segmentLengths');
  }
  const update = { updated_at: db.fn.now() };
  for (const [k, col] of [['name', 'name'], ['separator', 'separator'], ['prefix', 'prefix'], ['suffix', 'suffix'], ['description', 'description']]) {
    if (patch[k] !== undefined) update[col] = patch[k];
  }
  const segments = segmentsFrom(patch);
  if (segments) {
    update.segment_lengths = segments;
    update.total_length = patch.segmentLengths ? segments.reduce((a, b) => a + b, 0) : 0;
  }
  const [row] = await db('uin_formats').where({ format_code: code }).update(update).returning('*');
  invalidateFormatCache();
  return rowToFormatConfig(row);
}

export async function deleteFormatConfig(code) {
  const db = getDb();
  const current = await db('uin_formats').where({ format_code: code }).first();
  if (!current) throw notFound(`format "${code}" not found`);
  if (current.is_default) throw badRequest('the default format cannot be deleted');
  const inUse = await db('uin_format_overrides').where({ format_id: current.id }).first();
  if (inUse) throw badRequest(`format "${code}" is referenced by pooled UINs`);
  await db('uin_formats').where({ id: current.id }).delete();
  invalidateFormatCache();
}
