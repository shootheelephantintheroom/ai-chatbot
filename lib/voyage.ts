export const EMBED_MODEL = "voyage-3.5";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
}

/**
 * Embed one or more texts with Voyage AI.
 *
 * @param inputType "document" when embedding knowledge-base chunks (offline),
 *                  "query" when embedding a user question at request time.
 *                  Voyage uses this to apply the right asymmetric encoding.
 */
export async function embed(
  texts: string[],
  inputType: "query" | "document",
): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY is not set");

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      input: texts,
      model: EMBED_MODEL,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as VoyageResponse;
  // Preserve input order regardless of how the API returns them.
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
