#!/usr/bin/env node

/**
 * HTTP API Server for UIN Generator with PostgreSQL Pool Management
 * PM2-ready Express server providing REST API for UIN generation and lifecycle management
 */

import express from 'express';
import { generateUin, validateUin } from './uinGenerator.mjs';
import { getConfig } from './config.mjs';
import {
  preGenerateUins,
  claimUin,
  assignUin,
  releaseUin,
  updateUinStatus,
  releaseStalePreassigned,
  getUin,
  getUinAudit,
  getPoolStats
} from './poolService.mjs';
import { testConnection } from './db.mjs';
import {
  initializeCryptoService,
  getStatus as getCryptoStatus,
  loadSecretsFromEnv,
  setSectorSecrets
} from './cryptoService.mjs';
import {
  getFormats,
  getFormat,
  formatUin,
  formatUinFromDb,
  createFormat,
  updateFormat,
  deleteFormat,
  setFormatOverride,
  removeFormatOverride,
  previewFormat,
  applyFormat
} from './formatService.mjs';

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  const config = getConfig();

  if (config.enableCors) {
    res.header('Access-Control-Allow-Origin', config.corsOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

/**
 * GET / - API information
 */
app.get('/', (req, res) => {
  res.json({
    service: 'OSIA UIN Generator API',
    version: '2.0.0',
    description: 'Generate OSIA-compliant Unique Identification Numbers with PostgreSQL pool management',
    endpoints: {
      // Information
      health: 'GET /health',
      modes: 'GET /modes',
      sectors: 'GET /sectors',

      // OSIA-compliant endpoint (v1.2.0)
      osiaGenerateUin: 'POST /v1/uin',

      // Generation (stateless)
      generate: 'POST /generate',
      validate: 'POST /validate',
      batch: 'POST /batch',

      // Pool Management
      poolStats: 'GET /pool/stats',
      preGenerate: 'POST /uin/pre-generate',
      claim: 'POST /uin/claim',
      assign: 'POST /uin/assign',
      release: 'POST /uin/release',
      status: 'POST /uin/status',
      cleanup: 'POST /uin/cleanup-preassigned',
      lookup: 'GET /uin/:uin',
      audit: 'GET /uin/:uin/audit'
    },
    documentation: 'See README.md for full API documentation',
    osia: {
      version: '1.2.0',
      spec: 'https://osia.readthedocs.io/',
      compliance: 'POST /v1/uin follows OSIA v1.2.0 specification'
    }
  });
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', async (req, res) => {
  const config = getConfig();
  const dbConnected = await testConnection();
  const cryptoStatus = getCryptoStatus();

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'osia-uin-generator',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    crypto: {
      hsm: cryptoStatus.hsm,
      vault: cryptoStatus.vault,
      secretsLoaded: cryptoStatus.secretsLoaded
    },
    config: {
      defaultMode: config.defaultMode,
      defaultLength: config.defaultLength,
      supportedSectors: config.supportedSectors
    }
  });
});

/**
 * GET /crypto/status - Get cryptographic service status
 */
