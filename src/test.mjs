/**
 * Test Suite for UIN Generator
 * Comprehensive tests for all modules and generation modes
 */

import { generateUin, validateUin } from './uinGenerator.mjs';
import { computeModN, computeIso7064, appendChecksum, verifyChecksum } from './checksum.mjs';
import { deriveSectorToken, verifySectorToken, deriveDeterministicSectorToken } from './sectorToken.mjs';
import { getConfig, parseCharset, excludeAmbiguous, CHARSETS } from './config.mjs';
import { HsmClient } from './hsm.mjs';
import { VaultClient } from './vault.mjs';

/**
 * Test utilities
 */
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

function assertNotEqual(actual, unexpected, message) {
  assert(actual !== unexpected, `${message} (should not be: ${unexpected})`);
}

function assertTrue(condition, message) {
  assert(condition === true, message);
}

function assertFalse(condition, message) {
  assert(condition === false, message);
}

function assertThrows(fn, message) {
  testsRun++;
  try {
    fn();
    testsFailed++;
    console.error(`  ✗ ${message} (expected error but none thrown)`);
  } catch (error) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  }
}

/**
 * Test Checksum Module
 */
function testChecksumModule() {
  console.log('\n=== Testing Checksum Module ===\n');

  // Test computeModN
  console.log('Testing computeModN:');
  assertEqual(computeModN('12345', 10), '5', 'Mod 10 checksum of 12345');
  assertEqual(computeModN('ABC', 10), '3', 'Mod 10 checksum of ABC');
  assertThrows(() => computeModN('', 10), 'Empty string should throw');
  assertThrows(() => computeModN('123', 100), 'Invalid modulus should throw');

  // Test computeIso7064
  console.log('\nTesting computeIso7064:');
  const iso1 = computeIso7064('ABC123');
  assertTrue(iso1.length === 1, 'ISO 7064 checksum should be 1 character');
  assertTrue(/[0-9A-Z]/.test(iso1), 'ISO 7064 checksum should be alphanumeric');
  assertThrows(() => computeIso7064(''), 'Empty string should throw');

  // Test appendChecksum
  console.log('\nTesting appendChecksum:');
  const result1 = appendChecksum('ABC123', { algorithm: 'modN' });
  assertEqual(result1.value.length, 7, 'Checksum should append 1 character');
  assertTrue(result1.value.startsWith('ABC123'), 'Base should be preserved');
  assertEqual(result1.checksum.length, 1, 'Checksum should be 1 character');

  // Test verifyChecksum
  console.log('\nTesting verifyChecksum:');
  const testValue = 'ABC123';
  const withChecksum = appendChecksum(testValue, { algorithm: 'modN' });
  assertTrue(
    verifyChecksum(withChecksum.value, { algorithm: 'modN', checksumLength: 1 }),
    'Valid checksum should verify'
  );
  assertFalse(
    verifyChecksum(withChecksum.value.slice(0, -1) + 'X', { algorithm: 'modN', checksumLength: 1 }),
    'Invalid checksum should not verify'
  );
}

/**
 * Test Sector Token Module
 */
