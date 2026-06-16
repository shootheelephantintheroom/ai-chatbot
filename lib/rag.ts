import type { Source } from "@/components/chat/types";
import store from "@/embeddings.json";

interface Chunk {
  doc: string;
  title: string;
  text: string;
  embedding: number[];
}

const chunks = store.chunks as Chunk[];

/** Cosine similarity between two vectors. */
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export interface Retrieved {
  chunk: Chunk;
  score: number;
}

/** Rank all chunks against a query embedding and return the top `k`. */
export function retrieve(queryEmbedding: number[], k = 3): Retrieved[] {
  return chunks
    .map((chunk) => ({ chunk, score: cosine(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Format retrieved chunks as a labeled context block for the system prompt.
 * Each excerpt is tagged with its source title so the model can ground and
 * cite its answer.
 */
export function buildContext(retrieved: Retrieved[]): string {
  const excerpts = retrieved
    .map((r) => `[${r.chunk.title}]\n${r.chunk.text}`)
    .join("\n\n");

  return `Knowledge base excerpts (your only source of truth):\n<<<\n${excerpts}\n>>>`;
}

/** De-duplicated source docs (for the citation pills), preserving rank order. */
export function toSources(retrieved: Retrieved[]): Source[] {
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const r of retrieved) {
    if (seen.has(r.chunk.doc)) continue;
    seen.add(r.chunk.doc);
    sources.push({ doc: r.chunk.doc, title: r.chunk.title });
  }
  return sources;
}
