/**
 * OSIA BearerAuth (JWT) with per-operation scopes.
 *
 * OSIA_AUTH_MODE
 *   required (default)  every /v1 call needs a valid bearer token carrying the
 *                       operation's scope
 *   optional            public-demo mode: calls without a token are accepted;
 *                       a token that is presented is still fully verified and
 *                       its scopes enforced
 *
 * Token verification (one of):
 *   OSIA_JWT_JWKS_URL    remote JWKS (RS256, PS256, ES256, EdDSA)
 *   OSIA_JWT_PUBLIC_KEY  SPKI PEM public key
 *   OSIA_JWT_SECRET      HS256 shared secret (>= 32 bytes)
 * Optional claim checks: OSIA_JWT_ISSUER, OSIA_JWT_AUDIENCE.
 * Scopes are read from `scope` (space-delimited) or `scp` (array or string).
 */

import crypto from 'crypto';
import { jwtVerify, createRemoteJWKSet, importSPKI } from 'jose';
import { OsiaError } from './errors.mjs';

const ASYMMETRIC_ALGS = ['RS256', 'PS256', 'ES256', 'ES384', 'EdDSA'];

let verifier = null;

export function authMode() {
  return (process.env.OSIA_AUTH_MODE || 'required').toLowerCase() === 'optional' ? 'optional' : 'required';
}

async function getVerifier() {
  if (verifier) return verifier;
  const options = { clockTolerance: 30 };
  if (process.env.OSIA_JWT_ISSUER) options.issuer = process.env.OSIA_JWT_ISSUER;
  if (process.env.OSIA_JWT_AUDIENCE) options.audience = process.env.OSIA_JWT_AUDIENCE;

  let key = null;
  if (process.env.OSIA_JWT_JWKS_URL) {
    key = createRemoteJWKSet(new URL(process.env.OSIA_JWT_JWKS_URL));
    options.algorithms = ASYMMETRIC_ALGS;
  } else if (process.env.OSIA_JWT_PUBLIC_KEY) {
    const pem = process.env.OSIA_JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    const type = crypto.createPublicKey(pem).asymmetricKeyType;
    const alg = type === 'ec' ? 'ES256' : type === 'ed25519' ? 'EdDSA' : 'RS256';
    key = await importSPKI(pem, alg);
    options.algorithms = [alg];
  } else if (process.env.OSIA_JWT_SECRET) {
    const secret = Buffer.from(process.env.OSIA_JWT_SECRET, 'utf8');
    if (secret.length < 32) {
      console.error('[osia] OSIA_JWT_SECRET is shorter than 32 bytes; bearer tokens will be rejected');
    } else {
      key = new Uint8Array(secret);
      options.algorithms = ['HS256'];
    }
  }
  verifier = { key, options };
  return verifier;
}

/** Reset cached verifier (tests). */
export function resetAuth() {
  verifier = null;
}

function challenge(error, description, scope) {
  let value = `Bearer realm="osia-uin"`;
  if (error) value += `, error="${error}"`;
  if (description) value += `, error_description="${description}"`;
  if (scope) value += `, scope="${scope}"`;
  return { 'WWW-Authenticate': value };
}

function scopesOf(payload) {
  const raw = payload.scope ?? payload.scp ?? [];
  return new Set(Array.isArray(raw) ? raw : String(raw).split(/\s+/).filter(Boolean));
}

/**
 * Authenticate the request and enforce the operation's scopes.
 * @returns {Promise<{subject: string, anonymous: boolean}>}
 */
export async function authenticate(req, requiredScopes) {
  const header = req.get('authorization');
  const scopeList = requiredScopes.join(' ');

  if (!header) {
    if (authMode() === 'optional') return { subject: 'anonymous', anonymous: true };
    throw new OsiaError(401, 'Bearer token required', challenge(null, null, scopeList));
  }

  const m = /^Bearer\s+([A-Za-z0-9\-_.]+)$/i.exec(header);
  if (!m) {
    throw new OsiaError(401, 'Malformed Authorization header', challenge('invalid_request', 'malformed authorization header'));
  }

  const { key, options } = await getVerifier();
  if (!key) {
    throw new OsiaError(401, 'Bearer authentication is not configured on this server', challenge('invalid_token', 'no verification key configured'));
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(m[1], key, options));
  } catch {
    throw new OsiaError(401, 'Invalid or expired bearer token', challenge('invalid_token', 'token verification failed'));
  }

  const granted = scopesOf(payload);
  const missing = requiredScopes.filter((s) => !granted.has(s));
  if (missing.length > 0) {
    throw new OsiaError(403, `Missing required scope: ${missing.join(' ')}`, challenge('insufficient_scope', null, scopeList));
  }

  return { subject: String(payload.sub || payload.client_id || 'unknown').slice(0, 128), anonymous: false };
}