function testSectorTokenModule() {
  console.log('\n=== Testing Sector Token Module ===\n');

  const config = getConfig();
  const testUin = 'ABC123DEF456GHI789';
  const testSector = 'health';

  console.log('Testing deriveSectorToken:');

  // Test basic derivation
  const token1 = deriveSectorToken(testUin, testSector, {}, config.sectorSecrets);
  assertTrue(token1.token.length === 20, 'Default token length should be 20');
  assertTrue(token1.metadata.sector === testSector, 'Sector should be preserved');
  assertTrue(token1.metadata.algorithm === 'sha256', 'Default algorithm should be sha256');

  // Test different sectors produce different tokens
  const token2 = deriveSectorToken(testUin, 'finance', {}, config.sectorSecrets);
  assertNotEqual(token1.token, token2.token, 'Different sectors should produce different tokens');

  // Test custom token length
  const token3 = deriveSectorToken(testUin, testSector, { tokenLength: 16 }, config.sectorSecrets);
  assertEqual(token3.token.length, 16, 'Custom token length should be respected');

  // Test deterministic derivation
  console.log('\nTesting deriveDeterministicSectorToken:');
  const detToken1 = deriveDeterministicSectorToken(testUin, testSector, {}, config.sectorSecrets);
  const detToken2 = deriveDeterministicSectorToken(testUin, testSector, {}, config.sectorSecrets);
  assertEqual(detToken1.token, detToken2.token, 'Deterministic tokens should be identical');

  // Test token verification
  console.log('\nTesting verifySectorToken:');
  assertTrue(
    verifySectorToken(token1.token, testUin, testSector, token1.metadata, config.sectorSecrets),
    'Valid token should verify'
  );
  assertFalse(
    verifySectorToken(token1.token + 'X', testUin, testSector, token1.metadata, config.sectorSecrets),
    'Invalid token should not verify'
  );

  // Test error handling
  console.log('\nTesting error handling:');
  assertThrows(
    () => deriveSectorToken('', testSector, {}, config.sectorSecrets),
    'Empty UIN should throw'
  );
  assertThrows(
    () => deriveSectorToken(testUin, '', {}, config.sectorSecrets),
    'Empty sector should throw'
  );
  assertThrows(
    () => deriveSectorToken(testUin, 'invalid_sector', {}, config.sectorSecrets),
    'Invalid sector should throw'
  );
}

/**
 * Test Configuration Module
 */
function testConfigModule() {
  console.log('\n=== Testing Configuration Module ===\n');

  console.log('Testing parseCharset:');
  assertEqual(parseCharset('numeric'), CHARSETS.NUMERIC, 'Parse numeric charset');
  assertEqual(parseCharset('A-Z0-9'), CHARSETS.ALPHANUMERIC, 'Parse alphanumeric pattern');
  assertEqual(parseCharset('ABCDEF'), 'ABCDEF', 'Parse custom charset');

  console.log('\nTesting excludeAmbiguous:');
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const safe = excludeAmbiguous(charset);
  assertFalse(safe.includes('0'), 'Should exclude 0');
  assertFalse(safe.includes('O'), 'Should exclude O');
  assertFalse(safe.includes('I'), 'Should exclude I');
  assertFalse(safe.includes('1'), 'Should exclude 1');

  console.log('\nTesting getConfig:');
  const config = getConfig();
  assertTrue(config.defaultLength >= 8, 'Default length should be at least 8');
  assertTrue(config.defaultCharset.length > 0, 'Default charset should not be empty');
  assertTrue(Array.isArray(config.supportedSectors), 'Supported sectors should be array');
  assertTrue(Object.keys(config.sectorSecrets).length > 0, 'Sector secrets should be configured');
}

/**
 * Test UIN Generator - Random Mode
 */
function testRandomMode() {
  console.log('\n=== Testing Random Mode ===\n');

  console.log('Testing basic random generation:');
  const uin1 = generateUin({ mode: 'random', length: 16, charset: 'A-Z0-9' });
  assertEqual(uin1.mode, 'random', 'Mode should be random');
  assertEqual(uin1.value.length, 16, 'Length should be 16');
  assertTrue(/^[A-Z0-9]+$/.test(uin1.value), 'Should match charset');

  // Test multiple generations are unique
  const uin2 = generateUin({ mode: 'random', length: 16, charset: 'A-Z0-9' });
  assertNotEqual(uin1.value, uin2.value, 'Multiple generations should be unique');

  // Test with checksum
  console.log('\nTesting random with checksum:');
  const uin3 = generateUin({
    mode: 'random',
    length: 16,
    checksum: { enabled: true, algorithm: 'modN' }
  });
  assertEqual(uin3.value.length, 17, 'Length should include checksum');
  assertTrue(uin3.checksum.used, 'Checksum should be used');
}

/**
 * Test UIN Generator - Foundational Mode
 */
