/**
 * Unit tests for the OSIA v2 engine (no database required).
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mod37_2, mod97_10, luhn, damm, computeCheck, verifyCheck } from '../src/osia/checksum.mjs';
import {
  generateIdentifier, parsePattern, resolveLifecycle, setEntropySource, EntropyCollector, CHARSETS, canonicalize
} from '../src/osia/generator.mjs';
import { safeFullMatch } from '../src/osia/safeRegex.mjs';
import { groupUin } from '../src/osia/formats.mjs';
import { getSpec } from '../src/osia/spec.mjs';
import { computeIso7064 } from '../src/checksum.mjs';

describe('check-character algorithms (vectors cross-checked with python-stdnum)', () => {
  const vectors = [
    [mod37_2, 'G123498654321', 'H'], [mod37_2, 'ABC123', 'G'], [mod37_2, 'A0B1C2D3E4F5G6H7J8K', '8'],
    [mod37_2, '00000000', '1'], [mod37_2, 'ZZZZZZZZ', 'M'], [mod37_2, '1', '*'],
    [mod97_10, '3214282912345698765432161182', '95'], [mod97_10, '123456', '76'],
    [mod97_10, 'ABCDEF12345', '97'], [mod97_10, '00', '98'],
    [luhn, '7992739871', '3'], [luhn, '12345', '5'], [luhn, '0', '0'],
    [damm, '572', '4'], [damm, '12345', '9'], [damm, '0', '0']
  ];
  for (const [fn, input, expected] of vectors) {
    test(`${fn.name}(${input}) = ${expected}`, () => assert.equal(fn(input), expected));
  }

  test('ISO7064 is an alias of ISO7064_MOD37_2', () => {
    assert.equal(computeCheck('ISO7064', 'G123498654321'), 'H');
  });

  test('verifyCheck detects single-character substitutions', () => {
    for (const alg of ['ISO7064_MOD37_2', 'ISO7064_MOD97_10', 'LUHN', 'DAMM']) {
      const body = alg === 'LUHN' || alg === 'DAMM' ? '4111111111111' : 'ABCDEF123456';
      const value = body + computeCheck(alg, body);
      assert.ok(verifyCheck(alg, value), `${alg} accepts its own output`);
      const tampered = (value[0] === '4' ? '5' : value[0] === 'A' ? 'B' : 'A') + value.slice(1);
      assert.ok(!verifyCheck(alg, tampered), `${alg} rejects a substituted character`);
    }
  });

  test('LUHN and DAMM reject non-digits', () => {
    assert.throws(() => luhn('12A4'), RangeError);
    assert.throws(() => damm('12A4'), RangeError);
  });

  test('legacy ISO 7064 helper never emits "undefined"', () => {
    for (let i = 0; i < 2000; i++) {
      const c = computeIso7064(Math.random().toString(36).slice(2, 12).toUpperCase());
      assert.match(c, /^[0-9A-Z*]$/);
    }
  });
});

describe('generation', () => {
  afterEach(() => setEntropySource(null));

  for (const charset of Object.keys(CHARSETS)) {
    test(`RANDOM ${charset} honours length, charset and ISO7064_MOD37_2`, async () => {
      const r = await generateIdentifier({ mode: 'RANDOM', charset, length: 24 });
      assert.equal(r.uin.length, 24);
      for (const c of r.uin.slice(0, -1)) assert.ok(CHARSETS[charset].includes(c));
      assert.ok(verifyCheck('ISO7064_MOD37_2', r.uin));
      assert.equal(r.entropy.hardware, false);
    });
  }

  for (const checksum of ['NONE', 'ISO7064', 'ISO7064_MOD37_2', 'ISO7064_MOD97_10', 'LUHN', 'DAMM']) {
    test(`FOUNDATIONAL NUMERIC with ${checksum}`, async () => {
      const r = await generateIdentifier({ mode: 'FOUNDATIONAL', charset: 'NUMERIC', checksum, length: 16 });
      assert.equal(r.uin.length, 16);
      assert.ok(verifyCheck(checksum, r.uin));
      assert.equal(r.checksum, checksum);
    });
  }

  test('excludeAmbiguous removes 0, O, I, 1 from the body', async () => {
    for (let i = 0; i < 50; i++) {
      const r = await generateIdentifier({ mode: 'RANDOM', excludeAmbiguous: true, length: 40, checksum: 'NONE' });
      assert.doesNotMatch(r.uin, /[0OI1l]/);
    }
  });

  test('LUHN requires NUMERIC', async () => {
    await assert.rejects(generateIdentifier({ mode: 'RANDOM', checksum: 'LUHN' }), { status: 400 });
  });

  test('random draws are unbiased across a 36-symbol alphabet (chi-square sanity check)', async () => {
    const counts = new Map();
    const r = await generateIdentifier({ mode: 'RANDOM', length: 128, checksum: 'NONE' });
    let s = r.uin;
    for (let i = 0; i < 80; i++) s += (await generateIdentifier({ mode: 'RANDOM', length: 128, checksum: 'NONE' })).uin;
    for (const c of s) counts.set(c, (counts.get(c) || 0) + 1);
    const expected = s.length / 36;
    const chi = [...CHARSETS.ALPHANUMERIC].reduce((acc, c) => acc + ((counts.get(c) || 0) - expected) ** 2 / expected, 0);
    assert.ok(chi < 80, `chi-square ${chi.toFixed(1)} too high for 35 degrees of freedom`);
  });

  test('provenance is hardware only when every draw was hardware', async () => {
    let call = 0;
    setEntropySource(async (n) => {
      call++;
      return { bytes: Buffer.alloc(n, 7), hardware: call === 1, source: call === 1 ? 'Test TRNG' : 'Node.js CSPRNG', fipsLevel: 3 };
    });
    const c = new EntropyCollector();
    await c.bytes(4);
    await c.bytes(4);
    assert.deepEqual(c.provenance(), { hardware: false, source: 'Test TRNG + Node.js CSPRNG', fipsLevel: null });
  });

  test('hardware provenance carries the FIPS level', async () => {
    setEntropySource(async (n) => ({ bytes: Buffer.from(Array.from({ length: n }, (_, i) => i % 200)), hardware: true, source: 'Test TRNG', fipsLevel: 3 }));
    const r = await generateIdentifier({ mode: 'FOUNDATIONAL' });
    assert.deepEqual(r.entropy, { hardware: true, source: 'Test TRNG', fipsLevel: 3 });
  });

  test('HSM_REQUIRE_HARDWARE refuses software entropy with 503', async () => {
    process.env.HSM_REQUIRE_HARDWARE = 'true';
    try {
      await assert.rejects(generateIdentifier({ mode: 'FOUNDATIONAL' }), { status: 503 });
    } finally {
      delete process.env.HSM_REQUIRE_HARDWARE;
    }
  });

  test('prefetching collector serves many identifiers from one fetch', async () => {
    let fetches = 0;
    setEntropySource(async (n) => { fetches++; return { bytes: (await import('crypto')).randomBytes(n), hardware: false, source: 'Node.js CSPRNG' }; });
    const c = new EntropyCollector({ prefetch: 65536 });
    for (let i = 0; i < 200; i++) await generateIdentifier({ mode: 'FOUNDATIONAL' }, c);
    assert.equal(fetches, 1);
  });
});

describe('SECTOR tokens', () => {
  test('are deterministic per (baseUIN, sector) and differ across sectors', async () => {
    const a = await generateIdentifier({ mode: 'SECTOR', sector: 'health', baseUIN: 'ABCD-1234-EFGH-5678' });
    const b = await generateIdentifier({ mode: 'SECTOR', sector: 'HEALTH', baseUIN: 'abcd1234efgh5678' });
    const c = await generateIdentifier({ mode: 'SECTOR', sector: 'tax', baseUIN: 'ABCD1234EFGH5678' });
    assert.equal(a.uin, b.uin);
    assert.notEqual(a.uin, c.uin);
    assert.equal(a.sector, 'health');
    assert.equal(a.entropy, undefined);
    assert.ok(!a.uin.includes('ABCD1234'));
  });

  test('require sector and baseUIN, reject unknown sectors', async () => {
    await assert.rejects(generateIdentifier({ mode: 'SECTOR', sector: 'health' }), { status: 400 });
    await assert.rejects(generateIdentifier({ mode: 'SECTOR', sector: 'astrology', baseUIN: 'X1' }), { status: 400 });
    await assert.rejects(generateIdentifier({ mode: 'RANDOM', sector: 'health' }), { status: 400 });
  });

  test('canonicalize strips display separators', () => {
    assert.equal(canonicalize(' ab-cd.ef_gh 12 '), 'ABCDEFGH12');
  });
});

describe('STRUCTURED patterns', () => {
  const pattern = '(?<regionCode>[A-Z]{2})-(?<registrationYear>[0-9]{4})-(?<random>[0-9]{6})-(?<checksum>[0-9]{1})';

  test('embed permitted attributes, random digits and a LUHN check digit', async () => {
    const numeric = '(?<registrationYear>[0-9]{4})-(?<random>[0-9]{6})-(?<checksum>[0-9]{1})';
    for (let i = 0; i < 20; i++) {
      const r = await generateIdentifier({ mode: 'STRUCTURED', pattern: numeric, checksum: 'LUHN', attributes: { registrationYear: 2026 } });
      assert.match(r.uin, /^2026-\d{6}-\d$/);
      const [year, rand, check] = r.uin.split('-');
      assert.equal(luhn(year + rand), check);
      assert.equal(r.checksum, 'LUHN');
    }
  });

  test('LUHN over alphabetic attributes is rejected', async () => {
    await assert.rejects(
      generateIdentifier({ mode: 'STRUCTURED', pattern, checksum: 'LUHN', attributes: { regionCode: 'NW', registrationYear: 2026 } }),
      { status: 400 }
    );
  });

  test('default ISO7064_MOD37_2 check character satisfies a [0-9] checksum group', async () => {
    const r = await generateIdentifier({ mode: 'STRUCTURED', pattern, attributes: { regionCode: 'NW', registrationYear: '2026' } });
    const [region, year, rand, check] = r.uin.split('-');
    assert.equal(mod37_2(region + year + rand), check);
  });

  test('refuse personal attributes', async () => {
    await assert.rejects(
      generateIdentifier({ mode: 'STRUCTURED', pattern: '(?<dateOfBirth>[0-9]{8})-(?<random>[0-9]{4})', attributes: { dateOfBirth: '19841119' } }),
      (err) => err.status === 400 && /must not embed personal data/.test(err.message)
    );
  });

  test('reject unreferenced attributes and missing values', async () => {
    await assert.rejects(generateIdentifier({ mode: 'STRUCTURED', pattern: '(?<random>[0-9]{4})', attributes: { regionCode: 'NW' } }), { status: 400 });
    await assert.rejects(generateIdentifier({ mode: 'STRUCTURED', pattern: '(?<regionCode>[A-Z]{2})(?<random>[0-9]{4})', attributes: {} }), { status: 400 });
  });

  test('reject unsupported constructs and length mismatches', () => {
    assert.throws(() => parsePattern('[A-Z]+'), { status: 400 });
    assert.throws(() => parsePattern('(?<random>[A-Z]+)'), { status: 400 });
    assert.throws(() => parsePattern('(?<random>[^A-Z]{3})'), { status: 400 });
  });

  test('length must match the pattern when supplied', async () => {
    await assert.rejects(generateIdentifier({ mode: 'STRUCTURED', pattern: '(?<random>[0-9]{4})', length: 5 }), { status: 400 });
  });
});

describe('lifecycle claims', () => {
  const now = new Date('2026-11-25T12:00:00Z');

  test('default to an infinite lifetime', () => {
    const lc = resolveLifecycle({ mode: 'RANDOM' }, now);
    assert.equal(lc.infiniteLifetime, true);
    assert.equal(lc.expiresAt, null);
  });

  test('ttlMinutes sets expiresAt', () => {
    const lc = resolveLifecycle({ mode: 'RANDOM', lifecycle: { ttlMinutes: 60 } }, now);
    assert.equal(lc.expiresAt, '2026-11-25T13:00:00.000Z');
    assert.equal(lc.infiniteLifetime, false);
  });

  test('reject conflicting or impossible claims', () => {
    assert.throws(() => resolveLifecycle({ issuer: 'a', lifecycle: { issuer: 'b' } }, now), { status: 400 });
    assert.throws(() => resolveLifecycle({ expiry: '2027-01-01T00:00:00Z', lifecycle: { ttlMinutes: 5 } }, now), { status: 400 });
    assert.throws(() => resolveLifecycle({ lifecycle: { ttlMinutes: 5, infiniteLifetime: true } }, now), { status: 400 });
    assert.throws(() => resolveLifecycle({ expiry: '2020-01-01T00:00:00Z' }, now), { status: 400 });
    assert.throws(() => resolveLifecycle({ not_before: '2027-02-01T00:00:00Z', expiry: '2027-01-01T00:00:00Z' }, now), { status: 400 });
  });
});

describe('safe regular expressions', () => {
  test('time out catastrophic backtracking', () => {
    const t = Date.now();
    assert.throws(() => safeFullMatch('(a+)+b', 'a'.repeat(40)), { status: 400 });
    assert.ok(Date.now() - t < 1000);
  });

  test('reject invalid expressions', () => {
    assert.throws(() => safeFullMatch('(', 'x'), { status: 400 });
  });
});

describe('display grouping', () => {
  test('repeats the last segment length', () => {
    assert.equal(groupUin('ABCDEFGHIJKLMNOPQRS', [4], '-'), 'ABCD-EFGH-IJKL-MNOP-QRS');
    assert.equal(groupUin('ABCDEFGHIJKLMNOPQRS', [5, 4, 4, 4, 2], '.'), 'ABCDE.FGHI.JKLM.NOPQ.RS');
    assert.equal(groupUin('ABCDEFGHIJ', [3], ' ', 'UIN ', '!'), 'UIN ABC DEF GHI J!');
  });
});

describe('specification', () => {
  test('api/uin.yaml compiles and defines every implemented operation', () => {
    const spec = getSpec();
    const expected = [
      'getHealth', 'getCryptoStatus', 'getModes', 'getSectors', 'generateUIN', 'generate', 'generateBatch', 'validate',
      'getPoolStats', 'peekPool', 'preGenerateUins', 'claimUin', 'assignUin', 'releaseUin', 'updateUinStatus',
      'cleanupPreassignedUins', 'getUin', 'getUinAudit', 'listFormats', 'createFormat', 'getFormat', 'updateFormat', 'deleteFormat'
    ];
    assert.deepEqual([...spec.operations.keys()].sort(), expected.sort());
    for (const op of spec.operations.values()) {
      assert.ok(op.query, `${op.operationId} declares transactionId`);
      assert.ok(op.scopes.length === 1, `${op.operationId} declares one scope`);
    }
  });

  test('schemas are strict', () => {
    const spec = getSpec();
    assert.ok(spec.validateSchema('GenerateRequest', { mode: 'RANDOM', bogus: 1 }));
    assert.equal(spec.validateSchema('GenerateRequest', { mode: 'RANDOM' }), null);
  });
});
