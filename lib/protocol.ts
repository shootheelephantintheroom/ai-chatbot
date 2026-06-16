import type { Source, Ticket } from "@/components/chat/types";

/** Wire format shared between the chat route handler and the client. */

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
}

/**
 * The route streams newline-delimited JSON (NDJSON) — one `StreamEvent` per
 * line. Phases add event types without changing the transport:
 *  - text    → a token delta (Phase 2)
 *  - sources → cited knowledge-base docs (Phase 3)
 *  - ticket  → a created support ticket (Phase 4)
 *  - done    → stream finished cleanly
 *  - error   → something went wrong; show a friendly message
 */
export type StreamEvent =
  | { type: "text"; value: string }
  | { type: "sources"; value: Source[] }
  | { type: "ticket"; value: Ticket }
  | { type: "done" }
  | { type: "error"; value: string };
