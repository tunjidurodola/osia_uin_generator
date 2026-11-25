/**
 * Output representations for GenerateResponse: JSON (default), JWT (RFC 7519)
 * and JSON-LD (W3C Verifiable Credentials Data Model v2.0, unsecured form).
 *
 * JWTs are signed with OSIA_SIGNING_KEY (PKCS#8 PEM, EC P-256 -> ES256 or
 * Ed25519 -> EdDSA). Without a configured key an ephemeral ES256 key is
 * created at start-up; tokens then only verify for the life of the process.
 * The public key is carried in the protected header (`jwk`) so integrity can
 * be checked; trust in the key must still be established out of band.
 */

import crypto from 'crypto';
import { SignJWT, exportJWK, importPKCS8, generateKeyPair, calculateJwkThumbprint } from 'jose';

let signer = null;

async function getSigner() {
  if (signer) return signer;
  const pem = process.env.OSIA_SIGNING_KEY;
  let privateKey;
  let alg;
  let ephemeral = false;
  if (pem) {
    const keyObj = crypto.createPrivateKey(pem);
    alg = keyObj.asymmetricKeyType === 'ed25519' ? 'EdDSA' : 'ES256';
    privateKey = await importPKCS8(pem, alg);
  } else {
    alg = 'ES256';
    ({ privateKey } = await generateKeyPair(alg, { extractable: true }));
    ephemeral = true;
    console.warn('[osia] OSIA_SIGNING_KEY not set: JWT outputs use an ephemeral ES256 key');
  }
  const publicJwk = await exportJWK(crypto.createPublicKey(crypto.KeyObject.from(privateKey)));
  const kid = process.env.OSIA_SIGNING_KID || (await calculateJwkThumbprint(publicJwk));
  signer = { privateKey, alg, kid, publicJwk: { ...publicJwk, kid }, ephemeral };
  return signer;
}

const toSeconds = (iso) => Math.floor(new Date(iso).getTime() / 1000);

/**
 * @param {object} r - GenerateResponse fields (uin, mode, sector, checksum, issuedAt, lifecycle fields)
 * @param {string} transactionId
 */
export async function toJwt(r, transactionId) {
  const s = await getSigner();
  const claims = { uin: r.uin, mode: r.mode, checksum: r.checksum, txn: transactionId };
  if (r.sector) claims.sector = r.sector;
  const jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: s.alg, typ: 'JWT', kid: s.kid, jwk: s.publicJwk })
    .setIssuer(r.issuer)
    .setSubject(r.uin)
    .setIssuedAt(toSeconds(r.issuedAt))
    .setJti(crypto.randomUUID());
  if (r.audience) jwt.setAudience(r.audience);
  if (r.notBefore) jwt.setNotBefore(toSeconds(r.notBefore));
  if (r.expiresAt) jwt.setExpirationTime(toSeconds(r.expiresAt));
  return jwt.sign(s.privateKey);
}

function isUri(value) {
  return /^[A-Za-z][A-Za-z0-9+.-]*:\S+$/.test(value);
}

export function toJsonLd(r) {
  const subject = { id: `urn:osia:uin:${encodeURIComponent(r.uin)}`, uin: r.uin, mode: r.mode };
  if (r.sector) subject.sector = r.sector;
  if (r.audience) subject.audience = r.audience;
  const doc = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'OsiaUinCredential'],
    id: `urn:uuid:${crypto.randomUUID()}`,
    issuer: isUri(r.issuer) ? r.issuer : { id: `urn:osia:issuer:${encodeURIComponent(r.issuer)}`, name: r.issuer },
    validFrom: r.notBefore || r.issuedAt,
    credentialSubject: subject
  };
  if (r.expiresAt) doc.validUntil = r.expiresAt;
  return doc;
}

/** Reset cached signer (tests). */
export function resetSigner() {
  signer = null;
}
