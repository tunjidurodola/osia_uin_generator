#!/usr/bin/env node

/**
 * HTTP API server for the OSIA UIN Generator (PM2 entry point).
 */

import app from './app.mjs';
import { getConfig } from './config.mjs';
import { initializeCryptoService, loadSecretsFromEnv } from './cryptoService.mjs';
import { testConnection } from './db.mjs';
import { authMode } from './osia/auth.mjs';

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

    if (authMode() === 'required' && !process.env.OSIA_JWT_JWKS_URL && !process.env.OSIA_JWT_PUBLIC_KEY && !process.env.OSIA_JWT_SECRET) {
      console.error('[osia] OSIA_AUTH_MODE=required but no OSIA_JWT_* verification key is configured: every /v1 call will be rejected with 401');
    }

    app.listen(port, host, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║         OSIA UIN Generator API Server v2.1.0              ║
╚════════════════════════════════════════════════════════════╝

Server running at: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}

OSIA UIN Interface v2.0.0 (api/uin.yaml):
  - /v1/*                BearerAuth (${authMode()}), transactionId required

Legacy endpoints:
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
