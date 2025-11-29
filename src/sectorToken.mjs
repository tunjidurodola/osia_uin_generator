/**
 * Sector Token Derivation Module
 * Generates unlinkable sector-specific tokens from foundational UINs
 * Uses HMAC-based key derivation for security
 */

import crypto from 'crypto';

/**
 * Default configuration for sector token generation
 */
const DEFAULT_CONFIG = {
  algorithm: 'sha256',
  iterations: 1,
  includeSalt: true,
  saltLength: 16
};

/**
 * Generate a random salt for token derivation
 * @param {number} length - Salt length in bytes
 * @returns {string} Hex-encoded salt
 */
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Convert a buffer to a string using specified charset
 * @param {Buffer} buffer - Input buffer
 * @param {string} charset - Target character set
 * @param {number} targetLength - Desired output length
 * @returns {string} Encoded string
 */
function bufferToCharset(buffer, charset, targetLength) {
  const charsetArray = charset.split('');
  const charsetLength = charsetArray.length;

  let result = '';
  let bufferIndex = 0;

  // Use buffer bytes to generate characters from charset
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
 * Derive a sector-specific token from a foundational UIN
 * @param {string} foundationalUin - The foundational UIN
 * @param {string} sector - Sector identifier (e.g., 'health', 'tax', 'finance')
 * @param {object} options - Derivation options
 * @param {number} [options.tokenLength=20] - Length of output token
 * @param {string} [options.charset='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'] - Character set
 * @param {string} [options.algorithm='sha256'] - HMAC algorithm
 * @param {string} [options.salt] - Optional salt (auto-generated if not provided)
 * @param {number} [options.saltLength=16] - Salt length in bytes
 * @param {boolean} [options.includeSalt=true] - Include salt in derivation
 * @param {number} [options.version=1] - Token version for future compatibility
 * @param {object} secrets - Secret configuration per sector
 * @returns {{token: string, metadata: object}} Derived token and metadata
 */
export function deriveSectorToken(foundationalUin, sector, options = {}, secrets = {}) {
  // Validate inputs
  if (!foundationalUin || typeof foundationalUin !== 'string') {
    throw new Error('Foundational UIN must be a non-empty string');
  }

  if (!sector || typeof sector !== 'string') {
    throw new Error('Sector must be a non-empty string');
  }

  // Normalize sector name
  const normalizedSector = sector.toLowerCase().trim();

  // Get sector-specific secret
  const sectorSecret = secrets[normalizedSector];
  if (!sectorSecret) {
    throw new Error(`No secret configured for sector: ${normalizedSector}`);
  }

  // Apply defaults
  const config = {
    tokenLength: options.tokenLength || 20,
    charset: options.charset || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    algorithm: options.algorithm || DEFAULT_CONFIG.algorithm,
    salt: options.salt || (options.includeSalt !== false ? generateSalt(options.saltLength || DEFAULT_CONFIG.saltLength) : ''),
    includeSalt: options.includeSalt !== false,
    version: options.version || 1
  };

  // Construct derivation input
  // Format: version|foundationalUin|sector|salt
  const derivationInput = [
    `v${config.version}`,
    foundationalUin,
    normalizedSector,
    config.salt
  ].join('|');

  // Perform HMAC-based derivation
  const hmac = crypto.createHmac(config.algorithm, sectorSecret);
  hmac.update(derivationInput);
  const derivedBytes = hmac.digest();

  // Convert to target charset
  const token = bufferToCharset(derivedBytes, config.charset, config.tokenLength);

  // Return token with metadata
  return {
    token,
    metadata: {
      sector: normalizedSector,
      version: config.version,
      algorithm: config.algorithm,
      salt: config.salt,
      tokenLength: config.tokenLength,
      derivedAt: new Date().toISOString()
    }
  };
}

/**
 * Verify that a sector token matches a foundational UIN
 * @param {string} token - The token to verify
 * @param {string} foundationalUin - The foundational UIN
 * @param {string} sector - Sector identifier
 * @param {object} metadata - Metadata from token generation
 * @param {object} secrets - Secret configuration per sector
 * @returns {boolean} True if token is valid
 */
export function verifySectorToken(token, foundationalUin, sector, metadata, secrets) {
  try {
    // Re-derive token using the same parameters
    const { token: recomputedToken } = deriveSectorToken(
      foundationalUin,
      sector,
      {
        tokenLength: metadata.tokenLength || token.length,
        algorithm: metadata.algorithm,
        salt: metadata.salt,
        version: metadata.version,
        charset: metadata.charset || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        includeSalt: true
      },
      secrets
    );

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(recomputedToken)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Create a deterministic sector token (for testing or specific use cases)
 * Uses a fixed salt derived from the UIN+sector combination
 * WARNING: Less secure than random salt; use only when necessary
 * @param {string} foundationalUin - The foundational UIN
 * @param {string} sector - Sector identifier
 * @param {object} options - Derivation options
 * @param {object} secrets - Secret configuration per sector
 * @returns {{token: string, metadata: object}} Derived token and metadata
 */
export function deriveDeterministicSectorToken(foundationalUin, sector, options = {}, secrets = {}) {
  // Generate deterministic salt from UIN + sector
  const saltInput = `${foundationalUin}:${sector}`;
  const deterministicSalt = crypto
    .createHash('sha256')
    .update(saltInput)
    .digest('hex')
    .substring(0, options.saltLength || 16);

  return deriveSectorToken(
    foundationalUin,
    sector,
    {
      ...options,
      salt: deterministicSalt,
      includeSalt: true
    },
    secrets
  );
}

/**
 * Batch derive sector tokens for multiple sectors
 * @param {string} foundationalUin - The foundational UIN
 * @param {string[]} sectors - Array of sector identifiers
 * @param {object} options - Derivation options
 * @param {object} secrets - Secret configuration per sector
 * @returns {object} Map of sector to token result
 */
export function deriveMultipleSectorTokens(foundationalUin, sectors, options = {}, secrets = {}) {
  const results = {};

  for (const sector of sectors) {
    try {
      results[sector] = deriveSectorToken(foundationalUin, sector, options, secrets);
    } catch (error) {
      results[sector] = { error: error.message };
    }
  }

  return results;
}
