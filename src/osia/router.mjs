/**
 * OSIA UIN Interface v2 — /v1 router.
 *
 * Each operation is bound to its operationId in api/uin.yaml. Before the
 * handler runs, the request is authenticated (BearerAuth + operation scopes),
 * then the query/path parameters (including the mandatory transactionId) and
 * the JSON body are validated against the specification's schemas.
 */

import express from 'express';
import { getConfig } from '../config.mjs';
import { getStatus as getCryptoStatus } from '../cryptoService.mjs';
import { testConnection } from '../db.mjs';
import { getSpec, formatErrors } from './spec.mjs';
import { authenticate } from './auth.mjs';
import { OsiaError, badRequest, sendOsiaError } from './errors.mjs';
import { generateIdentifier, resolveLifecycle, integrityHash, EntropyCollector, DEFAULT_LENGTH } from './generator.mjs';
import { formatForResponse, listFormats, getFormatConfig, createFormatConfig, updateFormatConfig, deleteFormatConfig } from './formats.mjs';
import { toJwt, toJsonLd } from './representation.mjs';
import { validateRequest } from './validate.mjs';
import * as pool from './pool.mjs';
import { DEFAULT_CHECKSUM } from './checksum.mjs';

const SECTOR_DESCRIPTIONS = {
  health: 'Healthcare / Medical services',
  tax: 'Tax administration / Revenue authority',
  finance: 'Banking and financial services',
  telco: 'Telecommunications / SIM registration',
  stats: 'National statistics',
  education: 'Education and examinations',
  social: 'Social protection and welfare',
  government: 'General government services'
};

const MODES = [
  {
    name: 'FOUNDATIONAL',
    description: 'High-entropy, lifelong identifier with no embedded personal data',
    supportsPiiAttributes: false,
    requiresBaseUin: false
  },
  {
    name: 'RANDOM',
    description: 'Configurable random identifier with selectable charset and checksum',
    supportsPiiAttributes: false,
    requiresBaseUin: false
  },
  {
    name: 'STRUCTURED',
    description: 'Pattern-based identifier combining random segments, non-personal administrative attributes and a check character',
    supportsPiiAttributes: false,
    requiresBaseUin: false
  },
  {
    name: 'SECTOR',
    description: 'Deterministic, unlinkable sector-specific token derived from a foundational UIN (HMAC-SHA256)',
    supportsPiiAttributes: false,
    requiresBaseUin: true
  }
].map((m) => ({ ...m, defaultLength: DEFAULT_LENGTH, defaultCharset: 'ALPHANUMERIC', defaultChecksum: DEFAULT_CHECKSUM }));

/**
 * Wrap a handler with authentication and spec-driven request validation.
 */
function operation(operationId, handler, { status = 200 } = {}) {
  const spec = getSpec();
  const op = spec.operations.get(operationId);
  if (!op) throw new Error(`operation ${operationId} is not defined in api/uin.yaml`);

  return async (req, res) => {
    try {
      const identity = await authenticate(req, op.scopes);

      const query = { ...req.query };
      if (op.query && !op.query(query)) {
        const missingTxn = op.query.errors.some((e) => e.keyword === 'required' && e.params.missingProperty === 'transactionId');
        throw badRequest(missingTxn ? 'transactionId query parameter is required' : formatErrors(op.query.errors, 'query').join('; '));
      }
      const params = { ...req.params };
      if (op.path && !op.path(params)) {
        throw badRequest(formatErrors(op.path.errors, 'path').join('; '));
      }

      let body;
      if (op.body) {
        if (!req._body) {
          if (op.bodyRequired) throw badRequest('a JSON request body is required');
          body = {};
        } else {
          body = req.body;
        }
        if (!op.body(body)) throw badRequest(formatErrors(op.body.errors, 'body').join('; '));
      } else if (req._body && req.body && Object.keys(req.body).length > 0) {
        throw badRequest('this operation does not accept a request body');
      }

      const ctx = { subject: identity.subject, transactionId: query.transactionId };
      const result = await handler({ query, params, body, ctx, req });

      if (status === 204) return res.status(204).end();
      return res.status(status).json(result);
    } catch (err) {
      return sendOsiaError(res, err, operationId);
    }
  };
}

