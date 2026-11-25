/**
 * Evaluate caller-supplied regular expressions without exposing the event
 * loop to catastrophic backtracking: matching runs inside a separate V8
 * context with a hard execution timeout.
 */

import vm from 'vm';
import { badRequest } from './errors.mjs';

const TIMEOUT_MS = 50;
const script = new vm.Script(`
  (() => {
    const m = new RegExp(pattern).exec(input);
    return m ? { groups: m.groups ? Object.assign({}, m.groups) : {} } : null;
  })()
`);

/**
 * Anchored match of `input` against `pattern`.
 * @returns {{groups: object} | null}
 * @throws {OsiaError} 400 when the pattern is invalid or too expensive
 */
export function safeFullMatch(pattern, input) {
  const context = vm.createContext({ pattern: `^(?:${pattern})$`, input });
  try {
    return script.runInContext(context, { timeout: TIMEOUT_MS });
  } catch (err) {
    if (err && err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      throw badRequest('pattern evaluation exceeded the time limit');
    }
    throw badRequest('pattern is not a valid regular expression');
  }
}