function testFoundationalMode() {
  console.log('\n=== Testing Foundational Mode ===\n');

  console.log('Testing basic foundational generation:');
  const uin1 = generateUin({ mode: 'foundational', length: 19 });
  assertEqual(uin1.mode, 'foundational', 'Mode should be foundational');
  assertTrue(uin1.value.length >= 19, 'Length should be at least 19');
  assertTrue(uin1.properties.highEntropy, 'Should have high entropy');
  assertTrue(uin1.properties.noPii, 'Should have no PII');

  // Test with ISO 7064 checksum
  console.log('\nTesting foundational with ISO 7064 checksum:');
  const uin2 = generateUin({
    mode: 'foundational',
    length: 19,
    checksum: { enabled: true, algorithm: 'iso7064' }
  });
  assertTrue(uin2.checksum.used, 'Checksum should be used');
  assertEqual(uin2.checksum.algorithm, 'iso7064', 'Should use ISO 7064');

  // Test exclude ambiguous
  console.log('\nTesting foundational with exclude ambiguous:');
  const uin3 = generateUin({
    mode: 'foundational',
    length: 20,
    excludeAmbiguous: true
  });
  assertFalse(uin3.value.includes('0'), 'Should not contain 0');
  assertFalse(uin3.value.includes('O'), 'Should not contain O');
}

/**
 * Test UIN Generator - Structured Mode
 */
function testStructuredMode() {
  console.log('\n=== Testing Structured Mode ===\n');

  console.log('Testing basic structured generation:');
  const uin1 = generateUin({
    mode: 'structured',
    template: 'RR-YYYY-FFF-NNNNN',
    values: {
      R: '12',
      Y: '2025',
      F: '043'
    },
    randomSegments: {
      N: { length: 5, charset: '0-9' }
    }
  });
  assertEqual(uin1.mode, 'structured', 'Mode should be structured');
  assertTrue(uin1.value.startsWith('12-2025-043-'), 'Should match template prefix');
  assertTrue(uin1.value.match(/^\d{2}-\d{4}-\d{3}-\d{5}$/) !== null, 'Should match template pattern');
  assertTrue(uin1.rawComponents.R === '12', 'Region component should be preserved');

  // Test with checksum
  console.log('\nTesting structured with checksum:');
  const uin2 = generateUin({
    mode: 'structured',
    template: 'AA-NNNNNN',
    values: { A: '01' },
    randomSegments: { N: { length: 6, charset: '0-9' } },
    checksum: { enabled: true, algorithm: 'modN' }
  });
  assertTrue(uin2.checksum.used, 'Checksum should be used');

  // Test error handling
  console.log('\nTesting error handling:');
  assertThrows(
    () => generateUin({ mode: 'structured' }),
    'Missing template should throw'
  );
}

/**
 * Test UIN Generator - Sector Token Mode
 */
function testSectorTokenMode() {
  console.log('\n=== Testing Sector Token Mode ===\n');

  const foundationalUin = generateUin({ mode: 'foundational', length: 19 }).value;

  console.log('Testing sector token generation:');
  const token1 = generateUin({
    mode: 'sector_token',
    foundationalUin: foundationalUin,
    sector: 'health',
    tokenLength: 20
  });
  assertEqual(token1.mode, 'sector_token', 'Mode should be sector_token');
  assertEqual(token1.sector, 'health', 'Sector should be health');
  assertEqual(token1.value.length, 20, 'Token length should be 20');
  assertTrue(token1.properties.unlinkable, 'Should be unlinkable');

  // Test different sectors
  const token2 = generateUin({
    mode: 'sector_token',
    foundationalUin: foundationalUin,
    sector: 'finance',
    tokenLength: 20
  });
  assertNotEqual(token1.value, token2.value, 'Different sectors should produce different tokens');

  // Test error handling
  console.log('\nTesting error handling:');
  assertThrows(
    () => generateUin({ mode: 'sector_token', sector: 'health' }),
    'Missing foundational UIN should throw'
  );
  assertThrows(
    () => generateUin({ mode: 'sector_token', foundationalUin: 'ABC123' }),
    'Missing sector should throw'
  );
}

/**
 * Test UIN Validation
 */
