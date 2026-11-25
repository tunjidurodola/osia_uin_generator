/**
 * Loads api/uin.yaml and compiles its schemas so that request validation on
 * the /v1 interface is driven by the published OSIA specification itself.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SPEC_PATH = path.resolve(__dirname, '../../api/uin.yaml');

const INT32_MIN = -(2 ** 31);
const INT32_MAX = 2 ** 31 - 1;

function createAjv({ coerceTypes = false } = {}) {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictTypes: false,
    strictRequired: false,
    coerceTypes,
    useDefaults: false
  });
  addFormats(ajv, ['date-time', 'uri']);
  ajv.addFormat('int32', {
    type: 'number',
    validate: (n) => Number.isInteger(n) && n >= INT32_MIN && n <= INT32_MAX
  });
  ajv.addFormat('int64', { type: 'number', validate: (n) => Number.isSafeInteger(n) });
  ajv.addVocabulary(['example', 'xml', 'externalDocs', 'components']);
  return ajv;
}

let cached = null;

/**
 * @returns {{doc: object, operations: Map<string, object>, version: string,
 *            validateSchema: (name: string, data: any) => string[] | null,
 *            validateResponse: (operationId: string, status: number, body: any) => string[] | null}}
 */
export function getSpec() {
  if (cached) return cached;

  const doc = YAML.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
  const ajv = createAjv();
  const paramAjv = createAjv({ coerceTypes: true });
  const components = { components: doc.components };
  ajv.addSchema(components, 'osia');
  paramAjv.addSchema(components, 'osia');

  const resolve = (obj) => {
    let cur = obj;
    while (cur && cur.$ref) {
      const parts = cur.$ref.replace(/^#\//, '').split('/');
      cur = parts.reduce((o, k) => o[k], doc);
    }
    return cur;
  };
  const ref = (schema) => (schema.$ref ? { $ref: `osia${schema.$ref}` } : rewriteRefs(schema));
  const rewriteRefs = (schema) =>
    JSON.parse(JSON.stringify(schema).replace(/"\$ref":"#\//g, '"$ref":"osia#/'));

  const operations = new Map();
  for (const [route, item] of Object.entries(doc.paths)) {
    for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
      const op = item[method];
      if (!op) continue;

      const params = (op.parameters || []).map(resolve);
      const build = (location) => {
        const ps = params.filter((p) => p.in === location);
        if (ps.length === 0) return null;
        return paramAjv.compile({
          type: 'object',
          properties: Object.fromEntries(ps.map((p) => [p.name, ref(p.schema)])),
          required: ps.filter((p) => p.required).map((p) => p.name)
        });
      };

      const bodySpec = op.requestBody ? resolve(op.requestBody) : null;
      const bodySchema = bodySpec?.content?.['application/json']?.schema;

      const responses = new Map();
      for (const [status, r] of Object.entries(op.responses || {})) {
        const schema = resolve(r)?.content?.['application/json']?.schema;
        responses.set(Number(status), schema ? ajv.compile(ref(schema)) : null);
      }

      operations.set(op.operationId, {
        operationId: op.operationId,
        method,
        route,
        scopes: (op.security || []).flatMap((s) => s.BearerAuth || []),
        query: build('query'),
        path: build('path'),
        body: bodySchema ? ajv.compile(ref(bodySchema)) : null,
        bodyRequired: Boolean(bodySpec?.required),
        responses
      });
    }
  }

  const schemaValidators = new Map();
  const validateSchema = (name, data) => {
    if (!schemaValidators.has(name)) {
      schemaValidators.set(name, ajv.getSchema(`osia#/components/schemas/${name}`));
    }
    const v = schemaValidators.get(name);
    return v(data) ? null : formatErrors(v.errors, name);
  };

  const validateResponse = (operationId, status, body) => {
    const op = operations.get(operationId);
    if (!op) return [`unknown operation ${operationId}`];
    if (!op.responses.has(status)) return [`status ${status} is not declared for ${operationId}`];
    const v = op.responses.get(status);
    if (!v) return body === undefined || body === '' ? null : ['response must not have a JSON body'];
    return v(body) ? null : formatErrors(v.errors, 'response');
  };

  cached = { doc, operations, version: doc.info.version, validateSchema, validateResponse };
  return cached;
}

/**
 * Turn Ajv errors into short, client-safe messages.
 */
export function formatErrors(errors, root) {
  return (errors || []).map((e) => {
    const where = `${root}${e.instancePath.replace(/\//g, '.')}`;
    if (e.keyword === 'additionalProperties') {
      return `${where} has unexpected property "${e.params.additionalProperty}"`;
    }
    if (e.keyword === 'required') {
      return `${where} is missing required property "${e.params.missingProperty}"`;
    }
    if (e.keyword === 'enum') {
      return `${where} must be one of: ${e.params.allowedValues.join(', ')}`;
    }
    return `${where} ${e.message}`;
  });
}
