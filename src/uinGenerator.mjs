/**
 * Core UIN Generator Engine
 * Supports multiple generation modes: random, structured, sector_token, foundational
 */

import crypto from 'crypto';
import { appendChecksum, verifyChecksum } from './checksum.mjs';
import { deriveSectorToken } from './sectorToken.mjs';
import { getConfig, parseCharset, excludeAmbiguous } from './config.mjs';
import { computeUinHash } from './hash.mjs';

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the string
 * @param {string} charset - Character set to use
 * @returns {string} Random string
 */
function generateRandomString(length, charset) {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }

  if (!charset || charset.length === 0) {
    throw new Error('Charset must not be empty');
  }

  const charsetLength = charset.length;
  const randomBytes = crypto.randomBytes(length * 2); // Generate extra bytes for better distribution

  let result = '';
  let byteIndex = 0;

  while (result.length < length && byteIndex < randomBytes.length) {
    const byte = randomBytes[byteIndex];
    // Use rejection sampling for uniform distribution
    const maxUsable = 256 - (256 % charsetLength);

    if (byte < maxUsable) {
      const charIndex = byte % charsetLength;
      result += charset[charIndex];
    }

    byteIndex++;
  }

  // If we exhausted our random bytes, generate more
  if (result.length < length) {
    return generateRandomString(length, charset);
  }

  return result;
}

/**
 * Parse a template and extract placeholder information
 * @param {string} template - Template string (e.g., "RR-YYYY-FFF-NNNNN")
 * @returns {Array} Array of segments with type and length
 */
function parseTemplate(template) {
  const segments = [];
  let currentSegment = '';
  let currentChar = null;

  for (let i = 0; i < template.length; i++) {
    const char = template[i];

    if (/[A-Za-z0-9]/.test(char)) {
      if (currentChar === null || currentChar === char) {
        currentChar = char;
        currentSegment += char;
      } else {
        // New placeholder type
        segments.push({
          type: 'placeholder',
          char: currentChar,
          length: currentSegment.length
        });
        currentChar = char;
        currentSegment = char;
      }
    } else {
      // Separator or literal character
      if (currentSegment.length > 0) {
        segments.push({
          type: 'placeholder',
          char: currentChar,
          length: currentSegment.length
        });
        currentChar = null;
        currentSegment = '';
      }
      segments.push({
        type: 'literal',
        value: char
      });
    }
  }

  // Add final segment
  if (currentSegment.length > 0) {
    segments.push({
      type: 'placeholder',
      char: currentChar,
      length: currentSegment.length
    });
  }

  return segments;
}

/**
 * Fill a template with values
 * @param {string} template - Template string
 * @param {object} values - Values to fill (keyed by placeholder char or name)
 * @param {object} randomSegments - Configuration for random segments
 * @param {string} defaultCharset - Default charset for random segments
 * @returns {{value: string, components: object}} Filled template and components
 */
function fillTemplate(template, values = {}, randomSegments = {}, defaultCharset = '0123456789') {
  const segments = parseTemplate(template);
  let result = '';
  const components = {};

  for (const segment of segments) {
    if (segment.type === 'literal') {
      result += segment.value;
    } else {
      // Placeholder
      const placeholderChar = segment.char;
      let value;
      let charset = defaultCharset;

      // Check if a specific value is provided
      if (values[placeholderChar]) {
        value = String(values[placeholderChar]).padStart(segment.length, '0');
      } else if (values[placeholderChar.toLowerCase()]) {
        value = String(values[placeholderChar.toLowerCase()]).padStart(segment.length, '0');
      } else {
        // Generate random value
        const segmentConfig = randomSegments[placeholderChar] || randomSegments[placeholderChar.toLowerCase()] || {};
        const rawCharset = segmentConfig.charset || defaultCharset;
        // Parse charset to handle patterns like '0-9', 'A-Z', etc.
        charset = parseCharset(rawCharset);

        value = generateRandomString(segment.length, charset);
      }

      // Truncate or pad to required length
      value = value.substring(0, segment.length).padStart(segment.length, charset[0] || '0');

      components[placeholderChar] = value;
      result += value;
    }
  }

  return { value: result, components };
}

/**
 * Generate a Random UIN
 * @param {object} options - Generation options
 * @returns {object} Generated UIN result
 */
function generateRandomUin(options) {
  const config = getConfig();
  const length = options.length || config.defaultLength;
  let charset = parseCharset(options.charset || config.defaultCharset);

  if (options.excludeAmbiguous) {
    charset = excludeAmbiguous(charset);
  }

  // Generate base UIN
  let baseUin = generateRandomString(length, charset);

  // Apply checksum if requested
  let checksumInfo = { used: false };
  if (options.checksum && options.checksum.enabled) {
    const checksumResult = appendChecksum(baseUin, {
      algorithm: options.checksum.algorithm || config.defaultChecksumAlgorithm,
      modulus: options.checksum.modulus || 10
    });

    checksumInfo = {
      used: true,
      algorithm: options.checksum.algorithm || config.defaultChecksumAlgorithm,
      value: checksumResult.checksum
    };

    baseUin = checksumResult.value;
  }

  // Compute hash
  const hash_rmd160 = computeUinHash(baseUin);

  return {
    value: baseUin,
    mode: 'random',
    checksum: checksumInfo,
    hash_rmd160
  };
}

/**
 * Generate a Structured UIN
 * @param {object} options - Generation options
 * @returns {object} Generated UIN result
 */
