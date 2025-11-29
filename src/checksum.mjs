/**
 * Checksum utilities for UIN validation
 * Supports Mod N and ISO 7064 (MOD 37-2) algorithms
 */

/**
 * Compute a simple modulus-based checksum
 * @param {string} input - The input string
 * @param {number} modulus - The modulus value (default: 10)
 * @returns {string} Single digit checksum
 */
export function computeModN(input, modulus = 10) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  if (modulus < 2 || modulus > 36) {
    throw new Error('Modulus must be between 2 and 36');
  }

  // Convert each character to numeric value
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    let value;

    if (char >= '0' && char <= '9') {
      value = char.charCodeAt(0) - '0'.charCodeAt(0);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else if (char >= 'a' && char <= 'z') {
      value = char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
    } else {
      // Skip non-alphanumeric characters
      continue;
    }

    sum += value;
  }

  const checksum = sum % modulus;

  // Return as character (0-9 or A-Z)
  if (checksum < 10) {
    return String(checksum);
  } else {
    return String.fromCharCode('A'.charCodeAt(0) + (checksum - 10));
  }
}

/**
 * Compute ISO 7064 MOD 37-2 checksum
 * This is a weighted modulus algorithm used in many identity systems
 * @param {string} input - The input string (alphanumeric)
 * @returns {string} Two-character checksum
 */
export function computeIso7064(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  // Character set for ISO 7064 MOD 37-2: 0-9, A-Z
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Convert input to uppercase and remove non-alphanumeric
  const normalized = input.toUpperCase().replace(/[^0-9A-Z]/g, '');

  if (normalized.length === 0) {
    throw new Error('Input must contain alphanumeric characters');
  }

  // MOD 37-2 algorithm
  let checksum = 36; // Initial value

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const value = charset.indexOf(char);

    if (value === -1) {
      throw new Error(`Invalid character in input: ${char}`);
    }

    checksum = ((checksum + value) * 2) % 37;
  }

  checksum = (38 - checksum) % 37;

  // Return as character from charset
  return charset[checksum];
}

/**
 * Compute ISO 7064 MOD 97-10 checksum (similar to IBAN)
 * Returns a 2-digit checksum
 * @param {string} input - The input string
 * @returns {string} Two-digit checksum
 */
export function computeIso7064Mod97(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i].toUpperCase();
    if (char >= '0' && char <= '9') {
      numericString += char;
    } else if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 'A'.charCodeAt(0) + 10).toString();
    }
  }

  // Compute mod 97
  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
  }

  const checksum = (98 - remainder) % 97;
  return checksum.toString().padStart(2, '0');
}

/**
 * Append checksum to a base string
 * @param {string} base - The base string
 * @param {object} options - Checksum options
 * @param {string} options.algorithm - Algorithm to use ('modN', 'iso7064', 'iso7064mod97')
 * @param {number} [options.modulus=10] - Modulus for modN algorithm
 * @returns {{value: string, checksum: string}} Object with final value and checksum
 */
export function appendChecksum(base, options = {}) {
  const { algorithm = 'modN', modulus = 10 } = options;

  let checksumValue;

  switch (algorithm.toLowerCase()) {
    case 'modn':
      checksumValue = computeModN(base, modulus);
      break;
    case 'iso7064':
      checksumValue = computeIso7064(base);
      break;
    case 'iso7064mod97':
      checksumValue = computeIso7064Mod97(base);
      break;
    default:
      throw new Error(`Unsupported checksum algorithm: ${algorithm}`);
  }

  return {
    value: base + checksumValue,
    checksum: checksumValue
  };
}

/**
 * Verify checksum of a value
 * @param {string} valueWithChecksum - The value including checksum
 * @param {object} options - Checksum options
 * @param {string} options.algorithm - Algorithm to use
 * @param {number} [options.checksumLength=1] - Length of checksum to verify
 * @param {number} [options.modulus=10] - Modulus for modN algorithm
 * @returns {boolean} True if checksum is valid
 */
export function verifyChecksum(valueWithChecksum, options = {}) {
  const { algorithm = 'modN', checksumLength = 1, modulus = 10 } = options;

  if (!valueWithChecksum || valueWithChecksum.length <= checksumLength) {
    return false;
  }

  const base = valueWithChecksum.slice(0, -checksumLength);
  const providedChecksum = valueWithChecksum.slice(-checksumLength);

  let expectedChecksum;

  switch (algorithm.toLowerCase()) {
    case 'modn':
      expectedChecksum = computeModN(base, modulus);
      break;
    case 'iso7064':
      expectedChecksum = computeIso7064(base);
      break;
    case 'iso7064mod97':
      expectedChecksum = computeIso7064Mod97(base);
      break;
    default:
      throw new Error(`Unsupported checksum algorithm: ${algorithm}`);
  }

  return providedChecksum === expectedChecksum;
}
