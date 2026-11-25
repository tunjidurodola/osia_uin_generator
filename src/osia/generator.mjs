/**
 * OSIA v2 UIN generation engine (POST /v1/generate, /v1/batch, /v1/uin,
 * /v1/uin/pre-generate).
 *
 * Every random character is drawn by rejection sampling from bytes obtained
 * through the HSM priority chain (remote Utimaco TRNG -> local PKCS#11 HSM ->
 * Node CSPRNG). Provenance is accumulated across all draws of one identifier,
 * so a UIN is reported as hardware-sourced only if every byte was.
 */

import crypto from 'crypto';
import { randomBytesWithSource, getSectorSecrets } from '../cryptoService.mjs';
import { getConfig } from '../config.mjs';
import { computeUinHash } from '../hash.mjs';
import { checksumInfo, computeCheck, DEFAULT_CHECKSUM } from './checksum.mjs';
import { safeFullMatch } from './safeRegex.mjs';
import { OsiaError, badRequest } from './errors.mjs';

export const CHARSETS = {
  ALPHANUMERIC: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  NUMERIC: '0123456789',
  ALPHABETIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  HEXADECIMAL: '0123456789ABCDEF'
};

const AMBIGUOUS = new Set(['0', 'O', 'I', '1', 'l']);

export const DEFAULT_LENGTH = 19;

const DEFAULT_STRUCTURED_ATTRIBUTES = [
  'regionCode', 'districtCode', 'officeCode', 'issuerCode', 'registryCode',
  'sectorCode', 'countryCode', 'registrationYear', 'batchCode'
];

export function charsetFor(name = 'ALPHANUMERIC', excludeAmbiguous = false) {
  const set = CHARSETS[name];
  if (!set) throw badRequest(`unsupported charset ${name}`);
  return excludeAmbiguous ? [...set].filter((c) => !AMBIGUOUS.has(c)).join('') : set;
}

function requireHardware() {
  return process.env.HSM_REQUIRE_HARDWARE === 'true' || process.env.HSM_REQUIRE_HARDWARE === '1';
}

let entropySource = randomBytesWithSource;

/** Replace the entropy source (tests only). */
export function setEntropySource(fn) {
  entropySource = fn || randomBytesWithSource;
}

/**
 * Collects random bytes for one identifier and tracks their provenance.
 */
export class EntropyCollector {
  /**
   * @param {{prefetch?: number}} [options] - with `prefetch`, bytes are fetched
   *   in blocks of at least this size and served from a buffer (bulk generation)
   */
  constructor({ prefetch = 0 } = {}) {
    this.sources = new Set();
    this.allHardware = true;
    this.minFips = Infinity;
    this.used = false;
    this.prefetch = prefetch;
    this.buffer = Buffer.alloc(0);
  }

  async bytes(n) {
    if (this.prefetch > 0) {
      if (this.buffer.length < n) {
        this.buffer = Buffer.concat([this.buffer, await this.fetch(Math.max(n, this.prefetch))]);
      }
      const out = this.buffer.subarray(0, n);
      this.buffer = this.buffer.subarray(n);
      return out;
    }
    return this.fetch(n);
  }

  async fetch(n) {
    const r = await entropySource(n);
    if (requireHardware() && !r.hardware) {
      throw new OsiaError(503, 'Hardware entropy is required (HSM_REQUIRE_HARDWARE) but no hardware TRNG is available');
    }
    this.used = true;
    this.sources.add(r.source || (r.hardware ? 'Hardware TRNG' : 'Node.js CSPRNG'));
    this.allHardware = this.allHardware && Boolean(r.hardware);
    if (r.hardware) this.minFips = Math.min(this.minFips, Number(r.fipsLevel) || 0);
    return r.bytes;
  }

  provenance() {
    if (!this.used) return undefined;
    const fips = this.allHardware && Number.isFinite(this.minFips) && this.minFips > 0 ? this.minFips : null;
    return {
      hardware: this.allHardware,
      source: [...this.sources].join(' + ').slice(0, 128),
      fipsLevel: fips
    };
  }
}

/**
 * Uniformly random string over `charset` (rejection sampling, no modulo bias).
 */
export async function randomString(length, charset, collector) {
  const n = charset.length;
  if (n < 2) throw badRequest('character set must contain at least two characters');
  const limit = 256 - (256 % n);
  let out = '';
  while (out.length < length) {
    const bytes = await collector.bytes((length - out.length) * 2 + 8);
    for (const b of bytes) {
      if (b < limit) out += charset[b % n];
      if (out.length === length) break;
    }
  }
  return out;
}

