/**
 * Seed script: chunks the /knowledge markdown docs, embeds each chunk with
 * Voyage (voyage-3.5), and writes the vectors to embeddings.json (committed).
 *
 * Run with:  npm run embed
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { embed, EMBED_MODEL } from "../lib/voyage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const KNOWLEDGE_DIR = path.join(ROOT, "knowledge");
const OUTPUT = path.join(ROOT, "embeddings.json");

/** Load .env.local into process.env (tsx doesn't do this automatically). */
function loadEnvLocal() {
  if (process.env.VOYAGE_API_KEY) return;
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

/** Title from the first "# " heading, falling back to the slug. */
function titleFromMarkdown(md: string, slug: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : slug;
}

/**
 * Split a doc into chunks. We merge consecutive paragraphs until ~700 chars so
 * each chunk is a coherent, self-contained passage — good for retrieval on
 * short docs like these.
 */
function chunkDoc(md: string): string[] {
  // Drop the leading "# Title" line; it's stored separately as the title.
  const body = md.replace(/^#\s+.+$\n?/m, "").trim();
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  const MAX = 700;
  let current = "";

  for (const para of paragraphs) {
    if (current && (current.length + para.length + 2) > MAX) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

interface Chunk {
  doc: string;
  title: string;
  text: string;
  embedding: number[];
}

async function main() {
  loadEnvLocal();
  if (!process.env.VOYAGE_API_KEY) {
    console.error("Missing VOYAGE_API_KEY (set it in .env.local).");
    process.exit(1);
  }

  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const pending: Omit<Chunk, "embedding">[] = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const md = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf8");
    const title = titleFromMarkdown(md, slug);
    for (const text of chunkDoc(md)) {
      pending.push({ doc: slug, title, text });
    }
  }

  console.log(
    `Embedding ${pending.length} chunks from ${files.length} docs with ${EMBED_MODEL}…`,
  );

  const vectors = await embed(
    pending.map((c) => c.text),
    "document",
  );

  const chunks: Chunk[] = pending.map((c, i) => ({
    ...c,
    embedding: vectors[i],
  }));

  const out = {
    model: EMBED_MODEL,
    dim: chunks[0]?.embedding.length ?? 0,
    generatedAt: new Date().toISOString(),
    chunks,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 0));
  console.log(
    `Wrote ${chunks.length} chunks (dim ${out.dim}) → ${path.relative(ROOT, OUTPUT)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
