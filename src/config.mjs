/**
 * Configuration Module for UIN Generator
 * Loads configuration from environment variables with sensible defaults
 * Supports HashiCorp Vault and HSM integration
 */

import { isVaultEnabled, getVaultClient } from './vault.mjs';
import { isHsmEnabled } from './hsm.mjs';

/**
 * Default character sets
 */
export const CHARSETS = {
  NUMERIC: '0123456789',
  ALPHA_UPPER: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ALPHA_LOWER: 'abcdefghijklmnopqrstuvwxyz',
  ALPHANUMERIC: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ALPHANUMERIC_LOWER: '0123456789abcdefghijklmnopqrstuvwxyz',
  ALPHANUMERIC_MIXED: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  // Exclude ambiguous characters (0, O, I, 1, l)
  ALPHANUMERIC_SAFE: '23456789ABCDEFGHJKLMNPQRSTUVWXYZ',
  HEX: '0123456789ABCDEF',
  HEX_LOWER: '0123456789abcdef'
};

/**
 * Parse charset specification
 * Supports predefined names or custom character strings
 * @param {string} charsetSpec - Charset specification
 * @returns {string} Character set string
 */
export function parseCharset(charsetSpec) {
  if (!charsetSpec) {
    return CHARSETS.ALPHANUMERIC;
  }

  // Check if it's a predefined charset name
  const upperSpec = charsetSpec.toUpperCase().replace(/[-_]/g, '');

  if (upperSpec === 'NUMERIC' || upperSpec === '09') {
    return CHARSETS.NUMERIC;
  }
  if (upperSpec === 'ALPHAUPPER' || upperSpec === 'AZ') {
    return CHARSETS.ALPHA_UPPER;
  }
  if (upperSpec === 'ALPHALOWER' || upperSpec === 'az') {
    return CHARSETS.ALPHA_LOWER;
  }
  if (upperSpec === 'ALPHANUMERIC' || upperSpec === 'AZ09') {
    return CHARSETS.ALPHANUMERIC;
  }
  if (upperSpec === 'ALPHANUMERICSAFE' || upperSpec === 'SAFE') {
    return CHARSETS.ALPHANUMERIC_SAFE;
  }
  if (upperSpec === 'HEX') {
    return CHARSETS.HEX;
  }

  // Otherwise, treat it as a literal character set
  return charsetSpec;
}

/**
 * Exclude ambiguous characters from a charset
 * @param {string} charset - Input charset
 * @returns {string} Charset without ambiguous characters
 */
export function excludeAmbiguous(charset) {
  const ambiguous = ['0', 'O', 'o', 'I', 'l', '1'];
  let result = charset;

  for (const char of ambiguous) {
    result = result.replace(new RegExp(char, 'g'), '');
  }

  return result;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  // Default UIN settings
  defaultCharset: CHARSETS.ALPHANUMERIC,
  defaultLength: 19,
  defaultMode: 'foundational',

  // Checksum defaults
  defaultChecksumAlgorithm: 'iso7064',

  // Supported sectors (can be extended)
  supportedSectors: [
    'health',
    'tax',
    'finance',
    'telco',
    'stats',
    'education',
    'social',
    'government'
  ],

  // Server configuration
  serverPort: 19020,
  serverHost: '0.0.0.0',

  // Database configuration
  db: {
    host: process.env.PGHOST,
    port: 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    name: 'osia_dev'
  },

  // Security
  enableCors: true,
  corsOrigin: '*',  // For dev only; restrict in production

  // Logging
  logLevel: 'info',

  // Vault configuration
  vault: {
    enabled: false,
    address: 'http://127.0.0.1:8200',
    roleId: '',
    secretId: '',
    namespace: ''
  },

  // HSM configuration
  hsm: {
    enabled: false,
    provider: 'softhsm',
    library: '/usr/lib/softhsm/libsofthsm2.so',
    slot: 0,
    pin: '',
    keyLabel: 'osia-sector-key'
  }
};

/**
 * Load sector secrets from environment
 * Format: SECTOR_SECRET_<SECTOR_NAME>=<secret>
 * @returns {object} Map of sector to secret
 */
function loadSectorSecrets() {
  const secrets = {};
  const prefix = 'SECTOR_SECRET_';

  for (const key in process.env) {
    if (key.startsWith(prefix)) {
      const sector = key.substring(prefix.length).toLowerCase();
      secrets[sector] = process.env[key];
    }
  }

  // Provide default dev secrets if none configured (INSECURE - dev only!)
  if (Object.keys(secrets).length === 0) {
    console.warn('WARNING: No sector secrets found in environment. Using default dev secrets (INSECURE).');
    DEFAULT_CONFIG.supportedSectors.forEach(sector => {
      secrets[sector] = `dev-secret-${sector}-DO-NOT-USE-IN-PRODUCTION`;
    });
  }

  return secrets;
}

