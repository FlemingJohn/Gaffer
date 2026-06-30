/**
 * Embedding capability — thin wrapper over QVAC `embed()`.
 *
 * Verified shape: embed({ modelId, text }) -> { embedding }.
 *   text: string   -> embedding: number[]
 *   text: string[] -> embedding: number[][]
 */

import { getSdk } from '../core/engine.js';

/**
 * Build an embedder bound to a loaded embedding model.
 * Returns a function `embed(text) -> number[]` suitable for the Retriever.
 * @param {string} modelId
 */
export function createEmbedder(modelId) {
  return async function embedText(text) {
    const sdk = getSdk();
    const { embedding } = await sdk.embed({ modelId, text });
    return embedding;
  };
}

/**
 * Batch-embed many strings in one call.
 * @param {string} modelId
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(modelId, texts) {
  const sdk = getSdk();
  const { embedding } = await sdk.embed({ modelId, text: texts });
  return embedding;
}
