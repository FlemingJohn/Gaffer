/**
 * LLM capability — thin wrapper over QVAC `completion()`.
 *
 * Verified surface: completion({ modelId, history, stream, responseFormat })
 * returns a run with `.tokenStream` (async string tokens), `.events`,
 * `.final` (-> { contentText }), and `.text`. We accumulate tokenStream, which
 * is the simplest verified path and lets callers stream to the console.
 */

import { getSdk } from '../core/engine.js';

/**
 * Run a completion and return the full text.
 * @param {object} args
 * @param {string} args.modelId
 * @param {Array<{role:string, content:string}>} args.history
 * @param {object} [args.responseFormat] - e.g. { type: 'json_object' }
 * @param {(token:string)=>void} [args.onToken] - stream callback
 * @returns {Promise<string>}
 */
export async function complete({ modelId, history, responseFormat, onToken }) {
  const sdk = getSdk();
  const run = sdk.completion({
    modelId,
    history,
    stream: true,
    ...(responseFormat ? { responseFormat } : {}),
  });
  let text = '';
  for await (const token of run.tokenStream) {
    text += token;
    if (onToken) onToken(token);
  }
  return text.trim();
}

/**
 * Run a system+user turn constrained to a JSON Schema. This is the robust path
 * for small on-device models: generation is constrained to the schema, so the
 * model cannot emit out-of-enum values or omit required fields. The caller
 * still validates with Zod (belt and braces).
 * @param {object} args
 * @param {string} args.modelId
 * @param {string} args.system
 * @param {string} args.user
 * @param {{ name: string, schema: object }} args.jsonSchema
 * @returns {Promise<string>} raw model text (a JSON object matching the schema)
 */
export async function completeStructured({ modelId, system, user, jsonSchema }) {
  return complete({
    modelId,
    history: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    responseFormat: { type: 'json_schema', json_schema: jsonSchema },
  });
}