// ─── Lifecycle claims ────────────────────────────────────────────────────────

function pick(name, a, b) {
  if (a !== undefined && b !== undefined && a !== b) {
    throw badRequest(`conflicting values for ${name} (top-level and lifecycle)`);
  }
  return a !== undefined ? a : b;
}

export function resolveLifecycle(req, now = new Date()) {
  const lc = req.lifecycle || {};
  const issuer = pick('issuer', req.issuer, lc.issuer);
  const audience = pick('audience', req.audience, lc.audience);
  const notBefore = pick('notBefore', req.not_before, lc.notBefore);

  const expiryInputs = [
    req.expiry !== undefined,
    lc.expiresAt !== undefined && lc.expiresAt !== null,
    lc.ttlMinutes !== undefined
  ].filter(Boolean).length;
  if (expiryInputs > 1) {
    throw badRequest('specify at most one of expiry, lifecycle.expiresAt, lifecycle.ttlMinutes');
  }

  let expiresAt = null;
  if (req.expiry !== undefined) expiresAt = new Date(req.expiry);
  else if (lc.expiresAt) expiresAt = new Date(lc.expiresAt);
  else if (lc.ttlMinutes !== undefined) expiresAt = new Date(now.getTime() + lc.ttlMinutes * 60000);

  if (lc.infiniteLifetime === true && expiresAt) {
    throw badRequest('infiniteLifetime cannot be true when an expiry is given');
  }
  if (lc.infiniteLifetime === false && !expiresAt) {
    throw badRequest('infiniteLifetime is false but no expiry, expiresAt or ttlMinutes was given');
  }

  const nbf = notBefore !== undefined ? new Date(notBefore) : null;
  if (expiresAt && expiresAt <= now) throw badRequest('expiry must be in the future');
  if (expiresAt && nbf && expiresAt <= nbf) throw badRequest('expiry must be after notBefore');

  return {
    issuer: issuer ?? getDefaultIssuer(),
    audience,
    notBefore: nbf ? nbf.toISOString() : undefined,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    infiniteLifetime: !expiresAt
  };
}

export function getDefaultIssuer() {
  return process.env.OSIA_ISSUER || 'https://uin-generator.app';
}

// ─── STRUCTURED patterns ─────────────────────────────────────────────────────

function structuredAttributeAllowlist() {
  const raw = process.env.UIN_STRUCTURED_ATTRIBUTES;
  return new Set(raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_STRUCTURED_ATTRIBUTES);
}

function expandClass(body) {
  if (body === '\\d') return CHARSETS.NUMERIC;
  const m = /^\[(.+)\]$/.exec(body);
  if (!m || m[1].startsWith('^')) return null;
  const src = m[1];
  const chars = new Set();
  for (let i = 0; i < src.length; i++) {
    let c = src[i];
    if (c === '\\') {
      const e = src[++i];
      if (e === 'd') { for (const d of CHARSETS.NUMERIC) chars.add(d); continue; }
      c = e;
    }
    if (src[i + 1] === '-' && i + 2 < src.length) {
      const end = src[i + 2];
      if (end.charCodeAt(0) < c.charCodeAt(0)) return null;
      for (let k = c.charCodeAt(0); k <= end.charCodeAt(0); k++) chars.add(String.fromCharCode(k));
      i += 2;
    } else {
      chars.add(c);
    }
  }
  return [...chars].join('');
}

/**
 * Parse a STRUCTURED pattern into literal and named-group segments.
 * Supported: literals, and named groups `(?<name>...)` where
 *   - `random*` groups are `[class]{n}` or `\d{n}` (filled with random characters),
 *   - a `checksum` group is `[class]{n}` or `\d{n}` (filled with the check characters),
 *   - any other name is a caller attribute; its body is any regular expression
 *     the supplied value must fully match.
 */
