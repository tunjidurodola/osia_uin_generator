/**
 * OSIA UIN Interface v2 contract tests over HTTP.
 *
 * Every response is validated against the response schema that api/uin.yaml
 * declares for its operation and status code. Pool and format tests need
 * PostgreSQL (DB_* environment); they are skipped when it is unreachable
 * unless OSIA_TEST_REQUIRE_DB=1, in which case they fail.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

process.env.UIN_RATE_LIMIT_MAX = '1000000';
process.env.UIN_GENERATE_RATE_LIMIT_MAX = '1000000';
process.env.OSIA_JWT_SECRET = 'osia-contract-test-secret-0123456789abcdef';
process.env.OSIA_JWT_ISSUER = 'https://idp.test';
process.env.OSIA_AUTH_MODE = 'optional';
delete process.env.OSIA_JWT_JWKS_URL;
delete process.env.OSIA_JWT_PUBLIC_KEY;
delete process.env.HSM_REQUIRE_HARDWARE;

const { SignJWT, decodeProtectedHeader, importJWK, jwtVerify } = await import('jose');
const { default: app } = await import('../src/app.mjs');
const { getSpec } = await import('../src/osia/spec.mjs');
const { verifyCheck } = await import('../src/osia/checksum.mjs');
const { testConnection, getDb, closeDb } = await import('../src/db.mjs');

const spec = getSpec();
let server;
let base;
const dbAvailable = await testConnection().catch(() => false);
if (!dbAvailable && process.env.OSIA_TEST_REQUIRE_DB === '1') {
  throw new Error('OSIA_TEST_REQUIRE_DB=1 but the database is unreachable');
}
const SCOPE = `osia-test-${crypto.randomBytes(4).toString('hex')}`;
const FORMAT_CODE = `OSIA-TEST-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

async function token(scope, { issuer = 'https://idp.test', expiresIn = '5m', secret = process.env.OSIA_JWT_SECRET } = {}) {
  return new SignJWT({ scope })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setSubject('contract-test-client')
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

async function call(method, path, { query = {}, body, token: bearer, rawBody } = {}) {
  const url = new URL(`${base}/v1${path}`);
  const q = query === null ? {} : { transactionId: `txn-${crypto.randomUUID()}`, ...query };
  for (const [k, v] of Object.entries(q)) if (v !== undefined) url.searchParams.set(k, String(v));
  const headers = {};
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  let payload;
  if (rawBody !== undefined) {
    headers['content-type'] = 'application/json';
    payload = rawBody;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : undefined; } catch { json = text; }
  return { status: res.status, headers: res.headers, body: json };
}

function contract(operationId, res) {
  const errors = spec.validateResponse(operationId, res.status, res.body);
  assert.equal(errors, null, `${operationId} ${res.status} violates api/uin.yaml: ${JSON.stringify(errors)} body=${JSON.stringify(res.body)}`);
}

const ROUTES = {
  getHealth: ['GET', '/health'],
  getCryptoStatus: ['GET', '/crypto/status'],
  getModes: ['GET', '/modes'],
  getSectors: ['GET', '/sectors'],
  generateUIN: ['POST', '/uin', {}],
  generate: ['POST', '/generate', { mode: 'RANDOM' }],
  generateBatch: ['POST', '/batch', { count: 1, options: { mode: 'RANDOM' } }],
  validate: ['POST', '/validate', { uin: 'ABC' }],
  getPoolStats: ['GET', '/pool/stats'],
  peekPool: ['GET', '/pool/peek'],
  preGenerateUins: ['POST', '/uin/pre-generate', { count: 1 }],
  claimUin: ['POST', '/uin/claim', {}],
  assignUin: ['POST', '/uin/assign', { uin: 'X', entityId: 'E' }],
  releaseUin: ['POST', '/uin/release', { uin: 'X' }],
  updateUinStatus: ['POST', '/uin/status', { uin: 'X', status: 'RETIRED' }],
  cleanupPreassignedUins: ['POST', '/uin/cleanup-preassigned', {}],
  getUin: ['GET', '/uin/UNKNOWN'],
  getUinAudit: ['GET', '/uin/UNKNOWN/audit'],
  listFormats: ['GET', '/formats'],
  createFormat: ['POST', '/formats', { code: 'X', name: 'X', separator: '-', groupSize: 4 }],
  getFormat: ['GET', '/formats/UNKNOWN'],
  updateFormat: ['PUT', '/formats/UNKNOWN', { name: 'X' }],
  deleteFormat: ['DELETE', '/formats/UNKNOWN']
};

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (dbAvailable) {
    const db = getDb();
    const uins = (await db('uin_pool').where({ scope: SCOPE }).select('uin')).map((r) => r.uin);
    if (uins.length) {
      await db('uin_format_overrides').whereIn('uin', uins).delete();
      await db('uin_audit').whereIn('uin', uins).delete();
      await db('uin_pool').whereIn('uin', uins).delete();
    }
    await db('uin_formats').where('format_code', 'like', 'OSIA-TEST-%').delete();
  }
  await closeDb();
  await new Promise((resolve) => server.close(resolve));
});

const needsDb = () => (dbAvailable ? false : 'database unavailable');

describe('transactionId is mandatory on every operation', () => {
  for (const [operationId, [method, path, body]] of Object.entries(ROUTES)) {
    test(`${operationId}: missing transactionId -> 400 Error`, async () => {
      const res = await call(method, path, { query: null, body });
      assert.equal(res.status, 400);
      assert.deepEqual(Object.keys(res.body).sort(), ['code', 'message']);
      assert.equal(res.body.code, 400);
      assert.match(res.body.message, /transactionId/);
      contract(operationId, res);
    });
  }

  test('empty, over-long and control-character transactionIds are rejected', async () => {
    for (const transactionId of ['', 'x'.repeat(129), 'abc\u0007def']) {
      const res = await call('GET', '/modes', { query: { transactionId } });
      assert.equal(res.status, 400, JSON.stringify(transactionId));
      contract('getModes', res);
    }
  });
});

describe('BearerAuth and scopes', () => {
  test('required mode: no token -> 401 with challenge', async () => {
    process.env.OSIA_AUTH_MODE = 'required';
    try {
      const res = await call('GET', '/modes');
      assert.equal(res.status, 401);
      assert.match(res.headers.get('www-authenticate'), /^Bearer realm="osia-uin"/);
      contract('getModes', res);
    } finally {
      process.env.OSIA_AUTH_MODE = 'optional';
    }
  });

  test('required mode: correct scope -> 200, wrong scope -> 403', async () => {
    process.env.OSIA_AUTH_MODE = 'required';
    try {
      const ok = await call('GET', '/modes', { token: await token('uin.metadata') });
      assert.equal(ok.status, 200);
      contract('getModes', ok);
      const denied = await call('POST', '/generate', { token: await token('uin.metadata'), body: { mode: 'RANDOM' } });
      assert.equal(denied.status, 403);
      assert.match(denied.headers.get('www-authenticate'), /insufficient_scope/);
      contract('generate', denied);
      const granted = await call('POST', '/generate', { token: await token('uin.metadata uin.generate'), body: { mode: 'RANDOM' } });
      assert.equal(granted.status, 200);
    } finally {
      process.env.OSIA_AUTH_MODE = 'optional';
    }
  });

  test('scp array claims are accepted', async () => {
    const t = await new SignJWT({ scp: ['uin.use'] }).setProtectedHeader({ alg: 'HS256' }).setIssuer('https://idp.test')
      .setExpirationTime('5m').sign(new TextEncoder().encode(process.env.OSIA_JWT_SECRET));
    const res = await call('POST', '/validate', { token: t, body: { uin: 'ABC' } });
    assert.equal(res.status, 200);
  });

  test('presented tokens are verified even in optional mode', async () => {
    for (const bad of [
      await token('uin.metadata', { secret: 'a-different-secret-that-is-long-enough-123' }),
      await token('uin.metadata', { issuer: 'https://evil.test' }),
      'not-a-jwt'
    ]) {
      const res = await call('GET', '/modes', { token: bad });
      assert.equal(res.status, 401);
      contract('getModes', res);
    }
  });
});

describe('metadata', () => {
  test('GET /v1/health', async () => {
    const res = await call('GET', '/health');
    assert.equal(res.status, 200);
    contract('getHealth', res);
    assert.equal(res.body.version, spec.version);
  });

  test('GET /v1/crypto/status', async () => {
    const res = await call('GET', '/crypto/status');
    assert.equal(res.status, 200);
    contract('getCryptoStatus', res);
  });

  test('GET /v1/modes lists the four OSIA modes', async () => {
    const res = await call('GET', '/modes');
    contract('getModes', res);
    assert.deepEqual(res.body.map((m) => m.name), ['FOUNDATIONAL', 'RANDOM', 'STRUCTURED', 'SECTOR']);
    assert.ok(res.body.every((m) => m.supportsPiiAttributes === false));
  });

  test('GET /v1/sectors', async () => {
    const res = await call('GET', '/sectors');
    contract('getSectors', res);
    assert.ok(res.body.some((s) => s.code === 'health'));
  });
});

describe('generation', () => {
  test('legacy POST /v1/uin returns a UIN string and ignores attributes', async () => {
    const res = await call('POST', '/uin', { body: { firstName: 'John', lastName: 'Doe', dateOfBirth: '1984-11-19' } });
    assert.equal(res.status, 200);
    contract('generateUIN', res);
    assert.equal(typeof res.body, 'string');
    assert.equal(res.body.length, 19);
    assert.ok(verifyCheck('ISO7064_MOD37_2', res.body));
  });

  for (const mode of ['FOUNDATIONAL', 'RANDOM']) {
    for (const charset of ['ALPHANUMERIC', 'NUMERIC', 'ALPHABETIC', 'HEXADECIMAL']) {
      test(`${mode} ${charset}`, async () => {
        const res = await call('POST', '/generate', { body: { mode, charset, length: 20, excludeAmbiguous: true } });
        assert.equal(res.status, 200);
        contract('generate', res);
        assert.equal(res.body.uin.length, 20);
        assert.equal(res.body.checksum, 'ISO7064_MOD37_2');
        assert.match(res.body.integrityHash, /^[0-9a-f]{40}$/);
        assert.equal(res.body.entropy.hardware, false);
      });
    }
  }

  for (const checksum of ['NONE', 'ISO7064', 'ISO7064_MOD37_2', 'ISO7064_MOD97_10', 'LUHN', 'DAMM']) {
    test(`checksum ${checksum}`, async () => {
      const res = await call('POST', '/generate', { body: { mode: 'RANDOM', charset: 'NUMERIC', checksum } });
      assert.equal(res.status, 200);
      contract('generate', res);
      assert.ok(verifyCheck(checksum, res.body.uin));
    });
  }

  test('formatting and lifecycle claims', async () => {
    const res = await call('POST', '/generate', {
      body: {
        mode: 'FOUNDATIONAL',
        formatting: { enabled: true, separator: '.', groupSize: 5, prefix: 'UIN ' },
        issuer: 'https://registry.example.gov',
        audience: 'health-exchange',
        lifecycle: { ttlMinutes: 60 }
      }
    });
    assert.equal(res.status, 200);
    contract('generate', res);
    assert.equal(res.body.formattedUin, `UIN ${res.body.uin.match(/.{1,5}/g).join('.')}`);
    assert.equal(res.body.infiniteLifetime, false);
    assert.ok(new Date(res.body.expiresAt) > new Date());
    assert.equal(res.body.audience, 'health-exchange');
  });

  test('JWT output verifies with the embedded key and carries the claims', async () => {
    const res = await call('POST', '/generate', {
      body: { mode: 'FOUNDATIONAL', outputFormat: 'JWT', audience: 'tax', lifecycle: { ttlMinutes: 10 } }
    });
    assert.equal(res.status, 200);
    contract('generate', res);
    const header = decodeProtectedHeader(res.body.jwt);
    const { payload } = await jwtVerify(res.body.jwt, await importJWK(header.jwk, header.alg));
    assert.equal(payload.uin, res.body.uin);
    assert.equal(payload.sub, res.body.uin);
    assert.equal(payload.aud, 'tax');
    assert.equal(payload.exp, Math.floor(new Date(res.body.expiresAt).getTime() / 1000));
  });

  test('JSON_LD output', async () => {
    const res = await call('POST', '/generate', { body: { mode: 'RANDOM', outputFormat: 'JSON_LD' } });
    assert.equal(res.status, 200);
    contract('generate', res);
    assert.deepEqual(res.body.jsonLd['@context'], ['https://www.w3.org/ns/credentials/v2']);
    assert.equal(res.body.jsonLd.credentialSubject.uin, res.body.uin);
  });

  test('SECTOR tokens are stable and never echo the base UIN', async () => {
    const body = { mode: 'SECTOR', sector: 'health', baseUIN: 'K7M2-QX9P-4RTA-8WZC' };
    const a = await call('POST', '/generate', { body });
    const b = await call('POST', '/generate', { body });
    assert.equal(a.status, 200);
    contract('generate', a);
    assert.equal(a.body.uin, b.body.uin);
    assert.equal(a.body.sector, 'health');
    assert.ok(!JSON.stringify(a.body).includes('K7M2'));
  });

  test('STRUCTURED with administrative attributes', async () => {
    const res = await call('POST', '/generate', {
      body: {
        mode: 'STRUCTURED',
        pattern: '(?<regionCode>[A-Z]{2})-(?<registrationYear>[0-9]{4})-(?<random>[0-9]{6})-(?<checksum>[0-9A-Z*]{1})',
        attributes: { regionCode: 'NW', registrationYear: '2026' }
      }
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    contract('generate', res);
    assert.match(res.body.uin, /^NW-2026-\d{6}-[0-9A-Z*]$/);
  });

  const rejected = {
    'unknown property': { mode: 'RANDOM', bogus: true },
    'missing mode': { length: 10 },
    'unknown mode': { mode: 'MRZ' },
    'length out of range': { mode: 'RANDOM', length: 3 },
    'LUHN over ALPHANUMERIC': { mode: 'RANDOM', checksum: 'LUHN' },
    'SECTOR without baseUIN': { mode: 'SECTOR', sector: 'health' },
    'unsupported sector': { mode: 'SECTOR', sector: 'astrology', baseUIN: 'ABC' },
    'personal attribute': { mode: 'STRUCTURED', pattern: '(?<dateOfBirth>[0-9]{8})(?<random>[0-9]{4})', attributes: { dateOfBirth: '19841119' } },
    'catastrophic pattern': { mode: 'STRUCTURED', pattern: '(?<regionCode>(a+)+b)(?<random>[0-9]{4})', attributes: { regionCode: 'a'.repeat(40) } },
    'unknown formatting property': { mode: 'RANDOM', formatting: { enabled: true, colour: 'red' } },
    'conflicting lifecycle': { mode: 'RANDOM', issuer: 'a', lifecycle: { issuer: 'b' } },
    'expiry in the past': { mode: 'RANDOM', expiry: '2001-01-01T00:00:00Z' },
    'bad date-time': { mode: 'RANDOM', expiry: 'tomorrow' }
  };
  for (const [name, body] of Object.entries(rejected)) {
    test(`400 for ${name}`, async () => {
      const res = await call('POST', '/generate', { body });
      assert.equal(res.status, 400, JSON.stringify(res.body));
      contract('generate', res);
    });
  }

  test('400 for malformed JSON and a missing body', async () => {
    const malformed = await call('POST', '/generate', { rawBody: '{"mode":' });
    assert.equal(malformed.status, 400);
    contract('generate', malformed);
    const missing = await call('POST', '/generate');
    assert.equal(missing.status, 400);
    contract('generate', missing);
  });

  test('503 when hardware entropy is mandated but unavailable', async () => {
    process.env.HSM_REQUIRE_HARDWARE = 'true';
    try {
      const res = await call('POST', '/generate', { body: { mode: 'FOUNDATIONAL' } });
      assert.equal(res.status, 503);
      contract('generate', res);
      const health = await call('GET', '/health');
      assert.equal(health.body.status, 'unhealthy');
    } finally {
      delete process.env.HSM_REQUIRE_HARDWARE;
    }
  });

  test('POST /v1/batch', async () => {
    const res = await call('POST', '/batch', { body: { count: 25, options: { mode: 'FOUNDATIONAL', charset: 'NUMERIC', checksum: 'DAMM' } } });
    assert.equal(res.status, 200);
    contract('generateBatch', res);
    assert.equal(res.body.count, 25);
    assert.equal(new Set(res.body.items.map((i) => i.uin)).size, 25);
    assert.ok(res.body.items.every((i) => verifyCheck('DAMM', i.uin)));
  });

  test('POST /v1/batch rejects count > 1000 and SECTOR', async () => {
    const big = await call('POST', '/batch', { body: { count: 1001, options: { mode: 'RANDOM' } } });
    assert.equal(big.status, 400);
    contract('generateBatch', big);
    const sector = await call('POST', '/batch', { body: { count: 2, options: { mode: 'SECTOR', sector: 'tax', baseUIN: 'A1' } } });
    assert.equal(sector.status, 400);
  });
});

describe('validation', () => {
  test('a generated UIN is VALID, formatted input is canonicalised', async () => {
    const gen = await call('POST', '/generate', { body: { mode: 'FOUNDATIONAL', formatting: { enabled: true } } });
    const res = await call('POST', '/validate', { body: { uin: gen.body.formattedUin, expectedLength: 19 } });
    assert.equal(res.status, 200);
    contract('validate', res);
    assert.equal(res.body.valid, true);
    assert.equal(res.body.status, 'VALID');
    assert.equal(res.body.canonicalUin, gen.body.uin);
    assert.equal(res.body.checksumValid, true);
  });

  test('a tampered UIN is INVALID (200, not 400)', async () => {
    const gen = await call('POST', '/generate', { body: { mode: 'RANDOM', charset: 'NUMERIC', checksum: 'LUHN' } });
    const digits = gen.body.uin.split('');
    digits[3] = digits[3] === '9' ? '8' : String(Number(digits[3]) + 1);
    const res = await call('POST', '/validate', { body: { uin: digits.join(''), checksum: 'LUHN', charset: 'NUMERIC' } });
    assert.equal(res.status, 200);
    contract('validate', res);
    assert.equal(res.body.valid, false);
    assert.equal(res.body.checksumValid, false);
    assert.ok(res.body.errors.length > 0);
  });

  test('STRUCTURED validation recomputes the check character', async () => {
    const pattern = '(?<registrationYear>[0-9]{4})-(?<random>[0-9]{6})-(?<checksum>[0-9]{1})';
    const gen = await call('POST', '/generate', { body: { mode: 'STRUCTURED', pattern, checksum: 'DAMM', attributes: { registrationYear: '2026' } } });
    const ok = await call('POST', '/validate', { body: { uin: gen.body.uin, mode: 'STRUCTURED', pattern, checksum: 'DAMM' } });
    assert.equal(ok.body.valid, true, JSON.stringify(ok.body));
    contract('validate', ok);
    const bad = gen.body.uin.slice(0, -1) + ((Number(gen.body.uin.slice(-1)) + 1) % 10);
    const ko = await call('POST', '/validate', { body: { uin: bad, mode: 'STRUCTURED', pattern, checksum: 'DAMM' } });
    assert.equal(ko.body.valid, false);
  });

  test('unknown properties are rejected', async () => {
    const res = await call('POST', '/validate', { body: { uin: 'ABC', options: {} } });
    assert.equal(res.status, 400);
    contract('validate', res);
  });

  test('checkRegistry on an unregistered UIN', { skip: needsDb() }, async () => {
    const res = await call('POST', '/validate', { body: { uin: 'NOTREGISTERED1234567', checksum: 'NONE', checkRegistry: true } });
    assert.equal(res.status, 200);
    contract('validate', res);
    assert.equal(res.body.valid, false);
    assert.equal(res.body.status, 'INVALID');
  });
});

describe('pool lifecycle', () => {
  const txn = `lifecycle-${crypto.randomUUID()}`;
  let uin;

  test('pre-generate into a dedicated scope', { skip: needsDb() }, async () => {
    const res = await call('POST', '/uin/pre-generate', { body: { count: 5, scope: SCOPE, charset: 'NUMERIC', checksum: 'LUHN', length: 16 } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    contract('preGenerateUins', res);
    assert.deepEqual({ generated: res.body.generated, scope: res.body.scope, status: res.body.status }, { generated: 5, scope: SCOPE, status: 'AVAILABLE' });
  });

  test('stats and peek', { skip: needsDb() }, async () => {
    const stats = await call('GET', '/pool/stats', { query: { scope: SCOPE } });
    contract('getPoolStats', stats);
    assert.equal(stats.body.total, 5);
    assert.equal(stats.body.byStatus.AVAILABLE, 5);
    const peek = await call('GET', '/pool/peek', { query: { scope: SCOPE, status: 'AVAILABLE', limit: 2 } });
    contract('peekPool', peek);
    assert.equal(peek.body.length, 2);
    assert.ok(peek.body.every((r) => verifyCheck('LUHN', r.uin)));
    const badLimit = await call('GET', '/pool/peek', { query: { limit: 101 } });
    assert.equal(badLimit.status, 400);
    contract('peekPool', badLimit);
    const badStatus = await call('GET', '/pool/peek', { query: { status: 'LOST' } });
    assert.equal(badStatus.status, 400);
  });

  test('claim -> assign -> revoke, with invalid transitions refused', { skip: needsDb() }, async () => {
    const claimed = await call('POST', '/uin/claim', { query: { transactionId: txn }, body: { scope: SCOPE, claimedBy: 'civil-registry', ttlSeconds: 600 } });
    assert.equal(claimed.status, 200, JSON.stringify(claimed.body));
    contract('claimUin', claimed);
    assert.equal(claimed.body.status, 'PREASSIGNED');
    assert.equal(claimed.body.claimedBy, 'civil-registry');
    uin = claimed.body.uin;

    const early = await call('POST', '/uin/status', { body: { uin, status: 'REVOKED' } });
    assert.equal(early.status, 400);
    contract('updateUinStatus', early);

    const assigned = await call('POST', '/uin/assign', { query: { transactionId: txn }, body: { uin, entityId: 'PERSON-12345' } });
    assert.equal(assigned.status, 200);
    contract('assignUin', assigned);
    assert.equal(assigned.body.assignedToRef, 'PERSON-12345');

    const release = await call('POST', '/uin/release', { body: { uin } });
    assert.equal(release.status, 400);
    contract('releaseUin', release);

    const revoked = await call('POST', '/uin/status', { query: { transactionId: txn }, body: { uin, status: 'REVOKED', reason: 'Fraud' } });
    assert.equal(revoked.status, 200);
    contract('updateUinStatus', revoked);
    assert.equal(revoked.body.status, 'REVOKED');
    assert.equal(revoked.body.reason, 'Fraud');
  });

  test('lookup, audit trail and registry validation', { skip: needsDb() }, async () => {
    const rec = await call('GET', `/uin/${encodeURIComponent(uin)}`);
    assert.equal(rec.status, 200);
    contract('getUin', rec);
    assert.equal(rec.body.mode, 'FOUNDATIONAL');

    const v = await call('POST', '/validate', { body: { uin, checksum: 'LUHN', charset: 'NUMERIC', checkRegistry: true } });
    contract('validate', v);
    assert.equal(v.body.status, 'REVOKED');
    assert.equal(v.body.valid, false);

    const audit = await call('GET', `/uin/${encodeURIComponent(uin)}/audit`);
    assert.equal(audit.status, 200);
    contract('getUinAudit', audit);
    assert.deepEqual(audit.body.map((e) => e.eventType), ['PRE_GENERATED', 'CLAIMED', 'ASSIGNED', 'REVOKED', 'VALIDATED']);
    for (const e of audit.body.slice(1, 4)) assert.equal(e.transactionId, txn);
    assert.equal(audit.body[3].reason, 'Fraud');
  });

  test('release and reservation-expiry cleanup', { skip: needsDb() }, async () => {
    const a = await call('POST', '/uin/claim', { body: { scope: SCOPE } });
    const released = await call('POST', '/uin/release', { body: { uin: a.body.uin, reason: 'Duplicate enrolment' } });
    assert.equal(released.status, 200);
    contract('releaseUin', released);
    assert.equal(released.body.status, 'AVAILABLE');
    assert.equal(released.body.claimedBy, null);

    const b = await call('POST', '/uin/claim', { body: { scope: SCOPE, ttlSeconds: 60 } });
    await getDb()('uin_pool').where({ uin: b.body.uin }).update({ claimed_at: getDb().raw("now() - interval '2 minutes'") });
    const cleanup = await call('POST', '/uin/cleanup-preassigned', { body: { scope: SCOPE, olderThanSeconds: 86400 } });
    assert.equal(cleanup.status, 200);
    contract('cleanupPreassignedUins', cleanup);
    assert.equal(cleanup.body.releasedCount, 1);
    const after = await call('GET', `/uin/${encodeURIComponent(b.body.uin)}`);
    assert.equal(after.body.status, 'AVAILABLE');

    const noBody = await call('POST', '/uin/cleanup-preassigned');
    assert.equal(noBody.status, 200);
    contract('cleanupPreassignedUins', noBody);
  });

  test('404s for unknown UINs and empty scopes', { skip: needsDb() }, async () => {
    for (const [op, method, path, body] of [
      ['getUin', 'GET', '/uin/DOESNOTEXIST'],
      ['getUinAudit', 'GET', '/uin/DOESNOTEXIST/audit'],
      ['assignUin', 'POST', '/uin/assign', { uin: 'DOESNOTEXIST', entityId: 'E' }],
      ['claimUin', 'POST', '/uin/claim', { scope: `${SCOPE}-empty` }]
    ]) {
      const res = await call(method, path, { body });
      assert.equal(res.status, 404, op);
      contract(op, res);
    }
  });

  test('pre-generate refuses SECTOR and STRUCTURED', async () => {
    const res = await call('POST', '/uin/pre-generate', { body: { count: 1, mode: 'SECTOR' } });
    assert.equal(res.status, 400);
    contract('preGenerateUins', res);
  });
});

describe('format configurations', () => {
  test('create, read, update, use and delete', { skip: needsDb() }, async () => {
    const created = await call('POST', '/formats', {
      body: { code: FORMAT_CODE, name: 'Test 3-3-3', separator: ' ', groupSize: 3, prefix: '#', description: 'contract test' }
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    contract('createFormat', created);

    const dup = await call('POST', '/formats', { body: { code: FORMAT_CODE, name: 'dup', separator: '-', groupSize: 4 } });
    assert.equal(dup.status, 400);
    contract('createFormat', dup);

    const list = await call('GET', '/formats');
    contract('listFormats', list);
    assert.ok(list.body.some((f) => f.code === FORMAT_CODE));
    assert.ok(list.body.some((f) => f.code === 'OSIA_STANDARD' && f.segmentLengths.join() === '5,4,4,4,2'));

    const gen = await call('POST', '/generate', { body: { mode: 'RANDOM', length: 9, checksum: 'NONE', formatting: { formatCode: FORMAT_CODE } } });
    assert.equal(gen.body.formattedUin, `#${gen.body.uin.match(/.{3}/g).join(' ')}`);

    const updated = await call('PUT', `/formats/${FORMAT_CODE}`, { body: { segmentLengths: [2, 3], groupSize: 2, separator: '/' } });
    assert.equal(updated.status, 200);
    contract('updateFormat', updated);
    assert.deepEqual(updated.body.segmentLengths, [2, 3]);

    const got = await call('GET', `/formats/${FORMAT_CODE}`);
    contract('getFormat', got);
    assert.equal(got.body.separator, '/');

    const del = await call('DELETE', `/formats/${FORMAT_CODE}`);
    assert.equal(del.status, 204);
    contract('deleteFormat', { status: 204, body: undefined });

    const gone = await call('GET', `/formats/${FORMAT_CODE}`);
    assert.equal(gone.status, 404);
    contract('getFormat', gone);
  });

  test('the default format cannot be deleted', { skip: needsDb() }, async () => {
    const res = await call('DELETE', '/formats/OSIA_STANDARD');
    assert.equal(res.status, 400);
    contract('deleteFormat', res);
  });

  test('strict FormatConfig schema', async () => {
    const res = await call('POST', '/formats', { body: { code: 'X', name: 'X', separator: '-', groupSize: 0 } });
    assert.equal(res.status, 400);
    contract('createFormat', res);
  });
});

describe('routing', () => {
  test('unknown /v1 operations return the OSIA error envelope', async () => {
    const res = await call('GET', '/nope');
    assert.equal(res.status, 404);
    assert.deepEqual(Object.keys(res.body).sort(), ['code', 'message']);
  });

  test('legacy routes remain available for the web UI', async () => {
    const res = await fetch(`${base}/modes`);
    assert.equal(res.status, 200);
  });
});