app.get('/crypto/status', (req, res) => {
  const cryptoStatus = getCryptoStatus();

  res.json({
    success: true,
    status: cryptoStatus,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// FORMAT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /formats - List all UIN display format configurations
 */
app.get('/formats', async (req, res) => {
  try {
    const formats = await getFormats();
    res.json({
      success: true,
      formats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get formats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /formats/:id - Get a specific format by ID or code
 */
app.get('/formats/:idOrCode', async (req, res) => {
  try {
    const { idOrCode } = req.params;
    const id = parseInt(idOrCode);
    const format = await getFormat(isNaN(id) ? idOrCode : id);

    if (!format) {
      return res.status(404).json({
        success: false,
        error: 'Format not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      format,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get format error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /formats - Create a new format configuration
 */
app.post('/formats', async (req, res) => {
  try {
    const config = req.body;

    if (!config.format_code || !config.name || !config.segment_lengths || !config.total_length) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: format_code, name, segment_lengths, total_length',
        timestamp: new Date().toISOString()
      });
    }

    const format = await createFormat(config);
    res.status(201).json({
      success: true,
      format,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create format error:', error);
    const statusCode = error.message.includes('duplicate') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /formats/:id - Update a format configuration
 */
app.put('/formats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const format = await updateFormat(parseInt(id), updates);

    if (!format) {
      return res.status(404).json({
        success: false,
        error: 'Format not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      format,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update format error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /formats/:id - Delete a format configuration
 */
app.delete('/formats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFormat(parseInt(id));

    if (!deleted) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete format (either not found or is the default format)',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Format deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete format error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /formats/preview - Preview how a UIN would look with a format
 */
app.post('/formats/preview', async (req, res) => {
  try {
    const { uin, format_id, format_code } = req.body;

    if (!uin) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: uin',
        timestamp: new Date().toISOString()
      });
    }

    let formatted;
    if (format_id || format_code) {
      formatted = await previewFormat(uin, format_id || format_code);
    } else {
      // Use auto-detection
      const result = await formatUinFromDb(uin);
      formatted = result.formatted;
    }

    res.json({
      success: true,
      raw: uin,
      formatted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Preview format error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /uin/:uin/format - Set format override for a specific UIN
 */
app.post('/uin/:uin/format', async (req, res) => {
  try {
    const { uin } = req.params;
    const { format_id } = req.body;

    if (!format_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: format_id',
        timestamp: new Date().toISOString()
      });
    }

    const override = await setFormatOverride(uin, format_id);
    res.json({
      success: true,
      override,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Set format override error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /uin/:uin/format - Remove format override for a UIN
 */
app.delete('/uin/:uin/format', async (req, res) => {
  try {
    const { uin } = req.params;
    const removed = await removeFormatOverride(uin);

    res.json({
      success: true,
      removed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Remove format override error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// GENERATION MODE ENDPOINTS
// ============================================================================

/**
 * GET /modes - List available generation modes
 */
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
        parameters: ['foundationalUin', 'sector', 'tokenLength', 'charset']
      }
    ]
  });
});

/**
 * GET /sectors - List supported sectors
 */
app.get('/sectors', (req, res) => {
  const config = getConfig();

  res.json({
    sectors: config.supportedSectors,
    description: 'Supported sectors for sector token generation'
  });
});

/**
 * POST /v1/uin - OSIA-compliant UIN generation endpoint (v1.2.0)
 *
 * OSIA Specification Compliance:
 * - Endpoint: POST /v1/uin
 * - Auth: Bearer JWT with 'uin.generate' scope (optional in dev mode)
 * - Query Param: transactionId (required) - for transaction tracking
 * - Request Body: JSON object with person attributes (firstName, lastName, dateOfBirth, etc.)
 * - Response: UIN string (200) or Error object {code, message} (400/401/403/500)
 *
 * Reference: https://osia.readthedocs.io/en/stable/
 */
app.post('/v1/uin', async (req, res) => {
  try {
    // Extract transactionId from query parameters (OSIA requirement)
    const { transactionId } = req.query;

    if (!transactionId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing required query parameter: transactionId'
      });
    }

    // Extract attributes from request body (OSIA format)
    const attributes = req.body;

    if (!attributes || typeof attributes !== 'object') {
      return res.status(400).json({
        code: 400,
        message: 'Request body must be a JSON object containing person attributes'
      });
    }

    // Optional: Check Authorization header for Bearer JWT
    // In production, this should validate JWT and check for 'uin.generate' scope
    const authHeader = req.headers.authorization;
    if (process.env.NODE_ENV === 'production' && !authHeader) {
      return res.status(401).json({
        code: 401,
        message: 'Authentication required. Provide Bearer token with uin.generate scope'
      });
    }

    // Generate UIN with OSIA-compliant options
    // Default to foundational mode for OSIA compliance (high-entropy, no embedded PII)
    const result = generateUin({
      mode: 'foundational',
      length: 19,
      excludeAmbiguous: true,
      checksum: {
        enabled: true,
        algorithm: 'iso7064'
      }
    });

    // Persist to database with OSIA transaction tracking
    const config = getConfig();
    const { getDb } = await import('./db.mjs');
    const db = getDb();

    try {
      // Insert into uin_pool with OSIA attributes and transaction ID
      await db('uin_pool').insert({
        uin: result.value,
        mode: 'foundational',
        scope: 'foundational',
        status: 'AVAILABLE',
        hash_rmd160: result.hash_rmd160,
        transaction_id: transactionId,
        attributes: attributes,
        iat: new Date(),
        ts: new Date()
      });

      // Insert audit record
      await db('uin_audit').insert({
        uin: result.value,
        event_type: 'GENERATED',
        old_status: null,
        new_status: 'AVAILABLE',
        actor_system: 'OSIA_API',
        actor_ref: transactionId,
        details: { attributes, endpoint: '/v1/uin' },
        created_at: new Date()
      });

      console.log(`[OSIA] Generated UIN ${result.value} for transaction ${transactionId}`);

    } catch (dbError) {
      console.error('[OSIA] Database error:', dbError);
      // Continue even if DB write fails - UIN was generated successfully
    }

    // OSIA-compliant response: Return only the UIN string
    res.status(200).send(result.value);

  } catch (error) {
    console.error('[OSIA] Generation error:', error);

    // OSIA-compliant error response
    res.status(500).json({
      code: 500,
      message: error.message || 'Internal server error during UIN generation'
    });
  }
});

/**
 * POST /generate - Generate a UIN (stateless, no DB persistence)
 */
app.post('/generate', async (req, res) => {
  try {
    const options = req.body;

    if (!options || typeof options !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body',
        message: 'Request body must be a JSON object with generation options'
      });
    }

    const validModes = ['random', 'structured', 'sector_token', 'foundational', 'pii_structured', 'sectoral'];
    if (options.mode && !validModes.includes(options.mode.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid mode',
        message: `Mode must be one of: ${validModes.join(', ')}`,
        provided: options.mode
      });
    }

    const result = generateUin(options);

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generation error:', error);

    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /validate - Validate a UIN
 */
app.post('/validate', async (req, res) => {
  try {
    const { uin, options = {} } = req.body;

    if (!uin) {
      return res.status(400).json({
        error: 'Missing UIN',
        message: 'Request body must include "uin" field'
      });
    }

    const result = validateUin(uin, options);

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Validation error:', error);

    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /batch - Batch generate multiple UINs (stateless)
 *
 * Formatting behavior:
 * - If count <= 10 and format is specified: apply formatting to each UIN
 * - If count > 10 and format is specified: append format_metadata section
 * - This prevents performance issues when formatting hundreds of UINs
 */
app.post('/batch', async (req, res) => {
  try {
    const { count = 1, options = {}, format_id, format_code } = req.body;

    if (count < 1 || count > 1000) {
      return res.status(400).json({
        error: 'Invalid count',
        message: 'Count must be between 1 and 1000'
      });
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(generateUin(options));
    }

    // Determine format configuration if requested
    let formatConfig = null;
    if (format_id || format_code) {
      formatConfig = await getFormat(format_id || format_code);
    }

    // Apply formatting based on count threshold
    const INLINE_FORMAT_THRESHOLD = 10;

    if (formatConfig && count <= INLINE_FORMAT_THRESHOLD) {
      // For small batches, apply formatting inline
      for (const result of results) {
        result.uin_formatted = applyFormat(result.value, formatConfig);
        result.format_code = formatConfig.format_code;
      }
    }

    const response = {
      success: true,
      count: results.length,
      results: results,
      timestamp: new Date().toISOString()
    };

    // For large batches with format, append metadata section
    if (formatConfig && count > INLINE_FORMAT_THRESHOLD) {
      response.format_metadata = {
        format_code: formatConfig.format_code,
        format_name: formatConfig.name,
        separator: formatConfig.separator,
        segment_lengths: formatConfig.segment_lengths,
        display_case: formatConfig.display_case || 'upper',
        prefix: formatConfig.prefix || null,
        suffix: formatConfig.suffix || null,
        note: `Formatting not applied inline due to batch size (${count} > ${INLINE_FORMAT_THRESHOLD}). Use format_metadata to format UINs in your system.`
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Batch generation error:', error);

    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /pool/stats - Get pool statistics
 */
app.get('/pool/stats', async (req, res) => {
  try {
    const scope = req.query.scope || null;
    const stats = await getPoolStats(scope);

    res.json({
      success: true,
      stats: stats,
      scope: scope || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pool stats error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /pool/peek - Peek at top UINs without claiming (for testing)
 */
app.get('/pool/peek', async (req, res) => {
  try {
    const { scope, status = 'AVAILABLE', limit = 10 } = req.query;
    const { getDb } = await import('./db.mjs');
    const db = getDb();

    let query = db('uin_pool')
      .where({ status: status.toUpperCase() })
      .orderBy('iat', 'asc')
      .limit(Math.min(parseInt(limit), 100));

    if (scope) {
      query = query.where({ scope });
    }

    const uins = await query.select('uin', 'mode', 'scope', 'status', 'iat', 'hash_rmd160', 'meta');

    // Format each UIN for display
    const formattedUins = await Promise.all(uins.map(async (u) => {
      const formatted = await formatUin(u.uin, u.scope, u.mode);
      return {
        uin: u.uin,
        uin_formatted: formatted,
        mode: u.mode,
        scope: u.scope,
        status: u.status,
        created: u.iat,
        hash: u.hash_rmd160,
        provenance: u.meta?.provenance || null
      };
    }));

    res.json({
      success: true,
      count: formattedUins.length,
      uins: formattedUins,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pool peek error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /pool/preassign - Pre-assign a UIN from the pool (UI-friendly)
 */
app.post('/pool/preassign', async (req, res) => {
  try {
    const { scope } = req.body;

    const result = await claimUin({
      scope: scope || null,
      clientId: req.headers['x-client-id'] || 'UI_TEST'
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No available UINs',
        message: scope ? `No available UINs for scope: ${scope}` : 'No available UINs in pool'
      });
    }

    res.json({
      success: true,
      uin: result.uin,
      status: result.status,
      message: 'UIN pre-assigned successfully'
    });
  } catch (error) {
    console.error('Pool preassign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /pool/assign - Assign a pre-assigned UIN (UI-friendly)
 */
app.post('/pool/assign', async (req, res) => {
  try {
    const { uin, entityId } = req.body;

    if (!uin) {
      return res.status(400).json({
        success: false,
        error: 'UIN is required'
      });
    }

    const result = await assignUin({
      uin,
      assignedToRef: entityId || `entity-${Date.now()}`,
      actorSystem: 'UI_TEST',
      actorRef: `ui-assign-${Date.now()}`
    });

    res.json({
      success: true,
      uin: result.uin,
      status: result.status,
      entityId: result.assigned_to_ref,
      message: 'UIN assigned successfully'
    });
  } catch (error) {
    console.error('Pool assign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /pool/revoke - Revoke an assigned UIN (UI-friendly)
 */
app.post('/pool/revoke', async (req, res) => {
  try {
    const { uin, reason } = req.body;

    if (!uin) {
      return res.status(400).json({
        success: false,
        error: 'UIN is required'
      });
    }

    const result = await updateUinStatus({
      uin,
      newStatus: 'REVOKED',
      reason: reason || 'Revoked via UI',
      actorSystem: 'UI_TEST'
    });

    res.json({
      success: true,
      uin: result.uin,
      status: result.status,
      message: 'UIN revoked successfully'
    });
  } catch (error) {
    console.error('Pool revoke error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /pool/retire - Retire a UIN (UI-friendly)
 */
app.post('/pool/retire', async (req, res) => {
  try {
    const { uin, reason } = req.body;

    if (!uin) {
      return res.status(400).json({
        success: false,
        error: 'UIN is required'
      });
    }

    const result = await updateUinStatus({
      uin,
      newStatus: 'RETIRED',
      reason: reason || 'Retired via UI',
      actorSystem: 'UI_TEST'
    });

    res.json({
      success: true,
      uin: result.uin,
      status: result.status,
      message: 'UIN retired successfully'
    });
  } catch (error) {
    console.error('Pool retire error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /uin/pre-generate - Pre-generate UINs into pool
 */
app.post('/uin/pre-generate', async (req, res) => {
  try {
    const { count, mode, scope, options = {}, format_id, format_code } = req.body;

    if (!count) {
      return res.status(400).json({
        error: 'Missing count',
        message: 'Request body must include "count" field'
      });
    }

    if (!mode) {
      return res.status(400).json({
        error: 'Missing mode',
        message: 'Request body must include "mode" field'
      });
    }

    if (count < 1 || count > 100000) {
      return res.status(400).json({
        error: 'Invalid count',
        message: 'Count must be between 1 and 100,000'
      });
    }

    const result = await preGenerateUins({
      count,
      mode,
      scope: scope || mode,
      options,
      formatId: format_id || null,
      formatCode: format_code || null
    });

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pre-generate error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /uin/claim - Claim an available UIN (AVAILABLE → PREASSIGNED)
 */
app.post('/uin/claim', async (req, res) => {
  try {
    const { scope, client_id } = req.body;

    const result = await claimUin({
      scope: scope || null,
      clientId: client_id || req.headers['x-client-id'] || 'UNKNOWN'
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No available UINs',
        message: scope ? `No available UINs for scope: ${scope}` : 'No available UINs in pool',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Claim error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /uin/assign - Assign a preassigned UIN (PREASSIGNED → ASSIGNED)
 */
app.post('/uin/assign', async (req, res) => {
  try {
    const { uin, assigned_to_ref, actor_system, actor_ref } = req.body;

    if (!uin) {
      return res.status(400).json({
        error: 'Missing UIN',
        message: 'Request body must include "uin" field'
      });
    }

    if (!assigned_to_ref) {
      return res.status(400).json({
        error: 'Missing assigned_to_ref',
        message: 'Request body must include "assigned_to_ref" field'
      });
    }

    const result = await assignUin({
      uin,
      assignedToRef: assigned_to_ref,
      actorSystem: actor_system || req.headers['x-actor-system'] || 'UNKNOWN',
      actorRef: actor_ref || null
    });

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Assign error:', error);

    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('must be') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /uin/release - Release a preassigned UIN (PREASSIGNED → AVAILABLE)
 */
app.post('/uin/release', async (req, res) => {
  try {
    const { uin, actor_system, actor_ref } = req.body;

    if (!uin) {
      return res.status(400).json({
        error: 'Missing UIN',
        message: 'Request body must include "uin" field'
      });
    }

    const result = await releaseUin({
      uin,
      actorSystem: actor_system || req.headers['x-actor-system'] || 'UNKNOWN',
      actorRef: actor_ref || null
    });

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Release error:', error);

    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('must be') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /uin/status - Update UIN status (retire, revoke, etc.)
 */
app.post('/uin/status', async (req, res) => {
  try {
    const { uin, new_status, reason, actor_system, actor_ref } = req.body;

    if (!uin) {
      return res.status(400).json({
        error: 'Missing UIN',
        message: 'Request body must include "uin" field'
      });
    }

    if (!new_status) {
      return res.status(400).json({
        error: 'Missing new_status',
        message: 'Request body must include "new_status" field'
      });
    }

    const result = await updateUinStatus({
      uin,
      newStatus: new_status,
      reason: reason || 'No reason provided',
      actorSystem: actor_system || req.headers['x-actor-system'] || 'UNKNOWN',
      actorRef: actor_ref || null
    });

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status update error:', error);

    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('Invalid') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /uin/cleanup-preassigned - Release stale preassigned UINs
 */
app.post('/uin/cleanup-preassigned', async (req, res) => {
  try {
    const { older_than_minutes } = req.body;

    if (!older_than_minutes) {
      return res.status(400).json({
        error: 'Missing older_than_minutes',
        message: 'Request body must include "older_than_minutes" field'
      });
    }

    const result = await releaseStalePreassigned({
      olderThanMinutes: older_than_minutes
    });

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cleanup error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /uin/:uin - Look up a UIN
 */
app.get('/uin/:uin', async (req, res) => {
  try {
    const { uin } = req.params;

    const result = await getUin(uin);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'UIN not found',
        uin: uin,
        timestamp: new Date().toISOString()
      });
    }

    // Add formatted UIN to result
    const formatInfo = await formatUinFromDb(uin);
    result.uin_formatted = formatInfo.formatted;
    result.format_code = formatInfo.format_code;

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lookup error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /uin/:uin/audit - Get UIN audit history
 */
app.get('/uin/:uin/audit', async (req, res) => {
  try {
    const { uin } = req.params;

    const results = await getUinAudit(uin);

    res.json({
      success: true,
      uin: uin,
      count: results.length,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    const config = getConfig();
    const port = config.serverPort;
    const host = config.serverHost;

    // Initialize crypto service (HSM/Vault)
    console.log('Initializing cryptographic services...');
    const cryptoStatus = await initializeCryptoService({
      vault: config.vault,
      hsm: config.hsm
    });

    // Load secrets from environment if Vault didn't provide them
    if (cryptoStatus.vault && !cryptoStatus.vault.authenticated) {
      console.log('Loading sector secrets from environment...');
      loadSecretsFromEnv();
    }

    // Fallback: use config secrets if nothing loaded
    const finalCryptoStatus = getCryptoStatus();
    if (finalCryptoStatus.secretsLoaded === 0) {
      console.log('Using secrets from configuration...');
      setSectorSecrets(config.sectorSecrets);
    }

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('WARNING: Database connection failed. Pool management features will not work.');
    }

    app.listen(port, host, () => {
      const finalStatus = getCryptoStatus();
      console.log(`
+------------------------------------------------------------+
|                                                            |
|         OSIA UIN Generator API Server v2.0                |
|                                                            |
+------------------------------------------------------------+

Server running at: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}

Available endpoints:
  Information:
    - GET  /              API information
    - GET  /health        Health check
    - GET  /modes         List generation modes
    - GET  /sectors       List supported sectors
    - GET  /crypto/status Cryptographic service status

  Generation (Stateless):
    - POST /generate   Generate a UIN
    - POST /validate   Validate a UIN
    - POST /batch      Batch generate UINs

  Pool Management (Database):
    - GET  /pool/stats                  Pool statistics
    - POST /uin/pre-generate            Pre-generate UINs
    - POST /uin/claim                   Claim available UIN
    - POST /uin/assign                  Assign preassigned UIN
    - POST /uin/release                 Release preassigned UIN
    - POST /uin/status                  Update UIN status
    - POST /uin/cleanup-preassigned     Cleanup stale UINs
    - GET  /uin/:uin                    Look up UIN
    - GET  /uin/:uin/audit              UIN audit history

Configuration:
  - Default mode: ${config.defaultMode}
  - Default length: ${config.defaultLength}
  - Database: ${dbConnected ? 'Connected' : 'Disconnected'}
  - HSM: ${finalStatus.hsm?.enabled ? `Enabled (${finalStatus.hsm.mode})` : 'Disabled'}
  - Vault: ${finalStatus.vault?.enabled ? (finalStatus.vault.authenticated ? 'Authenticated' : 'Enabled') : 'Disabled'}
  - Secrets loaded: ${finalStatus.secretsLoaded}
  - Supported sectors: ${config.supportedSectors.join(', ')}

Press Ctrl+C to stop the server
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

// Start the server
startServer();

export default app;