async function buildGenerateResponse(request, result, lifecycle, issuedAt, ctx) {
  const r = {
    uin: result.uin,
    mode: result.mode,
    checksum: result.checksum,
    integrityHash: integrityHash(result.uin),
    issuedAt,
    issuer: lifecycle.issuer,
    expiresAt: lifecycle.expiresAt,
    infiniteLifetime: lifecycle.infiniteLifetime
  };
  const formatted = await formatForResponse(result.uin, request.formatting);
  if (formatted !== undefined) r.formattedUin = formatted;
  if (result.sector) r.sector = result.sector;
  if (lifecycle.audience) r.audience = lifecycle.audience;
  if (lifecycle.notBefore) r.notBefore = lifecycle.notBefore;
  if (result.entropy) r.entropy = result.entropy;

  const output = request.outputFormat || 'JSON';
  if (output === 'JWT') r.jwt = await toJwt(r, ctx.transactionId);
  if (output === 'JSON_LD') r.jsonLd = toJsonLd(r);

  const order = ['uin', 'formattedUin', 'mode', 'sector', 'checksum', 'integrityHash', 'issuedAt', 'issuer', 'audience',
    'notBefore', 'expiresAt', 'infiniteLifetime', 'entropy', 'jwt', 'jsonLd'];
  return Object.fromEntries(order.filter((k) => r[k] !== undefined).map((k) => [k, r[k]]));
}

function cryptoStatus() {
  const s = getCryptoStatus();
  const h = s.hsm || {};
  const hsm = {
    enabled: Boolean(h.enabled),
    hasTrng: Boolean(h.hasTrng),
    mode: h.mode === 'hardware' ? 'hardware' : 'software',
    randomSource: h.randomSource || 'Node.js CSPRNG'
  };
  if (h.provider) hsm.provider = String(h.provider);
  if (h.providerName && h.providerName !== 'Unknown') hsm.providerName = String(h.providerName);
  if (['production', 'cloud', 'compact', 'development'].includes(h.providerType)) hsm.providerType = h.providerType;
  if (h.enabled) hsm.fipsLevel = Number(h.fipsLevel) > 0 ? Number(h.fipsLevel) : null;
  const vault = { enabled: Boolean(s.vault && s.vault.enabled), authenticated: Boolean(s.vault && s.vault.authenticated) };
  return { hsm, vault, secretsLoaded: Number(s.secretsLoaded) || 0 };
}