/**
 * Load configuration from environment
 * @returns {object} Configuration object
 */
export function loadConfig() {
  const config = {
    // UIN settings
    defaultCharset: parseCharset(process.env.UIN_DEFAULT_CHARSET) || DEFAULT_CONFIG.defaultCharset,
    defaultLength: parseInt(process.env.UIN_DEFAULT_LENGTH || DEFAULT_CONFIG.defaultLength),
    defaultMode: process.env.UIN_DEFAULT_MODE || DEFAULT_CONFIG.defaultMode,

    // Checksum
    defaultChecksumAlgorithm: process.env.UIN_CHECKSUM_ALGORITHM || DEFAULT_CONFIG.defaultChecksumAlgorithm,

    // Sectors
    supportedSectors: process.env.UIN_SUPPORTED_SECTORS
      ? process.env.UIN_SUPPORTED_SECTORS.split(',').map(s => s.trim())
      : DEFAULT_CONFIG.supportedSectors,
    sectorSecrets: loadSectorSecrets(),

    // Server
    serverPort: parseInt(process.env.PORT || process.env.UIN_PORT || DEFAULT_CONFIG.serverPort),
    serverHost: process.env.HOST || process.env.UIN_HOST || DEFAULT_CONFIG.serverHost,

    // Database
    db: {
      host: process.env.OSIA_DB_HOST || DEFAULT_CONFIG.db.host,
      port: parseInt(process.env.OSIA_DB_PORT || DEFAULT_CONFIG.db.port),
      user: process.env.OSIA_DB_USER || DEFAULT_CONFIG.db.user,
      password: process.env.OSIA_DB_PASSWORD || DEFAULT_CONFIG.db.password,
      name: process.env.OSIA_DB_NAME || DEFAULT_CONFIG.db.name
    },

    // Security
    enableCors: process.env.UIN_ENABLE_CORS !== 'false',
    corsOrigin: process.env.UIN_CORS_ORIGIN || DEFAULT_CONFIG.corsOrigin,

    // Logging
    logLevel: process.env.LOG_LEVEL || process.env.UIN_LOG_LEVEL || DEFAULT_CONFIG.logLevel,

    // Vault configuration
    vault: {
      enabled: isVaultEnabled(),
      address: process.env.VAULT_ADDR || DEFAULT_CONFIG.vault.address,
      token: process.env.VAULT_TOKEN || '',
      roleId: process.env.VAULT_ROLE_ID || DEFAULT_CONFIG.vault.roleId,
      secretId: process.env.VAULT_SECRET_ID || DEFAULT_CONFIG.vault.secretId,
      namespace: process.env.VAULT_NAMESPACE || DEFAULT_CONFIG.vault.namespace
    },

    // HSM configuration
    hsm: {
      enabled: isHsmEnabled(),
      provider: process.env.HSM_PROVIDER || DEFAULT_CONFIG.hsm.provider,
      library: process.env.HSM_LIBRARY || DEFAULT_CONFIG.hsm.library,
      slot: parseInt(process.env.HSM_SLOT || DEFAULT_CONFIG.hsm.slot),
      pin: process.env.HSM_PIN || DEFAULT_CONFIG.hsm.pin,
      keyLabel: process.env.HSM_KEY_LABEL || DEFAULT_CONFIG.hsm.keyLabel
    }
  };

  return config;
}

/**
 * Validate configuration
 * @param {object} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config) {
  if (config.defaultLength < 8) {
    throw new Error('Default UIN length must be at least 8');
  }

  if (config.defaultLength > 64) {
    throw new Error('Default UIN length must not exceed 64');
  }

  if (!config.defaultCharset || config.defaultCharset.length < 2) {
    throw new Error('Default charset must contain at least 2 characters');
  }

  if (config.serverPort < 1 || config.serverPort > 65535) {
    throw new Error('Server port must be between 1 and 65535');
  }

  if (Object.keys(config.sectorSecrets).length === 0) {
    throw new Error('At least one sector secret must be configured');
  }
}

/**
 * Get configuration instance
 */
let configInstance = null;

export function getConfig() {
  if (!configInstance) {
    configInstance = loadConfig();
    validateConfig(configInstance);
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig() {
  configInstance = null;
}

export default {
  getConfig,
  loadConfig,
  validateConfig,
  resetConfig,
  parseCharset,
  excludeAmbiguous,
  CHARSETS
};