export function parsePattern(pattern) {
  const segments = [];
  let i = 0;
  let src = pattern;
  if (src.startsWith('^')) src = src.slice(1);
  if (src.endsWith('$') && !src.endsWith('\\$')) src = src.slice(0, -1);

  while (i < src.length) {
    if (src.startsWith('(?<', i)) {
      const close = src.indexOf('>', i);
      if (close < 0) throw badRequest('pattern has an unterminated group name');
      const name = src.slice(i + 3, close);
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) throw badRequest(`invalid group name "${name}"`);
      let depth = 1;
      let j = close + 1;
      for (; j < src.length && depth > 0; j++) {
        if (src[j] === '\\') { j++; continue; }
        if (src[j] === '(') depth++;
        if (src[j] === ')') depth--;
      }
      if (depth !== 0) throw badRequest(`group "${name}" is not closed`);
      const body = src.slice(close + 1, j - 1);
      let kind = 'attribute';
      if (/^random/i.test(name)) kind = 'random';
      else if (name === 'checksum') kind = 'checksum';

      if (kind !== 'attribute') {
        const m = /^(\\d|\[[^\]]+\])\{(\d{1,3})\}$/.exec(body);
        if (!m) throw badRequest(`group "${name}" must be a character class with a fixed length, e.g. [0-9]{4}`);
        const charset = expandClass(m[1]);
        if (!charset || charset.length < (kind === 'random' ? 2 : 1)) {
          throw badRequest(`group "${name}" has an unsupported character class`);
        }
        segments.push({ kind, name, charset, length: Number(m[2]) });
      } else {
        segments.push({ kind, name, body });
      }
      i = j;
    } else if (src[i] === '\\') {
      const e = src[i + 1];
      if (e === undefined || /[A-Za-z0-9]/.test(e)) throw badRequest('pattern escapes outside named groups must be literal characters');
      segments.push({ kind: 'literal', value: e });
      i += 2;
    } else if ('[](){}*+?|.^$'.includes(src[i])) {
      throw badRequest(`pattern construct "${src[i]}" is only supported inside named groups`);
    } else {
      segments.push({ kind: 'literal', value: src[i] });
      i++;
    }
  }

  if (segments.filter((s) => s.kind === 'checksum').length > 1) {
    throw badRequest('pattern may contain at most one checksum group');
  }
  if (!segments.some((s) => s.kind !== 'literal')) {
    throw badRequest('pattern must contain at least one named group');
  }
  return segments;
}

/**
 * Names of named groups in textual order (used for validation of arbitrary patterns).
 */
export function groupOrder(pattern) {
  return [...pattern.matchAll(/\(\?<([A-Za-z][A-Za-z0-9_]*)>/g)].map((m) => m[1]);
}

async function generateStructured(req, collector) {
  if (!req.pattern) throw badRequest('pattern is required for STRUCTURED mode');
  const segments = parsePattern(req.pattern);
  const allow = structuredAttributeAllowlist();
  const attributes = req.attributes || {};

  for (const name of Object.keys(attributes)) {
    if (!segments.some((s) => s.kind === 'attribute' && s.name === name)) {
      throw badRequest(`attribute "${name}" is not referenced by the pattern`);
    }
  }

  const checksumSeg = segments.find((s) => s.kind === 'checksum');
  let algorithm = 'NONE';
  if (checksumSeg) {
    algorithm = req.checksum || DEFAULT_CHECKSUM;
    if (algorithm === 'NONE') throw badRequest('pattern has a checksum group but checksum is NONE');
    if (checksumInfo(algorithm).length !== checksumSeg.length) {
      throw badRequest(`checksum group length must be ${checksumInfo(algorithm).length} for ${algorithm}`);
    }
  } else if (req.checksum && req.checksum !== 'NONE') {
    throw badRequest('checksum requires a (?<checksum>...) group in the pattern');
  }

  const hasRandom = segments.some((s) => s.kind === 'random');
  const attempts = checksumSeg && hasRandom ? 64 : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    let out = '';
    let checkInput = '';
    for (const seg of segments) {
      if (seg.kind === 'literal') {
        out += seg.value;
      } else if (seg.kind === 'random') {
        const charset = req.excludeAmbiguous
          ? [...seg.charset].filter((c) => !AMBIGUOUS.has(c)).join('')
          : seg.charset;
        const v = await randomString(seg.length, charset, collector);
        out += v;
        checkInput += v;
      } else if (seg.kind === 'attribute') {
        if (!allow.has(seg.name)) {
          throw badRequest(
            `attribute "${seg.name}" is not permitted in STRUCTURED identifiers; ` +
            'UINs must not embed personal data (allowed: ' + [...allow].join(', ') + ')'
          );
        }
        const raw = attributes[seg.name];
        if (raw === undefined || raw === null || typeof raw === 'object') {
          throw badRequest(`attributes.${seg.name} is required by the pattern`);
        }
        const v = String(raw);
        if (!safeFullMatch(seg.body, v)) throw badRequest(`attributes.${seg.name} does not match its pattern group`);
        out += v;
        checkInput += v;
      } else {
        let check;
        try {
          check = computeCheck(algorithm, checkInput.toUpperCase());
        } catch (err) {
          throw badRequest(err.message);
        }
        if (![...check].every((c) => seg.charset.includes(c))) {
          out = null;
          break;
        }
        out += check;
      }
    }
    if (out === null) continue;
    if (!safeFullMatch(req.pattern.replace(/^\^/, '').replace(/(?<!\\)\$$/, ''), out)) {
      throw badRequest('generated value does not satisfy the pattern');
    }
    if (out.length > 128) throw badRequest('generated value exceeds 128 characters');
    return { uin: out, checksum: algorithm };
  }
  throw badRequest(`checksum algorithm ${algorithm} cannot produce a character allowed by the checksum group`);
}

