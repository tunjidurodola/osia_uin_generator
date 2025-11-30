/**
 * HSM (Hardware Security Module) Integration Module
 * Provides PKCS#11 interface for cryptographic operations
 * Supports SoftHSM, Thales, AWS CloudHSM, YubiHSM
 */

import crypto from 'crypto';

/**
 * HSM provider configurations
 */
const HSM_PROVIDERS = {
  softhsm: {
    name: 'SoftHSM',
    library: '/usr/lib/softhsm/libsofthsm2.so',
    altLibraries: [
      '/usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so',
      '/usr/local/lib/softhsm/libsofthsm2.so',
      '/opt/softhsm/lib/libsofthsm2.so'
    ]
  },
  thales: {
    name: 'Thales Luna',
    library: '/usr/lib/libCryptoki2_64.so',
    altLibraries: [
      '/opt/safenet/lunaclient/lib/libCryptoki2_64.so'
    ]
  },
  'aws-cloudhsm': {
    name: 'AWS CloudHSM',
    library: '/opt/cloudhsm/lib/libcloudhsm_pkcs11.so',
    altLibraries: []
  },
  yubihsm: {
    name: 'YubiHSM',
    library: '/usr/lib/libyubihsm_pkcs11.so',
    altLibraries: [
      '/usr/local/lib/libyubihsm_pkcs11.so'
    ]
  },
  'azure-keyvault': {
    name: 'Azure Key Vault',
    library: null, // Uses Azure SDK instead
    altLibraries: []
  }
};

/**
 * HSM configuration defaults
 */
const DEFAULT_CONFIG = {
  provider: process.env.HSM_PROVIDER || 'softhsm',
  library: process.env.HSM_LIBRARY || '',
  slot: parseInt(process.env.HSM_SLOT || '0'),
  pin: process.env.HSM_PIN || '',
  keyLabel: process.env.HSM_KEY_LABEL || 'osia-sector-key',
  enabled: process.env.HSM_ENABLED === 'true'
};

/**
 * HSM Client class
 * Provides interface for HSM cryptographic operations
 */
