/**
 * Crypto Service - Unified Cryptographic Operations
 * Integrates HSM and Vault support with software fallback
 * Includes provenance tracking for entropy sources
 */

import crypto from 'crypto';
import { getHsmClient, isHsmEnabled } from './hsm.mjs';
import { getVaultClient, isVaultEnabled } from './vault.mjs';
import { setProvenance } from './uinGenerator.mjs';

/**
 * Crypto service state
 */
let initialized = false;
let hsmClient = null;
let vaultClient = null;
let sectorSecrets = {};

/**
 * Initialize crypto service
 * @param {object} config - Configuration options
 * @returns {Promise<object>} Initialization status
 */
export async function initializeCryptoService(config = {}) {
  if (initialized) {
    return getStatus();
  }

  const status = {
    hsm: { enabled: false, initialized: false, mode: 'software' },
    vault: { enabled: false, initialized: false, authenticated: false }
  };

  // Initialize Vault if enabled
  if (isVaultEnabled()) {
    try {
      vaultClient = getVaultClient(config.vault || {});

      // Authenticate if credentials available
      if (vaultClient.config.roleId && vaultClient.config.secretId) {
        await vaultClient.authenticateAppRole();
        status.vault.authenticated = true;
      } else if (vaultClient.config.token) {
        status.vault.authenticated = true;
      }

      status.vault.enabled = true;
      status.vault.initialized = true;

      // Load sector secrets from Vault
      try {
        sectorSecrets = await vaultClient.getSectorSecrets();
        console.log('[CryptoService] Loaded sector secrets from Vault');
      } catch (error) {
        console.warn('[CryptoService] Could not load secrets from Vault:', error.message);
      }
    } catch (error) {
      console.error('[CryptoService] Vault initialization failed:', error.message);
    }
  }

  // Initialize HSM if enabled
  if (isHsmEnabled()) {
    try {
      hsmClient = getHsmClient(config.hsm || {});
      await hsmClient.initialize();

      status.hsm.enabled = true;
      status.hsm.initialized = hsmClient.initialized;
      status.hsm.mode = hsmClient.pkcs11 ? 'hardware' : 'software';

      console.log(`[CryptoService] HSM initialized in ${status.hsm.mode} mode`);
    } catch (error) {
      console.error('[CryptoService] HSM initialization failed:', error.message);
    }
  }

  initialized = true;
  return status;
}

/**
 * Get crypto service status
 * @returns {object} Current status
 */
export function getStatus() {
  return {
    initialized,
    hsm: hsmClient ? hsmClient.getStatus() : { enabled: false, mode: 'software' },
    vault: vaultClient ? {
      enabled: isVaultEnabled(),
      authenticated: vaultClient.authenticated,
      address: vaultClient.config.address
    } : { enabled: false },
    secretsLoaded: Object.keys(sectorSecrets).length
  };
}

/**
 * Get sector secrets
 * @returns {object} Sector secrets map
 */
export function getSectorSecrets() {
  return { ...sectorSecrets };
}

/**
 * Set sector secrets (for environments without Vault)
 * @param {object} secrets - Sector secrets map
 */
export function setSectorSecrets(secrets) {
  sectorSecrets = { ...secrets };
}

/**
 * Load sector secrets from environment variables
 * @returns {object} Loaded secrets
 */
export function loadSecretsFromEnv() {
  const secrets = {};
  const prefix = 'SECTOR_SECRET_';

  for (const key in process.env) {
    if (key.startsWith(prefix)) {
      const sector = key.substring(prefix.length).toLowerCase();
      secrets[sector] = process.env[key];
    }
  }

  if (Object.keys(secrets).length > 0) {
    sectorSecrets = { ...sectorSecrets, ...secrets };
    console.log(`[CryptoService] Loaded ${Object.keys(secrets).length} secrets from environment`);
  }

  return secrets;
}

/**
 * Perform HMAC operation
 * Uses HSM if available, falls back to software
 * @param {string} algorithm - HMAC algorithm (sha256, sha384, sha512)
 * @param {string} key - HMAC key
 * @param {string|Buffer} data - Data to HMAC
 * @returns {Promise<Buffer>} HMAC result
 */
export async function hmac(algorithm, key, data) {
  if (hsmClient && hsmClient.initialized && hsmClient.pkcs11) {
    try {
      return await hsmClient.hmac(algorithm, key, data);
    } catch (error) {
      console.warn('[CryptoService] HSM HMAC failed, using software:', error.message);
    }
  }

  // Software fallback
  const hmacObj = crypto.createHmac(algorithm, key);
  hmacObj.update(data);
  return hmacObj.digest();
}

/**
 * Generate random bytes
 * PRIORITY: Uses HSM hardware TRNG when available, falls back to software CSPRNG
 *
 * Hardware TRNG provides higher quality entropy from certified sources:
 * - Thales Luna: FIPS 140-2 Level 3 certified TRNG
 * - SafeNet: Hardware entropy generator
 * - Utimaco: Certified physical random source
 *
 * @param {number} length - Number of bytes
 * @returns {Promise<Buffer>} Random bytes
 */
