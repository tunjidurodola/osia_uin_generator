#!/usr/bin/env node

/**
 * HTTP API Server for UIN Generator
 * PM2-ready Express server providing REST API for UIN generation
 */

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { generateUin, validateUin, provideRandomBytes } from './uinGenerator.mjs';
import { randomBytesWithSource as cryptoRandomBytesWithSource } from './cryptoService.mjs';
import { getConfig } from './config.mjs';
import { computeUinHash, computeSha256, computeSha3_256, verifyUinHash } from './hash.mjs';
import { preGenerateUins, claimUin, assignUin, updateUinStatus, getUin, getUinAudit, getPoolStats } from './poolService.mjs';
import { getFormats, getFormat, createFormat, updateFormat, deleteFormat, applyFormat, previewFormat } from './formatService.mjs';
import { initializeCryptoService, getStatus as getCryptoStatus, loadSecretsFromEnv } from './cryptoService.mjs';
import { testConnection } from './db.mjs';
import crypto from 'crypto';

const app = express();

/**
 * Sanitize a string for safe log output.
 * Strips control characters and newlines to prevent log injection (CWE-117).
 */
function sanitizeForLog(str) {
  if (typeof str !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Send a sanitized error response.
 * For 4xx (client errors) we keep the caller-supplied message — callers are
 * expected to pass validation messages safe for clients. For 5xx we return
 * only a correlation id; the full error is logged server-side. This prevents
 * DB constraint names, file paths, and Vault errors from leaking to clients.
 */
function sendError(res, status, err, context = '') {
  const msg = err && typeof err.message === 'string' ? err.message : String(err || '');
  if (status >= 500) {
    const requestId = crypto.randomUUID();
    console.error(`[error] ${sanitizeForLog(context)} rid=${requestId}:`, err);
    return res.status(status).json({
      success: false,
      error: 'Internal server error',
      requestId,
      timestamp: new Date().toISOString()
    });
  }
  return res.status(status).json({
    success: false,
    error: sanitizeForLog(msg),
    timestamp: new Date().toISOString()
  });
}

// Security headers (helmet)
app.use(helmet());

// Middleware - limit request body size to prevent DoS
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' }
});
app.use(limiter);

// Stricter rate limit for generation endpoints
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', message: 'Generation rate limit exceeded. Please try again later.' }
});