function testValidation() {
  console.log('\n=== Testing UIN Validation ===\n');

  // Generate UIN with checksum
  const uin = generateUin({
    mode: 'foundational',
    length: 19,
    checksum: { enabled: true, algorithm: 'modN' }
  });

  console.log('Testing validation:');
  const result1 = validateUin(uin.value, {
    checksum: { enabled: true, algorithm: 'modN', length: 1 }
  });
  assertTrue(result1.valid, 'Valid UIN should pass validation');

  // Test invalid UIN
  const result2 = validateUin('ABC', {});
  assertFalse(result2.valid, 'Short UIN should fail validation');

  // Test invalid checksum
  const invalidUin = uin.value.slice(0, -1) + 'X';
  const result3 = validateUin(invalidUin, {
    checksum: { enabled: true, algorithm: 'modN', length: 1 }
  });
  assertFalse(result3.valid, 'Invalid checksum should fail validation');
}

/**
 * ============================================
 * HSM module tests
 * ============================================
 */
function testHsmRemotePin() {
  console.log('\n=== Testing HSM Module (remote TRNG PIN handling) ===\n');

  console.log('Testing _remoteRandomBytesSync does not leak PIN via argv:');
  const client = new HsmClient();
  client.configureRemoteTrng({
    enabled: true,
    slot: '5',
    pin: 'TEST_PIN_ARGV_LEAK_CANARY',
    sshHost: 'test.example',
    sshModule: '/tmp/fake.so'
  });
  const calls = [];
  const fakeSpawn = (cmd, args, opts) => {
    calls.push({ cmd, args, input: opts.input });
    return { status: 0, stdout: Buffer.alloc(16, 0xAA), stderr: Buffer.alloc(0) };
  };
  const out = client._remoteRandomBytesSync(16, fakeSpawn);
  assertEqual(calls.length, 1, 'spawn called once');
  assertEqual(calls[0].cmd, 'ssh', 'Command is ssh');
  const argvJoined = calls[0].args.join(' ');
  assertTrue(
    !argvJoined.includes('TEST_PIN_ARGV_LEAK_CANARY'),
    'PIN does not appear in ssh argv'
  );
  assertEqual(calls[0].input, 'TEST_PIN_ARGV_LEAK_CANARY', 'PIN passed via stdin');
  assertTrue(
    argvJoined.includes('--pin env:PKCS11_PIN'),
    'Remote invocation uses --pin env:PKCS11_PIN'
  );
  assertEqual(out.length, 16, 'Returns requested length');

  console.log('\nTesting slot injection rejection:');
  const badClient = new HsmClient();
  badClient.configureRemoteTrng({
    enabled: true,
    slot: '5; rm -rf /',
    pin: 'pin',
    sshHost: 'h',
    sshModule: '/x.so'
  });
  let threw = false;
  try {
    badClient._remoteRandomBytesSync(8, fakeSpawn);
  } catch (e) {
    threw = true;
    assertTrue(/Invalid TRNG slot/.test(e.message), 'Throws on injected slot');
  }
  assertTrue(threw, 'Should have thrown on injected slot');

  console.log('\nTesting ssh host injection rejection:');
  const badHost = new HsmClient();
  badHost.configureRemoteTrng({
    enabled: true,
    slot: '5',
    pin: 'pin',
    sshHost: 'h; echo owned',
    sshModule: '/x.so'
  });
  threw = false;
  try {
    badHost._remoteRandomBytesSync(8, fakeSpawn);
  } catch (e) {
    threw = true;
    assertTrue(/Invalid HSM_SSH_HOST/.test(e.message), 'Throws on injected ssh host');
  }
  assertTrue(threw, 'Should have thrown on injected ssh host');
}

/**
 * ============================================
 * Vault TLS-skip refuses in production (F-11)
 * ============================================
 */
