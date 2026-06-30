/**
 * Retriever: ties the embedding capability to the vector store.
 *
 * Embedding is injected (dependency inversion) so this module never imports the
 * QVAC SDK directly — it just needs `embed(text) -> number[]`. That keeps RAG
 * logic unit-testable with a fake embedder and lets us swap embedding backends.
 */

import { VectorStore } from './store.js';

/** @typedef {(text: string) => Promise<number[]>} EmbedFn */

export class Retriever {
  /**
   * @param {EmbedFn} embed - embeds a single string into a vector.
   * @param {VectorStore} [store]
   */
  constructor(embed, store = new VectorStore()) {
    this.embed = embed;
    this.store = store;
  }

  /**
   * Embed and index a batch of {id, title, text} documents.
   * @param {Array<{ id: string, title: string, text: string }>} docs
   */
  async ingest(docs) {
    for (const d of docs) {
      const vector = await this.embed(`${d.title}. ${d.text}`);
      this.store.add({ ...d, vector });
    }
    return this.store.size;
  }

  /**
   * Retrieve the topK most relevant snippets for a query.
   * @param {string} query
   * @param {number} topK
   * @returns {Promise<Array<{ title: string, text: string, score: number }>>}
   */
  async retrieve(query, topK = 3) {
    if (this.store.size === 0) return [];
    const qv = await this.embed(query);
    return this.store
      .search(qv, topK)
      .map(({ doc, score }) => ({ title: doc.title, text: doc.text, score }));
  }

  /** Format retrieved snippets into a context block for a prompt. */
  static toContext(hits) {
    return hits.map((h) => `### ${h.title}\n${h.text}`).join('\n\n');
  }
}