export function createOsiaRouter({ generateLimiter } = {}) {
  const router = express.Router();
  const gen = generateLimiter ? [generateLimiter] : [];

  // ─── metadata ────────────────────────────────────────────────────────────
  router.get('/health', operation('getHealth', async () => {
    const c = cryptoStatus();
    let dbOk = false;
    try { dbOk = await testConnection(); } catch { dbOk = false; }
    const hardwareRequired = process.env.HSM_REQUIRE_HARDWARE === 'true' || process.env.HSM_REQUIRE_HARDWARE === '1';
    let status = dbOk ? 'healthy' : 'degraded';
    if (hardwareRequired && !c.hsm.hasTrng) status = 'unhealthy';
    return {
      status,
      version: getSpec().version,
      crypto: { hsm: { enabled: c.hsm.enabled, hasTrng: c.hsm.hasTrng }, vault: c.vault }
    };
  }));

  router.get('/crypto/status', operation('getCryptoStatus', async () => cryptoStatus()));

  router.get('/modes', operation('getModes', async () => MODES));

  router.get('/sectors', operation('getSectors', async () => getConfig().supportedSectors
    .filter((code) => SECTOR_DESCRIPTIONS[code])
    .map((code) => ({ code, name: code.toUpperCase(), description: SECTOR_DESCRIPTIONS[code] }))));

  // ─── generation ──────────────────────────────────────────────────────────
  // OSIA v1.2.0 generateUIN: the attributes are accepted for interface
  // compatibility only. They are not used, stored or logged — the UIN is a
  // high-entropy FOUNDATIONAL identifier with no embedded personal data.
  router.post('/uin', ...gen, operation('generateUIN', async () => {
    const r = await generateIdentifier({ mode: 'FOUNDATIONAL' });
    return r.uin;
  }));

  router.post('/generate', ...gen, operation('generate', async ({ body, ctx }) => {
    const lifecycle = resolveLifecycle(body);
    const result = await generateIdentifier(body);
    return buildGenerateResponse(body, result, lifecycle, new Date().toISOString(), ctx);
  }));

  router.post('/batch', ...gen, operation('generateBatch', async ({ body, ctx }) => {
    const request = body.options;
    if (request.mode === 'SECTOR') throw badRequest('SECTOR tokens are derived one per base UIN; use /v1/generate');
    const lifecycle = resolveLifecycle(request);
    const issuedAt = new Date().toISOString();
    const collector = new EntropyCollector({ prefetch: 16384 });
    const results = [];
    for (let i = 0; i < body.count; i++) results.push(await generateIdentifier(request, collector));
    const entropy = collector.provenance();
    const items = [];
    for (const r of results) {
      items.push(await buildGenerateResponse(request, { ...r, entropy }, lifecycle, issuedAt, ctx));
    }
    return { count: items.length, items };
  }));

  // ─── use ─────────────────────────────────────────────────────────────────
  router.post('/validate', operation('validate', async ({ body, ctx }) => validateRequest(body, ctx)));

  // ─── pool ────────────────────────────────────────────────────────────────
  router.get('/pool/stats', operation('getPoolStats', async ({ query }) => pool.poolStats(query.scope)));
  router.get('/pool/peek', operation('peekPool', async ({ query }) =>
    pool.peek({ status: query.status, scope: query.scope, limit: query.limit ?? 10 })));
  router.post('/uin/pre-generate', ...gen, operation('preGenerateUins', async ({ body, ctx }) => pool.preGenerate(body, ctx)));
  router.post('/uin/claim', operation('claimUin', async ({ body, ctx }) => pool.claim(body, ctx)));
  router.post('/uin/assign', operation('assignUin', async ({ body, ctx }) => pool.assign(body, ctx)));
  router.post('/uin/release', operation('releaseUin', async ({ body, ctx }) => pool.release(body, ctx)));
  router.post('/uin/status', operation('updateUinStatus', async ({ body, ctx }) => pool.setTerminalStatus(body, ctx)));
  router.post('/uin/cleanup-preassigned', operation('cleanupPreassignedUins', async ({ body, ctx }) => pool.cleanupPreassigned(body, ctx)));
  router.get('/uin/:uin', operation('getUin', async ({ params }) => pool.getRecord(params.uin)));
  router.get('/uin/:uin/audit', operation('getUinAudit', async ({ params }) => pool.auditTrail(params.uin)));

  // ─── formats ─────────────────────────────────────────────────────────────
  router.get('/formats', operation('listFormats', async () => listFormats()));
  router.post('/formats', operation('createFormat', async ({ body, ctx }) => createFormatConfig(body, ctx.subject), { status: 201 }));
  router.get('/formats/:code', operation('getFormat', async ({ params }) => getFormatConfig(params.code)));
  router.put('/formats/:code', operation('updateFormat', async ({ params, body }) => updateFormatConfig(params.code, body)));
  router.delete('/formats/:code', operation('deleteFormat', async ({ params }) => deleteFormatConfig(params.code), { status: 204 }));

  router.use((req, res) => sendOsiaError(res, new OsiaError(404, 'Unknown OSIA operation')));
  return router;
}