// ─── SECTOR tokens ───────────────────────────────────────────────────────────

export function resolveSector(input) {
  const config = getConfig();
  const code = String(input).trim().toLowerCase();
  if (!config.supportedSectors.includes(code)) {
    throw badRequest(`unsupported sector "${String(input).slice(0, 32)}"`);
  }
  return code;
}

export function canonicalize(value) {
  return String(value).replace(/[\s.\-_]/g, '').toUpperCase();
}

/**
 * Deterministic, unlinkable sector token: HMAC-SHA256 keyed per sector over the
 * canonical foundational UIN, expanded in counter mode and mapped onto the
 * charset by rejection sampling. The base UIN is never logged or returned.
 */
function deriveSectorBody(baseUin, sector, length, charset) {
  const secrets = { ...getConfig().sectorSecrets, ...getSectorSecrets() };
  const key = secrets[sector];
  if (!key) throw new OsiaError(500, `no key is provisioned for sector ${sector}`);
  const n = charset.length;
  const limit = 256 - (256 % n);
  let out = '';
  for (let counter = 0; out.length < length; counter++) {
    if (counter > 1024) throw new OsiaError(500, 'sector token derivation did not converge');
    const block = crypto
      .createHmac('sha256', key)
      .update(`osia-uin-sector-token/v1\u0000${sector}\u0000${baseUin}\u0000${counter}`)
      .digest();
    for (const b of block) {
      if (b < limit) out += charset[b % n];
      if (out.length === length) break;
    }
  }
  return out;
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Generate one identifier from an OSIA GenerateRequest (already schema-validated).
 * @returns {Promise<{uin: string, mode: string, checksum: string, sector?: string, entropy?: object}>}
 */
export async function generateIdentifier(req, collector = new EntropyCollector()) {
  const mode = req.mode;

  if (mode !== 'SECTOR' && (req.sector !== undefined || req.baseUIN !== undefined)) {
    throw badRequest('sector and baseUIN are only valid in SECTOR mode');
  }
  if (mode !== 'STRUCTURED' && (req.pattern !== undefined || req.attributes !== undefined)) {
    throw badRequest('pattern and attributes are only valid in STRUCTURED mode');
  }

  if (mode === 'STRUCTURED') {
    const r = await generateStructured(req, collector);
    if (req.length !== undefined && req.length !== r.uin.length) {
      throw badRequest(`pattern produces ${r.uin.length} characters but length is ${req.length}`);
    }
    return { ...r, mode, entropy: collector.provenance() };
  }

  const length = req.length ?? DEFAULT_LENGTH;
  const algorithm = req.checksum || DEFAULT_CHECKSUM;
  const info = checksumInfo(algorithm);
  const charsetName = req.charset || 'ALPHANUMERIC';
  if (info.digitsOnly && charsetName !== 'NUMERIC') {
    throw badRequest(`${algorithm} requires the NUMERIC charset`);
  }
  const bodyLength = length - info.length;
  if (bodyLength < 1) throw badRequest(`length must exceed the ${info.length} check character(s) of ${algorithm}`);
  const charset = charsetFor(charsetName, req.excludeAmbiguous === true);

  let body;
  let sector;
  if (mode === 'SECTOR') {
    if (!req.sector || !req.baseUIN) throw badRequest('sector and baseUIN are required for SECTOR mode');
    sector = resolveSector(req.sector);
    const base = canonicalize(req.baseUIN);
    if (!base) throw badRequest('baseUIN must not be empty');
    body = deriveSectorBody(base, sector, bodyLength, charset);
  } else {
    body = await randomString(bodyLength, charset, collector);
  }

  const uin = body + computeCheck(algorithm, body);
  return { uin, mode, checksum: algorithm, sector, entropy: collector.provenance() };
}

export function integrityHash(uin) {
  return computeUinHash(uin, process.env.UIN_HASH_SALT || '');
}