export class HsmClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialized = false;
    this.session = null;
    this.keyHandle = null;
    this.pkcs11 = null;
    this.providerInfo = HSM_PROVIDERS[this.config.provider];
  }

  /**
   * Check if HSM is available
   * @returns {Promise<boolean>} Availability status
   */
  async isAvailable() {
    if (!this.config.enabled) {
      return false;
    }

    // For software fallback mode, always available
    if (this.config.provider === 'software') {
      return true;
    }

    try {
      // Check if PKCS#11 library exists
      const fs = await import('fs');
      const libraryPath = this.config.library || this.providerInfo?.library;

      if (!libraryPath) {
        return false;
      }

      return fs.existsSync(libraryPath);
    } catch (error) {
      console.error('[HSM] Availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Initialize HSM connection
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    if (!this.config.enabled) {
      console.log('[HSM] HSM is disabled, using software fallback');
      this.initialized = true;
      return true;
    }

    try {
      // Try to load graphene-pk11 for PKCS#11 support
      const graphene = await this.loadPkcs11Module();

      if (graphene) {
        await this.initializePkcs11(graphene);
      } else {
        console.log('[HSM] PKCS#11 module not available, using software fallback');
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[HSM] Initialization failed:', error.message);
      console.log('[HSM] Falling back to software cryptography');
      this.initialized = true;
      return true;
    }
  }

  /**
   * Load PKCS#11 module
   * @returns {Promise<object|null>} PKCS#11 module or null
   */
  async loadPkcs11Module() {
    try {
      // Try to dynamically import graphene-pk11
      const graphene = await import('graphene-pk11');
      return graphene;
    } catch (error) {
      // PKCS#11 module not installed
      return null;
    }
  }

  /**
   * Initialize PKCS#11 session
   * @param {object} graphene - PKCS#11 module
   */
  async initializePkcs11(graphene) {
    const libraryPath = this.config.library || this.providerInfo?.library;

    if (!libraryPath) {
      throw new Error(`No library path for HSM provider: ${this.config.provider}`);
    }

    // Initialize PKCS#11
    this.pkcs11 = new graphene.Module();
    this.pkcs11.load(libraryPath);
    this.pkcs11.initialize();

    // Get slot
    const slots = this.pkcs11.getSlots(true);
    if (slots.length <= this.config.slot) {
      throw new Error(`HSM slot ${this.config.slot} not found`);
    }

    const slot = slots.items(this.config.slot);

    // Open session
    this.session = slot.open(
      graphene.SessionFlag.RW_SESSION | graphene.SessionFlag.SERIAL_SESSION
    );

    // Login if PIN provided
    if (this.config.pin) {
      this.session.login(this.config.pin, graphene.UserType.USER);
    }

    // Find or create key
    await this.findOrCreateKey(graphene);

    console.log(`[HSM] Initialized ${this.providerInfo?.name || this.config.provider} HSM`);
  }

  /**
   * Find or create HMAC key in HSM
   * @param {object} graphene - PKCS#11 module
   */
  async findOrCreateKey(graphene) {
    // Search for existing key
    const objects = this.session.find({
      class: graphene.ObjectClass.SECRET_KEY,
      label: this.config.keyLabel
    });

    if (objects.length > 0) {
      this.keyHandle = objects.items(0);
      console.log(`[HSM] Found existing key: ${this.config.keyLabel}`);
      return;
    }

    // Create new key if not found
    console.log(`[HSM] Creating new key: ${this.config.keyLabel}`);

    this.keyHandle = this.session.generateKey(
      graphene.KeyGenMechanism.AES,
      {
        class: graphene.ObjectClass.SECRET_KEY,
        keyType: graphene.KeyType.AES,
        label: this.config.keyLabel,
        token: true,
        private: true,
        sensitive: true,
        extractable: false,
        sign: true,
        verify: true,
        valueLen: 32 // 256-bit key
      }
    );
  }

  /**
   * Perform HMAC operation using HSM or software fallback
   * @param {string} algorithm - HMAC algorithm
   * @param {string} key - Key for HMAC (used in software mode)
   * @param {string} data - Data to HMAC
   * @returns {Promise<Buffer>} HMAC result
   */
  async hmac(algorithm, key, data) {
    // Use software fallback if HSM not available
    if (!this.pkcs11 || !this.keyHandle) {
      return this.softwareHmac(algorithm, key, data);
    }

    try {
      // Use HSM for HMAC
      const graphene = await import('graphene-pk11');

      const mechanism = this.getMechanism(algorithm, graphene);
      const signature = this.session.createSign(mechanism, this.keyHandle)
        .once(Buffer.from(data));

      return signature;
    } catch (error) {
      console.warn('[HSM] HMAC failed, falling back to software:', error.message);
      return this.softwareHmac(algorithm, key, data);
    }
  }

  /**
   * Get PKCS#11 mechanism for algorithm
   * @param {string} algorithm - Algorithm name
   * @param {object} graphene - PKCS#11 module
   * @returns {object} Mechanism
   */
  getMechanism(algorithm, graphene) {
    const mechanisms = {
      'sha256': graphene.MechanismEnum.SHA256_HMAC,
      'sha384': graphene.MechanismEnum.SHA384_HMAC,
      'sha512': graphene.MechanismEnum.SHA512_HMAC
    };

    return { mechanism: mechanisms[algorithm.toLowerCase()] || mechanisms.sha256 };
  }

  /**
   * Software HMAC fallback
   * @param {string} algorithm - HMAC algorithm
   * @param {string} key - HMAC key
   * @param {string} data - Data to HMAC
   * @returns {Buffer} HMAC result
   */
  softwareHmac(algorithm, key, data) {
    const hmac = crypto.createHmac(algorithm, key);
    hmac.update(data);
    return hmac.digest();
  }

  /**
   * Generate random bytes using HSM or software fallback
   * @param {number} length - Number of bytes
   * @returns {Promise<Buffer>} Random bytes
   */
  async randomBytes(length) {
    // Use software fallback if HSM not available
    if (!this.session) {
      return crypto.randomBytes(length);
    }

    try {
      return this.session.generateRandom(length);
    } catch (error) {
      console.warn('[HSM] Random generation failed, falling back to software:', error.message);
      return crypto.randomBytes(length);
    }
  }

  /**
   * Sign data using HSM or software fallback
   * @param {string} algorithm - Signature algorithm
   * @param {Buffer} data - Data to sign
   * @param {string} key - Key for software fallback
   * @returns {Promise<Buffer>} Signature
   */
  async sign(algorithm, data, key) {
    // Use software fallback if HSM not available
    if (!this.pkcs11 || !this.keyHandle) {
      const sign = crypto.createSign(algorithm);
      sign.update(data);
      return sign.sign(key);
    }

    try {
      const graphene = await import('graphene-pk11');
      const mechanism = this.getMechanism(algorithm, graphene);

      return this.session.createSign(mechanism, this.keyHandle)
        .once(data);
    } catch (error) {
      console.warn('[HSM] Sign failed, falling back to software:', error.message);
      const sign = crypto.createSign(algorithm);
      sign.update(data);
      return sign.sign(key);
    }
  }

  /**
   * Get HSM status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      initialized: this.initialized,
      provider: this.config.provider,
      providerName: this.providerInfo?.name || 'Unknown',
      hasHardware: !!this.pkcs11,
      slot: this.config.slot,
      keyLabel: this.config.keyLabel,
      mode: this.pkcs11 ? 'hardware' : 'software'
    };
  }

  /**
   * Close HSM session
   */
  async close() {
    if (this.session) {
      try {
        this.session.logout();
        this.session.close();
      } catch (error) {
        // Ignore close errors
      }
      this.session = null;
    }

    if (this.pkcs11) {
      try {
        this.pkcs11.finalize();
      } catch (error) {
        // Ignore finalize errors
      }
      this.pkcs11 = null;
    }

    this.initialized = false;
    this.keyHandle = null;
  }
}

// Singleton instance
let hsmClient = null;

/**
 * Get HSM client instance
 * @param {object} config - Configuration override
 * @returns {HsmClient} HSM client
 */
export function getHsmClient(config = {}) {
  if (!hsmClient) {
    hsmClient = new HsmClient(config);
  }
  return hsmClient;
}

/**
 * Check if HSM is enabled
 * @returns {boolean} HSM enabled status
 */
export function isHsmEnabled() {
  const enabled = process.env.HSM_ENABLED;
  return enabled === 'true' || enabled === '1';
}

/**
 * Initialize HSM client
 * @param {object} config - Configuration
 * @returns {Promise<HsmClient>} Initialized client
 */
export async function initializeHsm(config = {}) {
  const client = getHsmClient(config);
  await client.initialize();
  return client;
}

export default {
  HsmClient,
  getHsmClient,
  isHsmEnabled,
  initializeHsm,
  HSM_PROVIDERS
};
