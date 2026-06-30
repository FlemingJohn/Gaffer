/**
 * In-memory vector store with cosine similarity search.
 *
 * Deliberately dependency-free: the QVAC `embed()` call gives us the vectors,
 * and for a touchline-scale corpus (hundreds of snippets) a linear cosine scan
 * is instant and has zero setup. Swap for the SDK's HyperDB-backed RAG or
 * SQLite-vector backend later without touching callers — the interface is just
 * add() / search().
 */

/** @typedef {{ id: string, title: string, text: string, vector: number[] }} Doc */

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a)) || 1e-8;
}

export class VectorStore {
  constructor() {
    /** @type {Doc[]} */
    this.docs = [];
    /** @type {number[]} */
    this._norms = [];
  }

  get size() {
    return this.docs.length;
  }

  /**
   * Add a document with its precomputed embedding.
   * @param {{ id: string, title: string, text: string, vector: number[] }} doc
   */
  add(doc) {
    this.docs.push(doc);
    this._norms.push(norm(doc.vector));
  }

  /** Bulk add. */
  addMany(docs) {
    for (const d of docs) this.add(d);
  }

  /**
   * Cosine-similarity search.
   * @param {number[]} queryVector
   * @param {number} topK
   * @returns {Array<{ doc: Doc, score: number }>}
   */
  search(queryVector, topK = 3) {
    const qn = norm(queryVector);
    const scored = this.docs.map((doc, i) => ({
      doc,
      score: dot(queryVector, doc.vector) / (qn * this._norms[i]),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /** Serialise the store (vectors included) for caching to disk. */
  toJSON() {
    return { docs: this.docs };
  }

  /** Rehydrate a store from {@link toJSON} output. */
  static fromJSON(json) {
    const store = new VectorStore();
    store.addMany(json.docs || []);
    return store;
  }
}