async function testVaultTlsSkipProductionGuard() {
  console.log('\n=== Testing Vault TLS-skip refuses in production (F-11) ===\n');
  const prevEnv = process.env.NODE_ENV;
  const prevSkip = process.env.VAULT_SKIP_VERIFY;
  process.env.NODE_ENV = 'production';
  process.env.VAULT_SKIP_VERIFY = 'true';
  const client = new VaultClient({ address: 'https://127.0.0.1:8200', token: 'dev-token' });
  let threw = false;
  try {
    await client.request('GET', '/v1/sys/health');
  } catch (e) {
    threw = true;
    assertTrue(
      /VAULT_SKIP_VERIFY is set but NODE_ENV=production/.test(e.message),
      'Production guard message fires'
    );
  }
  assertTrue(threw, 'Production guard must refuse the request');
  process.env.NODE_ENV = prevEnv;
  process.env.VAULT_SKIP_VERIFY = prevSkip;

  console.log('\nTesting Vault token buffer is now 300 s (F-13):');
  const c2 = new VaultClient({ token: 'x' });
  c2.authenticated = true;
  c2.tokenExpiry = Date.now() + 200000; // 200 s left
  assertEqual(c2.isTokenValid(), false, '200 s left must be invalid (buffer is 300 s)');
  c2.tokenExpiry = Date.now() + 400000; // 400 s left
  assertEqual(c2.isTokenValid(), true, '400 s left is still valid');

  console.log('\nTesting auto-renew timer is registered and unref-safe (F-12):');
  const c3 = new VaultClient({ token: 'x' });
  c3.authenticated = true;
  c3.tokenExpiry = Date.now() + 120000;
  c3.startAutoRenew();
  assertTrue(c3._renewTimer !== null && c3._renewTimer !== undefined, 'Renew timer exists');
  c3.stopAutoRenew();
  assertEqual(c3._renewTimer, null, 'Stop clears the timer');
}

/**
 * ============================================
 * UIN generation uses injected HSM bytes (F-28)
 * ============================================
 */
async function testUinHsmBytesInjection() {
  console.log('\n=== Testing UIN generation consumes injected HSM bytes (F-28) ===\n');
  const { generateUin, provideRandomBytes, getProvenance } = await import('./uinGenerator.mjs');

  console.log('Testing provenance reflects injected source:');
  const fakeEntropy = Buffer.alloc(64, 0xAB);
  provideRandomBytes(fakeEntropy, {
    source: 'Utimaco CryptoServer Hardware TRNG (c3)',
    hardware: true,
    fipsLevel: 3,
    provider: 'utimaco-remote'
  });
  const r1 = generateUin({ mode: 'foundational', length: 19 });
  assertEqual(r1.provenance.source, 'Utimaco CryptoServer Hardware TRNG (c3)', 'Provenance source = Utimaco');
  assertEqual(r1.provenance.hardware, true, 'Provenance hardware = true');
  assertEqual(r1.provenance.fipsLevel, 3, 'Provenance fipsLevel = 3');

  console.log('\nTesting next call without inject falls back to CSPRNG provenance:');
  const r2 = generateUin({ mode: 'foundational', length: 19 });
  assertEqual(r2.provenance.source, 'Node.js CSPRNG', 'Provenance reverts to CSPRNG');
  assertEqual(r2.provenance.hardware, false, 'Provenance hardware = false');

  console.log('\nTesting injected bytes are single-shot (subsequent call uses CSPRNG):');
  const fakeEntropy2 = Buffer.alloc(64, 0xCD);
  provideRandomBytes(fakeEntropy2, { source: 'test', hardware: true, fipsLevel: 3, provider: 'test' });
  generateUin({ mode: 'foundational', length: 19 });
  const r3 = generateUin({ mode: 'foundational', length: 19 });
  assertEqual(r3.provenance.source, 'Node.js CSPRNG', 'Second call after inject uses CSPRNG');
}

/**
 * ============================================
 * YubiHSM authkey ID configurable (F-08)
 * ============================================
 */
