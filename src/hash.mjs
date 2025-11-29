/**
 * Hash utilities for UIN
 * Implements RIPEMD160(SHA3-256(UIN + salt)) for hash_rmd160
 */

import crypto from 'crypto';

/**
 * Compute UIN hash using RIPEMD160(SHA3-256(UIN + salt))
 * @param {string} uin - The UIN to hash
 * @param {string} salt - Optional salt (default: empty string)
 * @returns {string} 40-character hex string (RIPEMD160 hash)
 */
export function computeUinHash(uin, salt = '') {
  if (!uin || typeof uin !== 'string') {
    throw new Error('UIN must be a non-empty string');
  }

  // Step 1: SHA3-256(UIN + salt)
  const inner = crypto.createHash('sha3-256')
    .update(uin + salt, 'utf8')
    .digest();

  // Step 2: RIPEMD160(inner)
  const hash = crypto.createHash('ripemd160')
    .update(inner)
    .digest('hex');

  return hash; // 40-character hex string
}

/**
 * Compute SHA-256 hash (alternative simpler hash)
 * @param {string} input - Input string
 * @returns {string} 64-character hex string
 */
export function computeSha256(input) {
  return crypto.createHash('sha256')
    .update(input, 'utf8')
    .digest('hex');
}

/**
 * Compute SHA3-256 hash
 * @param {string} input - Input string
 * @returns {string} 64-character hex string
 */
export function computeSha3_256(input) {
  return crypto.createHash('sha3-256')
    .update(input, 'utf8')
    .digest('hex');
}

/**
 * Verify UIN hash
 * @param {string} uin - The UIN
 * @param {string} expectedHash - Expected hash value
 * @param {string} salt - Optional salt
 * @returns {boolean} True if hash matches
 */
export function verifyUinHash(uin, expectedHash, salt = '') {
  try {
    const computed = computeUinHash(uin, salt);
    return computed === expectedHash;
  } catch (error) {
    return false;
  }
}

export default {
  computeUinHash,
  computeSha256,
  computeSha3_256,
  verifyUinHash
};