// CORS configuration
app.use((req, res, next) => {
  const config = getConfig();

  if (config.enableCors) {
    res.header('Access-Control-Allow-Origin', config.corsOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }

  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = sanitizeForLog(req.method);
  const path = sanitizeForLog(req.path);
  const ip = sanitizeForLog(req.ip);
  console.log(`[${timestamp}] ${method} ${path} - ${ip}`);
  next();
});

// ═══════════════════════════════════════════════
// Health & Info
// ═══════════════════════════════════════════════

app.get('/health', async (req, res) => {
  const config = getConfig();
  let dbOk = false;
  try { dbOk = await testConnection(); } catch (_) {}

  res.json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'osia-uin-generator',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'unavailable',
    config: {
      defaultMode: config.defaultMode,
      defaultLength: config.defaultLength,
      supportedSectors: config.supportedSectors
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'OSIA UIN Generator API',
    version: '2.1.0',
    description: 'Generate OSIA-compliant Unique Identification Numbers and unlinkable sector tokens. No PII.',
    endpoints: {
      health: 'GET /health',
      generate: 'POST /generate',
      validate: 'POST /validate',
      modes: 'GET /modes',
      sectors: 'GET /sectors',
      hashUin: 'POST /hash/uin',
      hashUinVerify: 'POST /hash/uin/verify',
      batch: 'POST /batch',
      poolStats: 'GET /pool/stats',
      poolPeek: 'GET /pool/peek',
      poolPreassign: 'POST /pool/preassign',
      poolAssign: 'POST /pool/assign',
      poolRevoke: 'POST /pool/revoke',
      poolRetire: 'POST /pool/retire',
      formats: 'GET /formats',
      formatsPreview: 'POST /formats/preview',
      cryptoStatus: 'GET /crypto/status',
      uinLookup: 'GET /uin/:uin',
      uinAudit: 'GET /uin/:uin/audit',
      uinPreGenerate: 'POST /uin/pre-generate'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// ═══════════════════════════════════════════════
// UIN Generation Modes & Reference Data
// ═══════════════════════════════════════════════

app.get('/modes', (req, res) => {
  res.json({
    modes: [
      {
        name: 'foundational',
        description: 'High-entropy foundational UIN with no embedded PII',
        parameters: ['length', 'charset', 'excludeAmbiguous', 'checksum']
      },
      {
        name: 'random',
        description: 'Fully random UIN with configurable length and charset',
        parameters: ['length', 'charset', 'excludeAmbiguous', 'checksum']
      },
      {
        name: 'structured',
        description: 'Template-based UIN with placeholders and values',
        parameters: ['template', 'values', 'randomSegments', 'checksum']
      },
      {
        name: 'sector_token',
        description: 'Sector-specific token derived from foundational UIN',
        parameters: ['foundationalUin', 'sector', 'tokenLength', 'charset', 'algorithm']
      },
    ]
  });
});

app.get('/sectors', (req, res) => {
  const config = getConfig();
  res.json({
    sectors: config.supportedSectors,
    description: 'Supported sectors for sector token generation'
  });
});

// ═══════════════════════════════════════════════
// Hash Endpoints (UIN hash only — no arbitrary-data hashing)
// ═══════════════════════════════════════════════

// Hash a UIN via RIPEMD160(SHA3-256(uin + salt)) — the canonical `hash_rmd160`
// used by downstream OSIA sector services.
app.post('/hash/uin', generateLimiter, async (req, res) => {
  try {
    const { uin, salt = '' } = req.body || {};
    if (!uin || typeof uin !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Request body must include a non-empty string "uin"',
        timestamp: new Date().toISOString()
      });
    }
    const hash = computeUinHash(uin, salt);
    res.json({ success: true, hash, algorithm: 'ripemd160(sha3-256(uin||salt))', timestamp: new Date().toISOString() });
  } catch (error) {
    sendError(res, 400, error, 'hash/uin');
  }
});

app.post('/hash/uin/verify', async (req, res) => {
  try {
    const { uin, hash, salt = '' } = req.body || {};
    if (!uin || !hash) {
      return res.status(400).json({
        success: false,
        error: 'Request body must include "uin" and "hash"',
        timestamp: new Date().toISOString()
      });
    }
    const valid = verifyUinHash(uin, hash, salt);
    res.json({ success: true, valid, timestamp: new Date().toISOString() });
  } catch (error) {
    sendError(res, 400, error, 'hash/uin/verify');
  }
});

// ═══════════════════════════════════════════════
// UIN Generation
// ═══════════════════════════════════════════════

app.post('/generate', generateLimiter, async (req, res) => {
  try {
    const options = req.body;

    if (!options || typeof options !== 'object') {
      return res.status(400).json({ error: 'Invalid request body', message: 'Request body must be a JSON object with generation options' });
    }

    // PII-accepting modes (mrz, passport, td1/2/3, pii_structured) removed
    // per the no-PII invariant. MRZ generation belongs in downstream services
    // that are authorised to handle PII.
    const validModes = ['random', 'structured', 'sector_token', 'foundational', 'sectoral'];
    if (options.mode && !validModes.includes(options.mode.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid mode', message: `Mode must be one of: ${validModes.join(', ')}` });
    }

    // Pre-fetch entropy through the HSM priority chain (remote Utimaco TRNG
    // -> local HSM -> CSPRNG). Inject the bytes + provenance into the
    // synchronous generator via uinGenerator.provideRandomBytes(). If
    // HSM_REQUIRE_HARDWARE=true and no hardware is available,
    // cryptoRandomBytesWithSource does NOT throw — it returns CSPRNG
    // metadata and the HsmClient.randomBytes downstream throws; here we
    // replicate the fail-loud semantics explicitly at the server layer
    // so /generate itself returns 503 rather than a generic 500.
    const length = Number(options.length) || 19;
    const entropy = await cryptoRandomBytesWithSource(Math.max(length * 2, 16));
    const requireHardware =
      process.env.HSM_REQUIRE_HARDWARE === 'true' ||
      process.env.HSM_REQUIRE_HARDWARE === '1';
    if (requireHardware && !entropy.hardware) {
      return res.status(503).json({
        success: false,
        error: 'HSM_REQUIRE_HARDWARE=true but no hardware TRNG is available. Refusing to issue a UIN from software CSPRNG.',
        source: entropy.source,
        timestamp: new Date().toISOString()
      });
    }
    provideRandomBytes(entropy.bytes, {
      source: entropy.source,
      hardware: entropy.hardware,
      fipsLevel: entropy.fipsLevel || 0,
      provider: entropy.hardware ? (entropy.provider || 'hsm') : null
    });

    const result = generateUin(options);
    res.json({ success: true, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(400).json({ success: false, error: 'UIN generation failed. Check your parameters.', timestamp: new Date().toISOString() });
  }
});

app.post('/validate', async (req, res) => {
  try {
    const { uin, options = {} } = req.body;

    if (!uin) return res.status(400).json({ error: 'Missing UIN', message: 'Request body must include "uin" field' });

    const result = validateUin(uin, options);
    res.json({ success: true, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({ success: false, error: 'UIN validation failed. Check your input.', timestamp: new Date().toISOString() });
  }
});

app.post('/batch', generateLimiter, async (req, res) => {
  try {
    const { count = 1, options = {} } = req.body;

    if (count < 1 || count > 1000) {
      return res.status(400).json({ error: 'Invalid count', message: 'Count must be between 1 and 1000' });
    }

    const requireHardware =
      process.env.HSM_REQUIRE_HARDWARE === 'true' ||
      process.env.HSM_REQUIRE_HARDWARE === '1';
    const length = Number(options.length) || 19;
    const results = [];
    for (let i = 0; i < count; i++) {
      const entropy = await cryptoRandomBytesWithSource(Math.max(length * 2, 16));
      if (requireHardware && !entropy.hardware) {
        return res.status(503).json({
          success: false,
          error: 'HSM_REQUIRE_HARDWARE=true but no hardware TRNG is available.',
          source: entropy.source,
          timestamp: new Date().toISOString()
        });
      }
      provideRandomBytes(entropy.bytes, {
        source: entropy.source,
        hardware: entropy.hardware,
        fipsLevel: entropy.fipsLevel || 0,
        provider: entropy.hardware ? (entropy.provider || 'hsm') : null
      });
      results.push(generateUin(options));
    }

    res.json({ success: true, count: results.length, results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(400).json({ success: false, error: 'Batch generation failed. Check your parameters.', timestamp: new Date().toISOString() });
  }
});

// ═══════════════════════════════════════════════
// Pool Management
// ═══════════════════════════════════════════════

app.get('/pool/stats', async (req, res) => {
  try {
    const { scope } = req.query;
    const stats = await getPoolStats(scope || null);
    res.json({ success: true, stats, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Pool stats error:', error);
    sendError(res, 500, error);
  }
});

app.get('/pool/peek', async (req, res) => {
  try {
    const { status = 'AVAILABLE', limit = 10 } = req.query;
    const { getDb } = await import('./db.mjs');
    const db = getDb();

    const uins = await db('uin_pool')
      .where({ status: status.toUpperCase() })
      .orderBy('iat', 'asc')
      .limit(Math.min(parseInt(limit) || 10, 100))
      .select('*');

    res.json({ success: true, uins, count: uins.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Pool peek error:', error);
    sendError(res, 500, error);
  }
});

app.post('/pool/preassign', async (req, res) => {
  try {
    const { scope, clientId } = req.body;
    const result = await claimUin({ scope, clientId: clientId || 'WEB_UI' });

    if (!result) {
      return res.status(404).json({ success: false, error: 'No available UINs in pool', timestamp: new Date().toISOString() });
    }

    res.json({ success: true, uin: result.uin, status: result.status, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Pool preassign error:', error);
    sendError(res, 500, error);
  }
});

app.post('/pool/assign', async (req, res) => {
  try {
    const { uin, entityId } = req.body;

    if (!uin) return res.status(400).json({ success: false, error: 'Missing uin' });

    const result = await assignUin({
      uin,
      assignedToRef: entityId || `entity-${Date.now()}`,
      actorSystem: 'WEB_UI'
    });

    res.json({ success: true, uin: result.uin, status: result.status, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Pool assign error:', error);
    sendError(res, 400, error);
  }
});

app.post('/pool/revoke', async (req, res) => {
  try {
    const { uin, reason } = req.body;

    if (!uin) return res.status(400).json({ success: false, error: 'Missing uin' });

    const result = await updateUinStatus({
      uin,
      newStatus: 'REVOKED',
      reason: reason || 'Manual revocation via UI',
      actorSystem: 'WEB_UI'
    });

    res.json({ success: true, uin: result.uin, status: result.status, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Pool revoke error:', error);
    sendError(res, 400, error);
  }
});

app.post('/pool/retire', async (req, res) => {
  try {
    const { uin, reason } = req.body;

    if (!uin) return res.status(400).json({ success: false, error: 'Missing uin' });

    const result = await updateUinStatus({
      uin,
      newStatus: 'RETIRED',
      reason: reason || 'Manual retirement via UI',
      actorSystem: 'WEB_UI'
    });

    res.json({ success: true, uin: result.uin, status: result.status, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Pool retire error:', error);
    sendError(res, 400, error);
  }
});

// ═══════════════════════════════════════════════
// UIN Lookup & Pre-generation
// ═══════════════════════════════════════════════

app.post('/uin/pre-generate', generateLimiter, async (req, res) => {
  try {
    const { count = 100, mode = 'foundational', scope, options = {}, format_code } = req.body;

    const result = await preGenerateUins({
      count: Math.min(parseInt(count), 10000),
      mode,
      scope: scope || mode,
      options,
      formatCode: format_code || null
    });

    res.json({ success: true, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Pre-generate error:', error);
    sendError(res, 400, error);
  }
});

app.get('/uin/:uin', async (req, res) => {
  try {
    const uinRecord = await getUin(req.params.uin);

    if (!uinRecord) {
      return res.status(404).json({ success: false, error: 'UIN not found', timestamp: new Date().toISOString() });
    }

    res.json({ success: true, uin: uinRecord, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('UIN lookup error:', error);
    sendError(res, 500, error);
  }
});

app.get('/uin/:uin/audit', async (req, res) => {
  try {
    const audit = await getUinAudit(req.params.uin);
    res.json({ success: true, audit, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('UIN audit error:', error);
    sendError(res, 500, error);
  }
});

// ═══════════════════════════════════════════════
// Format Management
// ═══════════════════════════════════════════════

app.get('/formats', async (req, res) => {
  try {
    const formats = await getFormats();
    res.json({ success: true, formats, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Formats list error:', error);
    sendError(res, 500, error);
  }
});

app.get('/formats/:id', async (req, res) => {
  try {
    const format = await getFormat(parseInt(req.params.id) || req.params.id);

    if (!format) {
      return res.status(404).json({ success: false, error: 'Format not found' });
    }

    res.json({ success: true, format, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Format get error:', error);
    sendError(res, 500, error);
  }
});

app.post('/formats', async (req, res) => {
  try {
    const format = await createFormat(req.body);
    res.status(201).json({ success: true, format, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Format create error:', error);
    sendError(res, 400, error);
  }
});

app.put('/formats/:id', async (req, res) => {
  try {
    const format = await updateFormat(parseInt(req.params.id), req.body);

    if (!format) {
      return res.status(404).json({ success: false, error: 'Format not found' });
    }

    res.json({ success: true, format, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Format update error:', error);
    sendError(res, 400, error);
  }
});

app.delete('/formats/:id', async (req, res) => {
  try {
    const deleted = await deleteFormat(parseInt(req.params.id));

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Format not found or is the default format' });
    }

    res.json({ success: true, deleted: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Format delete error:', error);
    sendError(res, 400, error);
  }
});

app.post('/formats/preview', async (req, res) => {
  try {
    const { uin, format_id, format_code } = req.body;

    if (!uin) return res.status(400).json({ success: false, error: 'Missing uin' });

    const formatted = await previewFormat(uin, format_id || format_code);
    res.json({ success: true, raw: uin, formatted, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Format preview error:', error);
    sendError(res, 400, error);
  }
});

// ═══════════════════════════════════════════════
// Crypto / Security Status
// ═══════════════════════════════════════════════

app.get('/crypto/status', async (req, res) => {
  try {
    const status = getCryptoStatus();
    res.json({ success: true, status, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Crypto status error:', error);
    sendError(res, 500, error);
  }
});

// ═══════════════════════════════════════════════
// Error Handlers
// ═══════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'The requested endpoint does not exist', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════
// Server Startup
// ═══════════════════════════════════════════════

async function startServer() {
  try {
    const config = getConfig();
    const port = config.serverPort;
    const host = config.serverHost;

    // Test database connection
    let dbOk = false;
    try {
      dbOk = await testConnection();
      if (dbOk) {
        console.log('[DB] PostgreSQL connection OK');
      } else {
        console.warn('[DB] PostgreSQL connection FAILED - pool/format/lookup features unavailable');
      }
    } catch (err) {
      console.warn('[DB] PostgreSQL not available:', err.message);
    }

    // Initialize crypto service (non-blocking - works without HSM/Vault)
    try {
      loadSecretsFromEnv();
      await initializeCryptoService();
      console.log('[Crypto] Service initialized');
    } catch (err) {
      console.warn('[Crypto] Initialization failed (non-fatal):', err.message);
    }

    app.listen(port, host, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║         OSIA UIN Generator API Server v2.1.0              ║
╚════════════════════════════════════════════════════════════╝

Server running at: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}

Core endpoints:
  - GET  /               API information
  - GET  /health         Health check
  - POST /generate       Generate a UIN
  - POST /validate       Validate a UIN
  - POST /batch          Batch generate UINs
  - POST /hash/uin       Hash a UIN (RIPEMD160 over SHA3-256)
  - POST /hash/uin/verify  Verify a UIN hash

Pool management:
  - GET  /pool/stats     Pool statistics
  - GET  /pool/peek      Peek at pool UINs
  - POST /pool/preassign Preassign a UIN
  - POST /pool/assign    Assign a UIN
  - POST /pool/revoke    Revoke a UIN
  - POST /pool/retire    Retire a UIN
  - POST /uin/pre-generate Pre-generate UINs

Formats & Lookup:
  - GET  /formats        List formats
  - GET  /uin/:uin       Lookup UIN
  - GET  /crypto/status  Crypto service status

Database: ${dbOk ? 'Connected' : 'Unavailable'}

Configuration:
  - Default mode: ${config.defaultMode}
  - Default length: ${config.defaultLength}
  - Supported sectors: ${config.supportedSectors.join(', ')}
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