export async function randomBytes(length) {
  // Priority: Use HSM hardware TRNG when available
  if (hsmClient && hsmClient.initialized && hsmClient.trngAvailable) {
    try {
      const bytes = await hsmClient.randomBytes(length);
      // Set provenance for UIN generator
      setProvenance({
        source: hsmClient.config?.providerName || 'HSM Hardware TRNG',
        hardware: true,
        fipsLevel: hsmClient.config?.fipsLevel || 2,
        provider: hsmClient.config?.provider || 'hsm'
      });
      return bytes;
    } catch (error) {
      console.warn('[CryptoService] HSM TRNG failed, using software CSPRNG:', error.message);
    }
  }

  // Fallback to Node.js CSPRNG
  setProvenance({
    source: 'Node.js CSPRNG',
    hardware: false,
    fipsLevel: 0,
    provider: 'software'
  });
  return crypto.randomBytes(length);
}

/**
 * Generate random bytes with source information
 * @param {number} length - Number of bytes
 * @returns {Promise<{bytes: Buffer, source: string, hardware: boolean, fipsLevel: number}>}
 */
export async function randomBytesWithSource(length) {
  if (hsmClient && hsmClient.initialized && hsmClient.trngAvailable) {
    try {
      return await hsmClient.randomBytesWithSource(length);
    } catch (error) {
      console.warn('[CryptoService] HSM TRNG failed:', error.message);
    }
  }

  return {
    bytes: crypto.randomBytes(length),
    source: 'Node.js CSPRNG',
    hardware: false,
    fipsLevel: 0
  };
}

/**
 * Generate random hex string
 * @param {number} length - Number of hex characters
 * @returns {Promise<string>} Random hex string
 */
export async function randomHex(length) {
  const bytes = await randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').substring(0, length);
}

/**
 * Derive sector token using HMAC
 * @param {string} uin - Foundational UIN
 * @param {string} sector - Sector identifier
 * @param {object} options - Derivation options
 * @returns {Promise<object>} Derived token and metadata
 */
export async function deriveSectorToken(uin, sector, options = {}) {
  const normalizedSector = sector.toLowerCase().trim();
  const sectorSecret = sectorSecrets[normalizedSector];

  if (!sectorSecret) {
    throw new Error(`No secret configured for sector: ${normalizedSector}`);
  }

  const config = {
    tokenLength: options.tokenLength || 20,
    charset: options.charset || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    algorithm: options.algorithm || 'sha256',
    salt: options.salt || (await randomHex(32)),
    version: options.version || 1
  };

  // Construct derivation input
  const derivationInput = [
    `v${config.version}`,
    uin,
    normalizedSector,
    config.salt
  ].join('|');

  // Perform HMAC
  const derivedBytes = await hmac(config.algorithm, sectorSecret, derivationInput);

  // Convert to target charset
  const token = bufferToCharset(derivedBytes, config.charset, config.tokenLength);

  return {
    token,
    metadata: {
      sector: normalizedSector,
      version: config.version,
      algorithm: config.algorithm,
      salt: config.salt,
      tokenLength: config.tokenLength,
      derivedAt: new Date().toISOString(),
      hsmUsed: !!(hsmClient && hsmClient.pkcs11)
    }
  };
}

/**
 * Convert buffer to charset string
 * @param {Buffer} buffer - Input buffer
 * @param {string} charset - Target charset
 * @param {number} targetLength - Desired length
 * @returns {string} Encoded string
 */
function bufferToCharset(buffer, charset, targetLength) {
  const charsetArray = charset.split('');
  const charsetLength = charsetArray.length;

  let result = '';
  let bufferIndex = 0;

  while (result.length < targetLength && bufferIndex < buffer.length) {
    const byte = buffer[bufferIndex];
    const charIndex = byte % charsetLength;
    result += charsetArray[charIndex];
    bufferIndex++;
  }

  // If we need more characters, hash the buffer again
  if (result.length < targetLength) {
    const hash = crypto.createHash('sha256').update(buffer).digest();
    return bufferToCharset(
      Buffer.concat([buffer, hash]),
      charset,
      targetLength
    );
  }

  return result.substring(0, targetLength);
}

/**
 * Verify sector token
 * @param {string} token - Token to verify
 * @param {string} uin - Foundational UIN
 * @param {string} sector - Sector identifier
 * @param {object} metadata - Token metadata
 * @returns {Promise<boolean>} Verification result
 */
export async function verifySectorToken(token, uin, sector, metadata) {
  try {
    const { token: recomputedToken } = await deriveSectorToken(uin, sector, {
      tokenLength: metadata.tokenLength || token.length,
      algorithm: metadata.algorithm,
      salt: metadata.salt,
      version: metadata.version,
      charset: metadata.charset || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    });

    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(recomputedToken)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Reload secrets from Vault
 * @returns {Promise<object>} Reloaded secrets
 */
export async function reloadSecrets() {
  if (vaultClient && vaultClient.authenticated) {
    try {
      vaultClient.clearCache();
      sectorSecrets = await vaultClient.getSectorSecrets();
      console.log('[CryptoService] Secrets reloaded from Vault');
      return { success: true, count: Object.keys(sectorSecrets).length };
    } catch (error) {
      console.error('[CryptoService] Failed to reload secrets:', error.message);
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: 'Vault not available' };
}

/**
 * Shutdown crypto service
 */
export async function shutdown() {
  if (hsmClient) {
    await hsmClient.close();
  }

  initialized = false;
  hsmClient = null;
  vaultClient = null;
  sectorSecrets = {};

  console.log('[CryptoService] Shutdown complete');
}

export default {
  initializeCryptoService,
  getStatus,
  getSectorSecrets,
  setSectorSecrets,
  loadSecretsFromEnv,
  hmac,
  randomBytes,
  randomHex,
  deriveSectorToken,
  verifySectorToken,
  reloadSecrets,
  shutdown
};
