/**
 * Corpus loader: parse the markdown knowledge base into retrievable snippets.
 *
 * Each `## Heading` section becomes one snippet { id, title, text }. The intro
 * text before the first heading is ignored. Kept separate from the retriever so
 * the corpus format can change without touching embedding/search logic.
 */

import fs from 'node:fs';
import { resolvePath } from '../core/engine.js';

/**
 * @param {string} filePath - path to a markdown file (project-relative ok)
 * @returns {Array<{ id: string, title: string, text: string }>}
 */
export function loadMarkdownSnippets(filePath) {
  const raw = fs.readFileSync(resolvePath(filePath), 'utf8');
  const sections = raw.split(/^##\s+/m).slice(1); // drop preamble before first ##
  return sections.map((section, i) => {
    const nl = section.indexOf('\n');
    const title = section.slice(0, nl === -1 ? undefined : nl).trim();
    const text = (nl === -1 ? '' : section.slice(nl + 1)).trim();
    return { id: `t${i + 1}`, title, text };
  });
}
