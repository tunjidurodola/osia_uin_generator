/**
 * HSM (Hardware Security Module) Integration Module
 * Provides PKCS#11 interface for cryptographic operations
 *
 * PRIORITY: Hardware TRNG (True Random Number Generator) is preferred over
 * software CSPRNG when an HSM is available. HSMs like Thales, SafeNet, and
 * Utimaco provide certified hardware entropy sources.
 *
 * Supported HSM Providers:
 * - Thales Luna (Network HSM, Luna SA/PCIe)
 * - SafeNet (Luna, ProtectServer)
 * - Utimaco (SecurityServer, CryptoServer)
 * - nCipher/Entrust (nShield)
 * - AWS CloudHSM
 * - YubiHSM
 * - SoftHSM (Development/Testing only)
 */

import crypto from 'crypto';

/**
 * HSM provider configurations with priority order
 * Production HSMs are listed first, SoftHSM last (development only)
 */
const HSM_PROVIDERS = {
  // Thales Luna HSM - Enterprise grade
  thales: {
    name: 'Thales Luna',
    type: 'production',
    hasTrng: true,
    fipsLevel: 3,
    library: '/usr/lib/libCryptoki2_64.so',
    altLibraries: [
      '/opt/safenet/lunaclient/lib/libCryptoki2_64.so',
      '/usr/safenet/lunaclient/lib/libCryptoki2_64.so',
      '/opt/thales/dpod/lib/libCryptoki2_64.so'
    ],
    description: 'Thales Luna Network HSM with FIPS 140-2 Level 3 certification'
  },

  // SafeNet ProtectServer / Luna (legacy)
  safenet: {
    name: 'SafeNet',
    type: 'production',
    hasTrng: true,
    fipsLevel: 3,
    library: '/opt/safenet/protectserver/lib/libcryptoki.so',
    altLibraries: [
      '/opt/safenet/lunaclient/lib/libCryptoki2_64.so',
      '/usr/lib/libsafenet.so',
      '/opt/PTK/lib/libcryptoki.so'
    ],
    description: 'SafeNet ProtectServer with hardware TRNG'
  },

  // Utimaco SecurityServer / CryptoServer
  utimaco: {
    name: 'Utimaco',
    type: 'production',
    hasTrng: true,
    fipsLevel: 3,
    library: '/opt/utimaco/lib/libcs_pkcs11_R3.so',
    altLibraries: [
      '/opt/utimaco/cryptoserver/lib/libcs_pkcs11_R3.so',
      '/usr/lib/utimaco/libcs_pkcs11_R3.so',
      '/opt/Utimaco/Software/PKCS11/lib/libcs_pkcs11_R3.so',
      '/opt/CryptoServer/lib/libcs_pkcs11_R3.so'
    ],
    description: 'Utimaco CryptoServer/SecurityServer with certified TRNG'
  },

  // nCipher/Entrust nShield
  ncipher: {
    name: 'nCipher/Entrust nShield',
    type: 'production',
    hasTrng: true,
    fipsLevel: 3,
    library: '/opt/nfast/toolkits/pkcs11/libcknfast.so',
    altLibraries: [
      '/usr/lib/libcknfast.so',
      '/opt/nfast/lib/libcknfast.so'
    ],
    description: 'Entrust nShield HSM with hardware entropy'
  },

  // AWS CloudHSM
  'aws-cloudhsm': {
    name: 'AWS CloudHSM',
    type: 'cloud',
    hasTrng: true,
    fipsLevel: 3,
    library: '/opt/cloudhsm/lib/libcloudhsm_pkcs11.so',
    altLibraries: [
      '/opt/aws-cloudhsm/lib/libcloudhsm_pkcs11.so'
    ],
    description: 'AWS CloudHSM with FIPS 140-2 Level 3 validation'
  },

  // Azure Dedicated HSM (Thales Luna-based)
  'azure-hsm': {
    name: 'Azure Dedicated HSM',
    type: 'cloud',
    hasTrng: true,
    fipsLevel: 3,
    library: '/opt/safenet/lunaclient/lib/libCryptoki2_64.so',
    altLibraries: [],
    description: 'Azure Dedicated HSM (Thales Luna Network HSM)'
  },

  // YubiHSM 2
  yubihsm: {
    name: 'YubiHSM 2',
    type: 'compact',
    hasTrng: true,
    fipsLevel: 2,
    library: '/usr/lib/libyubihsm_pkcs11.so',
    altLibraries: [
      '/usr/local/lib/libyubihsm_pkcs11.so',
      '/usr/lib/x86_64-linux-gnu/libyubihsm_pkcs11.so'
    ],
    description: 'YubiHSM 2 compact USB HSM with hardware RNG'
  },

  // SoftHSM - Development/Testing ONLY
  softhsm: {
    name: 'SoftHSM',
    type: 'development',
    hasTrng: false, // Uses software PRNG
    fipsLevel: 0,
    library: '/usr/lib/softhsm/libsofthsm2.so',
    altLibraries: [
      '/usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so',
      '/usr/local/lib/softhsm/libsofthsm2.so',
      '/opt/softhsm/lib/libsofthsm2.so'
    ],
    description: 'Software HSM for development only - NO hardware TRNG'
  }
};

