/**
 * Check-character algorithms for the OSIA `ChecksumAlgorithm` enum.
 *
 *   ISO7064 / ISO7064_MOD37_2  pure ISO/IEC 7064 MOD 37-2, one check character
 *                              from 0-9, A-Z, '*'
 *   ISO7064_MOD97_10           pure ISO/IEC 7064 MOD 97-10, two check digits;
 *                              letters are expanded A=10 ... Z=35
 *   LUHN                       ISO/IEC 7812-1 Luhn, one check digit, digits only
 *   DAMM                       Damm (totally anti-symmetric quasigroup of order
 *                              10), one check digit, digits only
 */

const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';

const DAMM_TABLE = [
  [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
  [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
  [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
  [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
  [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
  [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
  [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
  [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
  [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
  [2, 5, 8, 1, 4, 3, 6, 7, 9, 0]
];

function assertDigits(input, algorithm) {
  if (!/^[0-9]+$/.test(input)) {
    throw new RangeError(`${algorithm} is defined over decimal digits only`);
  }
}

function assertAlphanumeric(input, algorithm) {
  if (!/^[0-9A-Z]+$/.test(input)) {
    throw new RangeError(`${algorithm} is defined over 0-9 and A-Z only`);
  }
}

export function mod37_2(input) {
  assertAlphanumeric(input, 'ISO7064_MOD37_2');
  let p = 0;
  for (const ch of input) {
    p = ((p + MOD37_ALPHABET.indexOf(ch)) * 2) % 37;
  }
  return MOD37_ALPHABET[(38 - p) % 37];
}

export function mod97_10(input) {
  assertAlphanumeric(input, 'ISO7064_MOD97_10');
  let r = 0;
  for (const ch of input) {
    const v = MOD37_ALPHABET.indexOf(ch);
    for (const d of String(v)) r = (r * 10 + Number(d)) % 97;
  }
  r = (r * 100) % 97;
  return String(98 - r).padStart(2, '0');
}

export function luhn(input) {
  assertDigits(input, 'LUHN');
  let sum = 0;
  let double = true;
  for (let i = input.length - 1; i >= 0; i--) {
    let d = Number(input[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return String((10 - (sum % 10)) % 10);
}

export function damm(input) {
  assertDigits(input, 'DAMM');
  let interim = 0;
  for (const ch of input) interim = DAMM_TABLE[interim][Number(ch)];
  return String(interim);
}

const ALGORITHMS = {
  NONE: { length: 0, compute: () => '' },
  ISO7064: { length: 1, compute: mod37_2, alphabet: MOD37_ALPHABET },
  ISO7064_MOD37_2: { length: 1, compute: mod37_2, alphabet: MOD37_ALPHABET },
  ISO7064_MOD97_10: { length: 2, compute: mod97_10, alphabet: '0123456789' },
  LUHN: { length: 1, compute: luhn, alphabet: '0123456789', digitsOnly: true },
  DAMM: { length: 1, compute: damm, alphabet: '0123456789', digitsOnly: true }
};

export const DEFAULT_CHECKSUM = 'ISO7064_MOD37_2';

export function checksumInfo(algorithm) {
  const a = ALGORITHMS[algorithm];
  if (!a) throw new RangeError(`Unsupported checksum algorithm: ${algorithm}`);
  return a;
}

/**
 * @returns {string} check character(s) for `body`
 */
export function computeCheck(algorithm, body) {
  return checksumInfo(algorithm).compute(body);
}

/**
 * @returns {boolean} true when the trailing check character(s) of `value` are correct
 */
export function verifyCheck(algorithm, value) {
  const { length, compute } = checksumInfo(algorithm);
  if (length === 0) return true;
  if (value.length <= length) return false;
  try {
    return compute(value.slice(0, -length)) === value.slice(-length);
  } catch {
    return false;
  }
}
