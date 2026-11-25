/**
 * OSIA error envelope.
 *
 * Every non-2xx response on the /v1 interface carries the OSIA `Error`
 * schema: `{ "code": <int>, "message": <string> }` and nothing else.
 */

import crypto from 'crypto';

export class OsiaError extends Error {
  /**
   * @param {number} status - HTTP status code
   * @param {string} message - Client-safe message
   * @param {object} [headers] - Extra response headers (e.g. WWW-Authenticate)
   */
  constructor(status, message, headers = undefined) {
    super(message);
    this.name = 'OsiaError';
    this.status = status;
    this.headers = headers;
  }
}

export const badRequest = (message) => new OsiaError(400, message);
export const notFound = (message) => new OsiaError(404, message);

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

export function sanitize(str) {
  return typeof str === 'string' ? str.replace(CONTROL_CHARS, '') : '';
}

/**
 * Write an OSIA error response. 5xx responses never expose internals: the
 * client receives a correlation reference and the cause is logged.
 */
export function sendOsiaError(res, err, context = '') {
  if (err instanceof OsiaError) {
    if (err.headers) res.set(err.headers);
    if (err.status >= 500) {
      const ref = crypto.randomUUID();
      console.error(`[osia] ${sanitize(context)} ref=${ref}: ${sanitize(err.message)}`);
      return res.status(err.status).json({ code: err.status, message: `${sanitize(err.message)} (ref ${ref})` });
    }
    return res.status(err.status).json({ code: err.status, message: sanitize(err.message) });
  }
  const ref = crypto.randomUUID();
  console.error(`[osia] ${sanitize(context)} ref=${ref}:`, err);
  return res.status(500).json({ code: 500, message: `Internal server error (ref ${ref})` });
}
