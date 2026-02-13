/**
 * HashiCorp Vault Integration Module
 * Provides secure secret management for OSIA UIN Generator
 */

import https from 'https';
import http from 'http';

/**
 * Vault client configuration
 */
const DEFAULT_CONFIG = {
  address: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
  token: process.env.VAULT_TOKEN || '',
  roleId: process.env.VAULT_ROLE_ID || '',
  secretId: process.env.VAULT_SECRET_ID || '',
  namespace: process.env.VAULT_NAMESPACE || '',
  mountPath: 'osia',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000
};

/**
 * Vault client class
 */
export class VaultClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.token = this.config.token;
    this.authenticated = !!this.token;
    this.tokenExpiry = null;
    this.secretsCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Make HTTP request to Vault
   * @param {string} method - HTTP method
   * @param {string} path - API path
   * @param {object} data - Request body
   * @returns {Promise<object>} Response data
   */
  async request(method, path, data = null) {
    const url = new URL(path, this.config.address);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: this.config.timeout
    };

    // Skip TLS verification if VAULT_SKIP_VERIFY is set (matches Vault CLI convention)
    if (isHttps && (process.env.VAULT_SKIP_VERIFY === '1' || process.env.VAULT_SKIP_VERIFY === 'true')) {
      options.rejectUnauthorized = false;
    }

    // Add authentication token
    if (this.token) {
      options.headers['X-Vault-Token'] = this.token;
    }

    // Add namespace if configured
    if (this.config.namespace) {
      options.headers['X-Vault-Namespace'] = this.config.namespace;
    }

    return new Promise((resolve, reject) => {
      const req = transport.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(response.errors?.join(', ') || `Vault request failed: ${res.statusCode}`));
            }
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ raw: body });
            } else {
              reject(new Error(`Vault request failed: ${res.statusCode}`));
            }
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Vault request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  /**
   * Authenticate using AppRole
   * @param {string} roleId - AppRole role ID
   * @param {string} secretId - AppRole secret ID
   * @returns {Promise<boolean>} Authentication success
   */
  async authenticateAppRole(roleId = null, secretId = null) {
    const role = roleId || this.config.roleId;
    const secret = secretId || this.config.secretId;

    if (!role || !secret) {
      throw new Error('AppRole role_id and secret_id are required');
    }

    try {
      const response = await this.request('POST', '/v1/auth/approle/login', {
        role_id: role,
        secret_id: secret
      });

      this.token = response.auth.client_token;
      this.tokenExpiry = Date.now() + (response.auth.lease_duration * 1000);
      this.authenticated = true;

      console.log('[Vault] AppRole authentication successful');
      return true;
    } catch (error) {
      console.error('[Vault] AppRole authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if token is valid and not expired
   * @returns {boolean} Token validity
   */
  isTokenValid() {
    if (!this.token || !this.authenticated) {
      return false;
    }
    if (this.tokenExpiry && Date.now() > this.tokenExpiry - 60000) {
      return false; // Token expires within 1 minute
    }
    return true;
  }

  /**
   * Renew token if needed
   * @returns {Promise<boolean>} Renewal success
   */
  async renewToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.request('POST', '/v1/auth/token/renew-self');
      this.tokenExpiry = Date.now() + (response.auth.lease_duration * 1000);
      console.log('[Vault] Token renewed successfully');
      return true;
    } catch (error) {
      console.error('[Vault] Token renewal failed:', error.message);
      return false;
    }
  }

  /**
   * Read secret from KV v2
   * @param {string} path - Secret path
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<object>} Secret data
   */
  async readSecret(path, useCache = true) {
    const fullPath = `/v1/${this.config.mountPath}/data/${path}`;
    const cacheKey = fullPath;

    // Check cache
    if (useCache && this.secretsCache.has(cacheKey)) {
      const cached = this.secretsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.secretsCache.delete(cacheKey);
    }

    // Ensure authenticated
    if (!this.isTokenValid()) {
      if (this.config.roleId && this.config.secretId) {
        await this.authenticateAppRole();
      } else {
        throw new Error('Vault authentication required');
      }
    }

    const response = await this.request('GET', fullPath);
    const data = response.data?.data || response.data;

    // Cache the result
    if (useCache) {
      this.secretsCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  }

  /**
   * Write secret to KV v2
   * @param {string} path - Secret path
   * @param {object} data - Secret data
   * @returns {Promise<object>} Write response
   */
  async writeSecret(path, data) {
    const fullPath = `/v1/${this.config.mountPath}/data/${path}`;

    // Ensure authenticated
    if (!this.isTokenValid()) {
      if (this.config.roleId && this.config.secretId) {
        await this.authenticateAppRole();
      } else {
        throw new Error('Vault authentication required');
      }
    }

    const response = await this.request('POST', fullPath, { data });

    // Invalidate cache
    this.secretsCache.delete(fullPath);

    return response;
  }

  /**
   * Get sector secrets from Vault
   * @returns {Promise<object>} Map of sector to secret
   */
  async getSectorSecrets() {
    try {
      return await this.readSecret('sector-secrets');
    } catch (error) {
      console.error('[Vault] Failed to read sector secrets:', error.message);
      throw error;
    }
  }

  /**
   * Get database credentials from Vault
   * @returns {Promise<object>} Database configuration
   */
  async getDatabaseCredentials() {
    try {
      return await this.readSecret('database');
    } catch (error) {
      console.error('[Vault] Failed to read database credentials:', error.message);
      throw error;
    }
  }

  /**
   * Get HSM configuration from Vault
   * @returns {Promise<object>} HSM configuration
   */
  async getHsmConfig() {
    try {
      return await this.readSecret('hsm');
    } catch (error) {
      console.error('[Vault] Failed to read HSM config:', error.message);
      throw error;
    }
  }

  /**
   * Check Vault health
   * @returns {Promise<object>} Health status
   */
  async health() {
    try {
      const response = await this.request('GET', '/v1/sys/health');
      return {
        initialized: response.initialized,
        sealed: response.sealed,
        standby: response.standby,
        version: response.version
      };
    } catch (error) {
      return {
        error: error.message,
        available: false
      };
    }
  }

  /**
   * Clear secrets cache
   */
  clearCache() {
    this.secretsCache.clear();
  }
}

// Singleton instance
let vaultClient = null;

/**
 * Get Vault client instance
 * @param {object} config - Configuration override
 * @returns {VaultClient} Vault client
 */
export function getVaultClient(config = {}) {
  if (!vaultClient) {
    vaultClient = new VaultClient(config);
  }
  return vaultClient;
}

/**
 * Check if Vault is enabled
 * @returns {boolean} Vault enabled status
 */
export function isVaultEnabled() {
  const enabled = process.env.VAULT_ENABLED;
  return enabled === 'true' || enabled === '1';
}

/**
 * Initialize Vault client with AppRole authentication
 * @param {object} config - Configuration
 * @returns {Promise<VaultClient>} Authenticated client
 */
export async function initializeVault(config = {}) {
  const client = getVaultClient(config);

  if (client.config.roleId && client.config.secretId) {
    await client.authenticateAppRole();
  } else if (client.config.token) {
    client.authenticated = true;
  }

  return client;
}

export default {
  VaultClient,
  getVaultClient,
  isVaultEnabled,
  initializeVault
};
