/**
 * UIN Format Service
 * Handles UIN display formatting based on format configurations stored in the database.
 *
 * Instead of storing pre-formatted UINs (inefficient for millions of records),
 * we store format rules in uin_formats table and apply them at display time.
 */

import { getDb } from './db.mjs';

// Cache for format configurations (refreshed periodically)
let formatCache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Refresh format cache from database
 */
async function refreshCache() {
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL && formatCache.size > 0) {
    return;
  }

  const db = getDb();
  const formats = await db('uin_formats').select('*');

  formatCache.clear();
  formats.forEach(f => {
    formatCache.set(f.id, f);
    formatCache.set(`code:${f.format_code}`, f);
    if (f.is_default) {
      formatCache.set('default', f);
    }
    if (f.applies_to_scope) {
      formatCache.set(`scope:${f.applies_to_scope}`, f);
    }
    if (f.applies_to_mode) {
      formatCache.set(`mode:${f.applies_to_mode}`, f);
    }
  });

  cacheTimestamp = now;
}

/**
 * Get all available formats
 * @returns {Promise<Array>} List of format configurations
 */
export async function getFormats() {
  const db = getDb();
  return await db('uin_formats')
    .select('*')
    .orderBy('is_default', 'desc')
    .orderBy('name', 'asc');
}

/**
 * Get format by ID or code
 * @param {number|string} idOrCode - Format ID or format_code
 * @returns {Promise<object|null>} Format configuration
 */
export async function getFormat(idOrCode) {
  await refreshCache();

  if (typeof idOrCode === 'number') {
    return formatCache.get(idOrCode) || null;
  }
  return formatCache.get(`code:${idOrCode}`) || null;
}

/**
 * Get default format
 * @returns {Promise<object|null>} Default format configuration
 */
export async function getDefaultFormat() {
  await refreshCache();
  return formatCache.get('default') || null;
}

/**
 * Get format for a specific scope
 * @param {string} scope - UIN scope (e.g., 'health', 'tax')
 * @returns {Promise<object|null>} Format configuration
 */
export async function getFormatByScope(scope) {
  await refreshCache();
  return formatCache.get(`scope:${scope}`) || null;
}

/**
 * Get format for a specific mode
 * @param {string} mode - Generation mode (e.g., 'foundational', 'sector_token')
 * @returns {Promise<object|null>} Format configuration
 */
export async function getFormatByMode(mode) {
  await refreshCache();
  return formatCache.get(`mode:${mode}`) || null;
}

/**
 * Format a UIN string according to format specification
 * @param {string} uin - Raw UIN string
 * @param {object} format - Format configuration object
 * @returns {string} Formatted UIN
 */
export function applyFormat(uin, format) {
  if (!format || !uin) {
    return uin;
  }

  // Apply case transformation
  let processed = uin;
  switch (format.display_case) {
    case 'upper':
      processed = uin.toUpperCase();
      break;
    case 'lower':
      processed = uin.toLowerCase();
      break;
    // 'preserve' or any other value: keep as-is
  }

  // Parse segment lengths (handle both array and PostgreSQL array string)
  let segments = format.segment_lengths;
  if (typeof segments === 'string') {
    // PostgreSQL returns arrays as strings like '{5,4,4,4,2}'
    segments = segments.replace(/[{}]/g, '').split(',').map(Number);
  }

  // Build formatted string
  const parts = [];
  let pos = 0;

  for (const len of segments) {
    if (pos >= processed.length) break;
    parts.push(processed.substring(pos, pos + len));
    pos += len;
  }

  // Join with separator
  const separator = format.separator || '';
  let result = parts.join(separator);

  // Add prefix and suffix
  if (format.prefix) {
    result = format.prefix + result;
  }
  if (format.suffix) {
    result = result + format.suffix;
  }

  return result;
}

/**
 * Format a UIN with auto-detected format based on scope/mode
 * @param {string} uin - Raw UIN string
 * @param {string} scope - UIN scope (optional)
 * @param {string} mode - Generation mode (optional)
 * @returns {Promise<string>} Formatted UIN
 */
export async function formatUin(uin, scope = null, mode = null) {
  await refreshCache();

  // Priority: scope > mode > default
  let format = null;

  if (scope) {
    format = formatCache.get(`scope:${scope}`);
  }

  if (!format && mode) {
    format = formatCache.get(`mode:${mode}`);
  }

  if (!format) {
    format = formatCache.get('default');
  }

  return applyFormat(uin, format);
}