/**
 * Priority order for HSM detection (production HSMs first)
 */
const HSM_PRIORITY_ORDER = [
  'thales',
  'safenet',
  'utimaco',
  'ncipher',
  'aws-cloudhsm',
  'azure-hsm',
  'yubihsm',
  'softhsm'
];

/**
 * HSM configuration defaults
 */
const DEFAULT_CONFIG = {
  provider: process.env.HSM_PROVIDER || 'auto',
  library: process.env.HSM_LIBRARY || '',
  slot: parseInt(process.env.HSM_SLOT || '0'),
  pin: process.env.HSM_PIN || '',
  keyLabel: process.env.HSM_KEY_LABEL || 'osia-sector-key',
  enabled: process.env.HSM_ENABLED === 'true',
  preferHardwareTrng: true // Always prefer hardware TRNG when available
};

/**
 * HSM Client class
 * Provides interface for HSM cryptographic operations with TRNG priority
 */
export class HsmClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialized = false;
    this.session = null;
    this.keyHandle = null;
    this.pkcs11 = null;
    this.providerInfo = null;
    this.detectedProvider = null;
    this.trngAvailable = false;
  }

  /**
   * Auto-detect available HSM by priority
   * Prefers production HSMs with hardware TRNG
   * @returns {Promise<{provider: string, info: object}|null>}
   */
  async autoDetectHsm() {
    const fs = await import('fs');

    for (const providerName of HSM_PRIORITY_ORDER) {
      const provider = HSM_PROVIDERS[providerName];
      if (!provider) continue;

      // Check primary library path
      if (provider.library && fs.existsSync(provider.library)) {
        console.log(`[HSM] Detected ${provider.name} at ${provider.library}`);
        return { provider: providerName, info: provider, library: provider.library };
      }

      // Check alternative library paths
      for (const altLib of provider.altLibraries || []) {
        if (fs.existsSync(altLib)) {
          console.log(`[HSM] Detected ${provider.name} at ${altLib}`);
          return { provider: providerName, info: provider, library: altLib };
        }
      }
    }

    return null;
  }

  /**
   * Check if HSM is available
   * @returns {Promise<boolean>} Availability status
   */
  async isAvailable() {
    if (!this.config.enabled) {
      return false;
    }

    // For software fallback mode
    if (this.config.provider === 'software') {
      return true;
    }

    try {
      // Auto-detect if provider is 'auto'
      if (this.config.provider === 'auto') {
        const detected = await this.autoDetectHsm();
        return detected !== null;
      }

      // Check specific provider
      const fs = await import('fs');
      const providerInfo = HSM_PROVIDERS[this.config.provider];
      const libraryPath = this.config.library || providerInfo?.library;

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
   * Prioritizes hardware TRNG when available
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    if (!this.config.enabled) {
      console.log('[HSM] HSM is disabled, using software CSPRNG');
      this.initialized = true;
      return true;
    }

    try {
      // Auto-detect HSM if provider is 'auto'
      let libraryPath = this.config.library;
      let providerName = this.config.provider;

      if (this.config.provider === 'auto' || !this.config.library) {
        const detected = await this.autoDetectHsm();
        if (detected) {
          providerName = detected.provider;
          libraryPath = detected.library;
          this.providerInfo = detected.info;
          this.detectedProvider = providerName;
        }
      } else {
        this.providerInfo = HSM_PROVIDERS[this.config.provider];
        this.detectedProvider = this.config.provider;
      }

      // Try to load graphene-pk11 for PKCS#11 support
      const graphene = await this.loadPkcs11Module();

      if (graphene && libraryPath) {
        await this.initializePkcs11(graphene, libraryPath);

        // Check if hardware TRNG is available
        this.trngAvailable = this.providerInfo?.hasTrng === true && this.session !== null;

        if (this.trngAvailable) {
          console.log(`[HSM] Hardware TRNG available via ${this.providerInfo.name}`);
        } else if (this.providerInfo?.type === 'development') {
          console.warn('[HSM] WARNING: SoftHSM detected - NO hardware TRNG, using software PRNG');
        }
      } else {
        console.log('[HSM] PKCS#11 module not available, using software CSPRNG');
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[HSM] Initialization failed:', error.message);
      console.log('[HSM] Falling back to software CSPRNG');
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
   * @param {string} libraryPath - Path to PKCS#11 library
   */
  async initializePkcs11(graphene, libraryPath) {
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

    const providerName = this.providerInfo?.name || this.config.provider;
    const trngStatus = this.providerInfo?.hasTrng ? 'with hardware TRNG' : 'with software PRNG';
    console.log(`[HSM] Initialized ${providerName} ${trngStatus}`);
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
   * Generate random bytes using HSM TRNG or software CSPRNG
   * PRIORITY: Hardware TRNG is always preferred when available
   * @param {number} length - Number of bytes
   * @returns {Promise<Buffer>} Random bytes
   */
  async randomBytes(length) {
    // Use hardware TRNG if available (priority)
    if (this.session && this.trngAvailable) {
      try {
        const randomData = this.session.generateRandom(length);
        // Log first use of hardware TRNG
        if (!this._loggedTrngUse) {
          console.log(`[HSM] Using hardware TRNG from ${this.providerInfo?.name}`);
          this._loggedTrngUse = true;
        }
        return randomData;
      } catch (error) {
        console.warn('[HSM] Hardware TRNG failed, falling back to software CSPRNG:', error.message);
      }
    }

    // Fallback to software CSPRNG (Node.js crypto.randomBytes)
    return crypto.randomBytes(length);
  }

  /**
   * Generate random bytes - synchronous check, async generation
   * Returns source information along with random bytes
   * @param {number} length - Number of bytes
   * @returns {Promise<{bytes: Buffer, source: string, hardware: boolean}>}
   */
  async randomBytesWithSource(length) {
    if (this.session && this.trngAvailable) {
      try {
        const bytes = this.session.generateRandom(length);
        return {
          bytes,
          source: this.providerInfo?.name || 'Hardware HSM',
          hardware: true,
          fipsLevel: this.providerInfo?.fipsLevel || 0
        };
      } catch (error) {
        console.warn('[HSM] Hardware TRNG failed:', error.message);
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
   * Sign data using HSM or software fallback
   * @param {string} algorithm - Signature algorithm
   * @param {Buffer} data - Data to sign
   * @param {string} key - Key for software fallback
   * @returns {Promise<Buffer>} Signature
   */
  async sign(algorithm, data, key) {
    if (!this.pkcs11 || !this.keyHandle) {
      const sign = crypto.createSign(algorithm);
      sign.update(data);
      return sign.sign(key);
    }

    try {
      const graphene = await import('graphene-pk11');
      const mechanism = this.getMechanism(algorithm, graphene);
      return this.session.createSign(mechanism, this.keyHandle).once(data);
    } catch (error) {
      console.warn('[HSM] Sign failed, falling back to software:', error.message);
      const sign = crypto.createSign(algorithm);
      sign.update(data);
      return sign.sign(key);
    }
  }

  /**
   * Get HSM status with TRNG information
   * @returns {object} Status information
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      initialized: this.initialized,
      provider: this.detectedProvider || this.config.provider,
      providerName: this.providerInfo?.name || 'Unknown',
      providerType: this.providerInfo?.type || 'unknown',
      hasHardware: !!this.pkcs11,
      hasTrng: this.trngAvailable,
      fipsLevel: this.providerInfo?.fipsLevel || 0,
      slot: this.config.slot,
      keyLabel: this.config.keyLabel,
      mode: this.pkcs11 ? 'hardware' : 'software',
      randomSource: this.trngAvailable
        ? `${this.providerInfo?.name} Hardware TRNG`
        : 'Node.js CSPRNG'
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
    this.trngAvailable = false;
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

/**
 * Get list of supported HSM providers
 * @returns {object} Provider configurations
 */
export function getSupportedProviders() {
  return HSM_PROVIDERS;
}

/**
 * Get priority order for HSM detection
 * @returns {string[]} Provider names in priority order
 */
export function getProviderPriorityOrder() {
  return HSM_PRIORITY_ORDER;
}

export default {
  HsmClient,
  getHsmClient,
  isHsmEnabled,
  initializeHsm,
  getSupportedProviders,
  getProviderPriorityOrder,
  HSM_PROVIDERS,
  HSM_PRIORITY_ORDER
};
