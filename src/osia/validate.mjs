/**
 * POST /v1/validate — syntax, length, charset, checksum and (optionally)
 * registry lifecycle validation. An invalid UIN is a normal 200 result with
 * `valid: false`; only a malformed request is a 400.
 */

import { checksumInfo, verifyCheck, computeCheck, DEFAULT_CHECKSUM } from './checksum.mjs';
import { CHARSETS, canonicalize, groupOrder } from './generator.mjs';
import { safeFullMatch } from './safeRegex.mjs';
import { findRow, recordValidation } from './pool.mjs';

const DB_TO_MODE = { foundational: 'FOUNDATIONAL', random: 'RANDOM', structured: 'STRUCTURED', sector_token: 'SECTOR', sectoral: 'SECTOR' };

export async function validateRequest(req, ctx) {
  const errors = [];
  const structured = req.mode === 'STRUCTURED' || req.pattern !== undefined;
  const canonical = structured ? req.uin.trim() : canonicalize(req.uin);
  const algorithm = req.checksum || DEFAULT_CHECKSUM;
  let checksumValid;

  if (canonical.length === 0) errors.push('UIN is empty');
  if (canonical.length > 128) errors.push('UIN exceeds 128 characters');

  if (req.expectedLength !== undefined && canonical.length !== req.expectedLength) {
    errors.push(`length is ${canonical.length}, expected ${req.expectedLength}`);
  }

  if (structured) {
    if (req.pattern === undefined) {
      errors.push('STRUCTURED validation requires a pattern');
    } else {
      const m = safeFullMatch(req.pattern.replace(/^\^/, '').replace(/(?<!\\)\$$/, ''), canonical);
      if (!m) {
        errors.push('UIN does not match the pattern');
      } else if (m.groups.checksum !== undefined && algorithm !== 'NONE') {
        const order = groupOrder(req.pattern);
        const before = order.slice(0, order.indexOf('checksum')).map((g) => m.groups[g] ?? '').join('');
        try {
          checksumValid = computeCheck(algorithm, before.toUpperCase()) === m.groups.checksum;
        } catch {
          checksumValid = false;
        }
        if (!checksumValid) errors.push(`${algorithm} check character mismatch`);
      }
    }
  } else if (canonical.length > 0) {
    const info = checksumInfo(algorithm);
    const body = canonical.slice(0, canonical.length - info.length);
    const charset = CHARSETS[req.charset || 'ALPHANUMERIC'];
    const bad = [...new Set([...body].filter((c) => !charset.includes(c)))];
    if (bad.length > 0) errors.push(`characters not in ${req.charset || 'ALPHANUMERIC'}: ${bad.join('').slice(0, 16)}`);
    if (algorithm !== 'NONE') {
      checksumValid = verifyCheck(algorithm, canonical);
      if (!checksumValid) errors.push(`${algorithm} check character mismatch`);
    }
  }

  let status = errors.length === 0 ? 'VALID' : 'INVALID';
  let mode = req.mode;

  if (req.checkRegistry === true && canonical.length > 0 && canonical.length <= 128) {
    const row = await findRow(canonical);
    if (!row) {
      errors.push('UIN is not registered');
      status = 'INVALID';
    } else {
      mode = mode || DB_TO_MODE[row.mode];
      const now = new Date();
      if (row.status === 'REVOKED' || row.status === 'RETIRED') {
        errors.push(`UIN is ${row.status}`);
        status = row.status;
      } else if (row.exp && new Date(row.exp) <= now) {
        errors.push('UIN has expired');
        status = 'EXPIRED';
      } else if (row.nbf && new Date(row.nbf) > now) {
        errors.push('UIN is not yet valid');
        status = 'INVALID';
      } else if (row.status !== 'ASSIGNED') {
        errors.push(`UIN is ${row.status}, not ASSIGNED`);
        status = 'INVALID';
      }
      await recordValidation(canonical, ctx);
    }
  }

  const res = { valid: errors.length === 0, mode: mode || 'UNSPECIFIED', status, canonicalUin: canonical.slice(0, 128) };
  if (checksumValid !== undefined) res.checksumValid = checksumValid;
  if (errors.length > 0) res.errors = errors;
  return res;
}