/**
 * Format a UIN from the database (looks up scope/mode automatically)
 * @param {string} uin - UIN value
 * @returns {Promise<object>} Object with raw and formatted UIN
 */
export async function formatUinFromDb(uin) {
  const db = getDb();

  // Check for override first
  const override = await db('uin_format_overrides')
    .where({ uin })
    .first();

  if (override) {
    const format = await getFormat(override.format_id);
    return {
      raw: uin,
      formatted: applyFormat(uin, format),
      format_code: format?.format_code || null
    };
  }

  // Get UIN's scope and mode
  const uinRecord = await db('uin_pool')
    .where({ uin })
    .select('scope', 'mode')
    .first();

  if (!uinRecord) {
    return { raw: uin, formatted: uin, format_code: null };
  }

  const formatted = await formatUin(uin, uinRecord.scope, uinRecord.mode);
  await refreshCache();

  // Find which format was applied
  let formatCode = null;
  if (uinRecord.scope && formatCache.get(`scope:${uinRecord.scope}`)) {
    formatCode = formatCache.get(`scope:${uinRecord.scope}`).format_code;
  } else if (uinRecord.mode && formatCache.get(`mode:${uinRecord.mode}`)) {
    formatCode = formatCache.get(`mode:${uinRecord.mode}`).format_code;
  } else if (formatCache.get('default')) {
    formatCode = formatCache.get('default').format_code;
  }

  return {
    raw: uin,
    formatted,
    format_code: formatCode
  };
}

/**
 * Create a new format configuration
 * @param {object} config - Format configuration
 * @returns {Promise<object>} Created format
 */
export async function createFormat(config) {
  const db = getDb();

  const [format] = await db('uin_formats')
    .insert({
      format_code: config.format_code,
      name: config.name,
      description: config.description || null,
      separator: config.separator || '',
      segment_lengths: config.segment_lengths,
      total_length: config.total_length,
      display_case: config.display_case || 'upper',
      prefix: config.prefix || '',
      suffix: config.suffix || '',
      is_default: config.is_default || false,
      applies_to_scope: config.applies_to_scope || null,
      applies_to_mode: config.applies_to_mode || null,
      created_by: config.created_by || 'API'
    })
    .returning('*');

  // Invalidate cache
  cacheTimestamp = 0;

  return format;
}

/**
 * Update a format configuration
 * @param {number} id - Format ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated format
 */
export async function updateFormat(id, updates) {
  const db = getDb();

  const [format] = await db('uin_formats')
    .where({ id })
    .update({
      ...updates,
      updated_at: db.fn.now()
    })
    .returning('*');

  // Invalidate cache
  cacheTimestamp = 0;

  return format;
}

/**
 * Delete a format configuration
 * @param {number} id - Format ID
 * @returns {Promise<boolean>} Success
 */
export async function deleteFormat(id) {
  const db = getDb();

  const deleted = await db('uin_formats')
    .where({ id })
    .whereNot({ is_default: true }) // Prevent deleting default
    .delete();

  // Invalidate cache
  cacheTimestamp = 0;

  return deleted > 0;
}

/**
 * Set format override for a specific UIN
 * @param {string} uin - UIN value
 * @param {number} formatId - Format ID to apply
 * @returns {Promise<object>} Override record
 */
export async function setFormatOverride(uin, formatId) {
  const db = getDb();

  const [override] = await db('uin_format_overrides')
    .insert({
      uin,
      format_id: formatId
    })
    .onConflict('uin')
    .merge()
    .returning('*');

  return override;
}

/**
 * Remove format override for a UIN
 * @param {string} uin - UIN value
 * @returns {Promise<boolean>} Success
 */
export async function removeFormatOverride(uin) {
  const db = getDb();
  const deleted = await db('uin_format_overrides')
    .where({ uin })
    .delete();
  return deleted > 0;
}

/**
 * Preview how a UIN would look with a specific format
 * @param {string} uin - UIN to format
 * @param {number|string} formatIdOrCode - Format ID or code
 * @returns {Promise<string>} Formatted UIN
 */
export async function previewFormat(uin, formatIdOrCode) {
  const format = await getFormat(formatIdOrCode);
  return applyFormat(uin, format);
}

export default {
  getFormats,
  getFormat,
  getDefaultFormat,
  getFormatByScope,
  getFormatByMode,
  applyFormat,
  formatUin,
  formatUinFromDb,
  createFormat,
  updateFormat,
  deleteFormat,
  setFormatOverride,
  removeFormatOverride,
  previewFormat
};