function generateStructuredUin(options) {
  const config = getConfig();

  if (!options.template) {
    throw new Error('Template is required for structured mode');
  }

  const defaultCharset = parseCharset(options.charset || config.defaultCharset);

  // Fill template
  const { value: baseUin, components } = fillTemplate(
    options.template,
    options.values || {},
    options.randomSegments || {},
    defaultCharset
  );

  let finalValue = baseUin;

  // Apply checksum if requested
  let checksumInfo = { used: false };
  if (options.checksum && options.checksum.enabled) {
    const checksumResult = appendChecksum(baseUin, {
      algorithm: options.checksum.algorithm || config.defaultChecksumAlgorithm,
      modulus: options.checksum.modulus || 10
    });

    checksumInfo = {
      used: true,
      algorithm: options.checksum.algorithm || config.defaultChecksumAlgorithm,
      value: checksumResult.checksum
    };

    finalValue = checksumResult.value;
  }

  // Compute hash
  const hash_rmd160 = computeUinHash(finalValue);

  return {
    value: finalValue,
    mode: 'structured',
    rawComponents: components,
    template: options.template,
    checksum: checksumInfo,
    hash_rmd160
  };
}

/**
 * Generate a Foundational UIN
 * @param {object} options - Generation options
 * @returns {object} Generated UIN result
 */
function generateFoundationalUin(options) {
  const config = getConfig();
  const length = options.length || config.defaultLength;
  let charset = parseCharset(options.charset || config.defaultCharset);

  if (options.excludeAmbiguous !== false) {
    charset = excludeAmbiguous(charset);
  }

  // Generate high-entropy base
  let baseUin = generateRandomString(length, charset);

  // Apply checksum if requested
  let checksumInfo = { used: false };
  if (options.checksum && options.checksum.enabled) {
    const checksumResult = appendChecksum(baseUin, {
      algorithm: options.checksum.algorithm || config.defaultChecksumAlgorithm,
      modulus: options.checksum.modulus || 10
    });

    checksumInfo = {
      used: true,
      algorithm: options.checksum.algorithm || config.defaultChecksumAlgorithm,
      value: checksumResult.checksum
    };

    baseUin = checksumResult.value;
  }

  // Compute hash
  const hash_rmd160 = computeUinHash(baseUin);

  return {
    value: baseUin,
    mode: 'foundational',
    checksum: checksumInfo,
    hash_rmd160,
    properties: {
      highEntropy: true,
      noPii: true,
      lifelong: true
    }
  };
}

/**
 * Generate a Sector Token
 * @param {object} options - Generation options
 * @returns {object} Generated token result
 */
function generateSectorTokenUin(options) {
  const config = getConfig();

  if (!options.foundationalUin) {
    throw new Error('Foundational UIN is required for sector_token mode');
  }

  if (!options.sector) {
    throw new Error('Sector is required for sector_token mode');
  }

  const charset = parseCharset(options.charset || config.defaultCharset);

  // Derive sector token
  const { token, metadata } = deriveSectorToken(
    options.foundationalUin,
    options.sector,
    {
      tokenLength: options.tokenLength || 20,
      charset: charset,
      salt: options.salt
    },
    config.sectorSecrets
  );

  // Compute hash
  const hash_rmd160 = computeUinHash(token);

  return {
    value: token,
    mode: 'sector_token',
    sector: options.sector,
    metadata: metadata,
    hash_rmd160,
    properties: {
      unlinkable: true,
      sectorSpecific: true,
      rotatable: true
    }
  };
}

/**
 * Main UIN generation function
 * @param {object} options - Generation options
 * @param {string} options.mode - Generation mode ('random', 'structured', 'sector_token', 'foundational')
 * @param {number} [options.length] - Length of UIN
 * @param {string} [options.charset] - Character set
 * @param {boolean} [options.excludeAmbiguous] - Exclude ambiguous characters
 * @param {object} [options.checksum] - Checksum configuration
 * @param {string} [options.template] - Template for structured mode
 * @param {object} [options.values] - Values for template placeholders
 * @param {object} [options.randomSegments] - Random segment configuration
 * @param {string} [options.foundationalUin] - Foundational UIN for sector token mode
 * @param {string} [options.sector] - Sector for sector token mode
 * @param {number} [options.tokenLength] - Token length for sector token mode
 * @returns {object} Generated UIN result
 */
export function generateUin(options = {}) {
  const config = getConfig();
  const mode = (options.mode || config.defaultMode).toLowerCase();

  switch (mode) {
    case 'random':
      return generateRandomUin(options);

    case 'structured':
    case 'pii_structured':
      return generateStructuredUin(options);

    case 'foundational':
      return generateFoundationalUin(options);

    case 'sector_token':
    case 'sectoral':
      return generateSectorTokenUin(options);

    default:
      throw new Error(`Unsupported mode: ${mode}. Supported modes: random, structured, foundational, sector_token`);
  }
}

/**
 * Validate a UIN (checksum validation if applicable)
 * @param {string} uin - UIN to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
export function validateUin(uin, options = {}) {
  if (!uin || typeof uin !== 'string') {
    return {
      valid: false,
      error: 'UIN must be a non-empty string'
    };
  }

  // Basic length check
  if (uin.length < 8) {
    return {
      valid: false,
      error: 'UIN is too short (minimum 8 characters)'
    };
  }

  // Checksum validation if requested
  if (options.checksum && options.checksum.enabled) {
    const isValid = verifyChecksum(uin, {
      algorithm: options.checksum.algorithm || 'modN',
      checksumLength: options.checksum.length || 1,
      modulus: options.checksum.modulus || 10
    });

    if (!isValid) {
      return {
        valid: false,
        error: 'Checksum validation failed'
      };
    }
  }

  return {
    valid: true,
    length: uin.length
  };
}

export default {
  generateUin,
  validateUin,
  generateRandomString
};
