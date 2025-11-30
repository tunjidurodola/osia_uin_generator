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
    library: '/usr/local/lib/pkcs11/yubihsm_pkcs11.so',
    altLibraries: [
      '/usr/lib/libyubihsm_pkcs11.so',
      '/usr/local/lib/libyubihsm_pkcs11.so',
      '/usr/lib/x86_64-linux-gnu/libyubihsm_pkcs11.so',
      '/usr/lib/x86_64-linux-gnu/pkcs11/yubihsm_pkcs11.so'
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
 * Priority order for HSM detection
 * Utimaco is prioritized first, followed by other production HSMs
 * SoftHSM is last (development only - NO hardware TRNG)
 */
const HSM_PRIORITY_ORDER = [
  'utimaco',      // Priority 1: Utimaco CryptoServer/SecurityServer
  'thales',       // Priority 2: Thales Luna
  'safenet',      // Priority 3: SafeNet ProtectServer
  'ncipher',      // Priority 4: nCipher/Entrust nShield
  'aws-cloudhsm', // Priority 5: AWS CloudHSM
  'azure-hsm',    // Priority 6: Azure Dedicated HSM
  'yubihsm',      // Priority 7: YubiHSM 2
  'softhsm'       // Priority 8: SoftHSM (development only)
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

        // Check if hardware TRNG is available - requires session and provider that has TRNG
        this.trngAvailable = this.providerInfo?.hasTrng === true && this.session !== null;

        if (this.trngAvailable) {
          // Test TRNG by generating a few bytes
          try {
            this.session.generateRandom(16);
            console.log(`[HSM] Hardware TRNG verified via ${this.providerInfo.name}`);
          } catch (trngError) {
            console.warn('[HSM] Hardware TRNG test failed:', trngError.message);
            this.trngAvailable = false;
          }
        }

        if (!this.trngAvailable && this.providerInfo?.type === 'development') {
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
      // graphene-pk11 exports Module directly
      const graphene = await import('graphene-pk11');
      // Check what we got and log for debugging
      console.log('[HSM] graphene-pk11 exports:', Object.keys(graphene));
      // The Module class should be in the exports
      if (graphene.Module) {
        return graphene;
      } else if (graphene.default && graphene.default.Module) {
        return graphene.default;
      }
      console.warn('[HSM] graphene-pk11 Module not found in exports');
      return null;
    } catch (error) {
      console.warn('[HSM] graphene-pk11 module not available:', error.message);
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

    console.log(`[HSM] Loading PKCS#11 library: ${libraryPath}`);

    // Initialize PKCS#11 using static Module.load() method
    this.pkcs11 = graphene.Module.load(libraryPath);
    this.pkcs11.initialize();

    // Get slot - for YubiHSM, slot 0 corresponds to connector address
    const slots = this.pkcs11.getSlots(true);
    console.log(`[HSM] Found ${slots.length} slot(s)`);

    if (slots.length === 0) {
      throw new Error('No HSM slots found. Check connector status.');
    }

    // YubiHSM typically uses slot 0
    const slotIndex = Math.min(this.config.slot, slots.length - 1);
    const slot = slots.items(slotIndex);
    console.log(`[HSM] Using slot ${slotIndex}: ${slot.slotDescription}`);

    // Open session - YubiHSM requires specific flags
    // Try with SERIAL_SESSION only first (for read operations)
    try {
      this.session = slot.open(graphene.SessionFlag.SERIAL_SESSION);
      console.log('[HSM] Opened read-only session');
    } catch (sessionError) {
      console.log('[HSM] Trying RW session...');
      this.session = slot.open(
        graphene.SessionFlag.RW_SESSION | graphene.SessionFlag.SERIAL_SESSION
      );
    }

    // Login if PIN provided
    if (this.config.pin) {
      try {
        // YubiHSM PKCS#11 PIN format: <4-digit-hex-authkey><password>
        // Example: 0001password (authkey 1, password "password")
        // The PIN must be at least 8 characters (4 hex + 4 password minimum)
        let pin = this.config.pin;

        // Check if already in YubiHSM format (starts with 4 hex digits)
        const isYubiHsmFormat = /^[0-9a-fA-F]{4}/.test(pin) && pin.length >= 8;

        if (this.detectedProvider === 'yubihsm' && !isYubiHsmFormat) {
          // For YubiHSM, prepend default authkey 0001 (authkey ID 1)
          pin = '0001' + pin;
          console.log('[HSM] YubiHSM: Using formatted PIN (0001 + password)');
        }

        console.log(`[HSM] Attempting login (PIN length: ${pin.length})...`);
        this.session.login(pin, graphene.UserType.USER);
        console.log('[HSM] Login successful');
      } catch (loginError) {
        console.warn('[HSM] Login failed:', loginError.message);
        console.warn('[HSM] Note: YubiHSM requires PIN format: 0001<password> (min 8 chars total)');
        // Continue without login - some operations may still work
      }
    } else {
      console.log('[HSM] No PIN provided, skipping login');
    }

    // Find or create key (may fail if not logged in)
    try {
      await this.findOrCreateKey(graphene);
    } catch (keyError) {
      console.warn('[HSM] Key operation failed:', keyError.message);
    }

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