function testYubiHsmAuthKeyConfigurable() {
  console.log('\n=== Testing YubiHSM authkey ID configurable (F-08) ===\n');
  const c1 = new HsmClient({ yubihsmAuthKeyId: '0002' });
  assertEqual(c1.config.yubihsmAuthKeyId, '0002', 'Custom authkey ID accepted');
  const c2 = new HsmClient();
  assertEqual(c2.config.yubihsmAuthKeyId, '0001', 'Default authkey ID is 0001');
}

/**
 * ============================================
 * HSM sign() fallback uses HMAC (F-07)
 * ============================================
 */
async function testHsmSignFallback() {
  console.log('\n=== Testing HSM sign() software fallback (F-07) ===\n');

  console.log('Testing sign() uses HMAC in software-fallback mode:');
  const client = new HsmClient({ enabled: false });
  client.pkcs11 = null;
  client.keyHandle = null;
  const sig = await client.sign('sha256', Buffer.from('data to sign'), 'my-hmac-key');
  assertTrue(Buffer.isBuffer(sig), 'Returns a Buffer');
  assertEqual(sig.length, 32, 'SHA-256 HMAC is 32 bytes');

  console.log('\nTesting sign() on SHA-384 produces 48-byte HMAC:');
  const sig384 = await client.sign('sha384', Buffer.from('data to sign'), 'my-hmac-key');
  assertEqual(sig384.length, 48, 'SHA-384 HMAC is 48 bytes');
}

/**
 * ============================================
 * HSM fail-loud mode (F-04)
 * ============================================
 */
async function testHsmFailLoud() {
  console.log('\n=== Testing HSM Fail-Loud Mode (HSM_REQUIRE_HARDWARE) ===\n');

  console.log('Testing randomBytes throws when requireHardware=true and no hardware:');
  const client = new HsmClient({ enabled: true, requireHardware: true });
  client.session = null;
  client.trngAvailable = false;
  client.remoteTrngAvailable = false;
  let threw = false;
  try {
    await client.randomBytes(16);
  } catch (e) {
    threw = true;
    assertTrue(/HSM_REQUIRE_HARDWARE/.test(e.message), 'Error message mentions HSM_REQUIRE_HARDWARE');
    assertTrue(/software CSPRNG/.test(e.message), 'Error message mentions software CSPRNG refusal');
  }
  assertTrue(threw, 'randomBytes should have thrown');

  console.log('\nTesting randomBytesWithSource returns CSPRNG metadata when permissive:');
  const permissive = new HsmClient({ enabled: true, requireHardware: false });
  permissive.session = null;
  permissive.trngAvailable = false;
  permissive.remoteTrngAvailable = false;
  const r = await permissive.randomBytesWithSource(16);
  assertEqual(r.hardware, false, 'hardware=false when no hardware');
  assertEqual(r.source, 'Node.js CSPRNG', 'source reports CSPRNG');
  assertEqual(r.bytes.length, 16, 'returns requested length');
  assertEqual(r.fipsLevel, 0, 'fipsLevel=0 for software');

  console.log('\nTesting getStatus exposes requireHardware and hardware-required-unavailable mode:');
  const statusClient = new HsmClient({ enabled: true, requireHardware: true });
  statusClient.initialized = true;
  const status = statusClient.getStatus();
  assertEqual(status.requireHardware, true, 'requireHardware=true surfaced in status');
  assertEqual(status.mode, 'hardware-required-unavailable', 'mode reflects require-but-absent state');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║           OSIA UIN Generator Test Suite                   ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    testChecksumModule();
    testSectorTokenModule();
    testConfigModule();
    testRandomMode();
    testFoundationalMode();
    testStructuredMode();
    testSectorTokenMode();
    testValidation();
    testHsmRemotePin();
    await testHsmFailLoud();
    await testHsmSignFallback();
    testYubiHsmAuthKeyConfigurable();
    await testVaultTlsSkipProductionGuard();
    await testUinHsmBytesInjection();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║                     Test Results                          ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total tests run: ${testsRun}`);
    console.log(`Tests passed: ${testsPassed} ✓`);
    console.log(`Tests failed: ${testsFailed} ✗`);

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed!\n');
      process.exit(0);
    } else {
      console.log(`\n❌ ${testsFailed} test(s) failed.\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
