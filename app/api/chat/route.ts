import type AnthropicNS from "@anthropic-ai/sdk";
import { anthropic, CHAT_MODEL } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/prompt";
import { embed } from "@/lib/voyage";
import { retrieve, buildContext, toSources } from "@/lib/rag";
import { createTicket, type CreateTicketInput } from "@/lib/tickets";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import type { Source } from "@/components/chat/types";
import type { ChatRequest, StreamEvent } from "@/lib/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_SCORE = 0.45;
const MAX_TURNS = 4; // guard against tool-call loops

const TICKET_TOOL: AnthropicNS.Tool = {
  name: "create_support_ticket",
  description:
    "Create a support ticket so a human teammate can follow up with the customer by email. Call this when the customer asks to talk to a human, or when their issue can't be resolved from the knowledge base. Requires the customer's email — ask for it first if you don't have it.",
  input_schema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "The customer's email address for follow-up.",
      },
      issue_summary: {
        type: "string",
        description:
          "A concise, specific summary of the customer's issue or request.",
      },
      priority: {
        type: "string",
        enum: ["low", "normal", "high"],
        description:
          "Urgency: 'high' for billing problems or blocked access, 'normal' for most requests, 'low' for general questions.",
      },
    },
    required: ["email", "issue_summary", "priority"],
  },
};

export async function POST(req: Request) {
  // Per-IP rate limit to deter casual hammering during the demo.
  const { allowed, retryAfter } = checkRateLimit(clientIp(req));
  if (!allowed) {
    return new Response("Rate limit exceeded. Please slow down and try again later.", {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const incoming = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content?.trim(),
  );

  if (incoming.length === 0) {
    return new Response("No messages", { status: 400 });
  }

  // ── Retrieval: ground the answer in the knowledge base ──────────────────
  let context: string | undefined;
  let sources: Source[] = [];
  const lastUser = [...incoming].reverse().find((m) => m.role === "user");

  if (lastUser) {
    try {
      const [queryEmbedding] = await embed([lastUser.content], "query");
      const relevant = retrieve(queryEmbedding, 3).filter(
        (r) => r.score >= MIN_SCORE,
      );
      if (relevant.length > 0) {
        context = buildContext(relevant);
        sources = toSources(relevant);
      }
    } catch (err) {
      console.error("[/api/chat] retrieval error:", err);
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        const system = buildSystemPrompt({ context });
        const convo: AnthropicNS.MessageParam[] = incoming.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Agentic loop: stream a turn; if the model calls the ticket tool,
        // execute it, feed the result back, and let it stream a closing reply.
        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const llmStream = anthropic.messages.stream({
            model: CHAT_MODEL,
            max_tokens: 1024,
            thinking: { type: "disabled" },
            system,
            tools: [TICKET_TOOL],
            messages: convo,
          });

          llmStream.on("text", (delta) => send({ type: "text", value: delta }));

          const final = await llmStream.finalMessage();
          convo.push({ role: "assistant", content: final.content });

          if (final.stop_reason !== "tool_use") break;

          // Execute each tool call and collect results for the next turn.
          const toolResults: AnthropicNS.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type !== "tool_use") continue;
            if (block.name === "create_support_ticket") {
              const ticket = createTicket(
                block.input as CreateTicketInput,
              );
              send({ type: "ticket", value: ticket });
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: `Ticket ${ticket.id} created for ${ticket.email} with ${ticket.priority} priority. A teammate will follow up by email.`,
              });
            } else {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: "Unknown tool.",
                is_error: true,
              });
            }
          }
          convo.push({ role: "user", content: toolResults });
        }

        if (sources.length > 0) send({ type: "sources", value: sources });
        send({ type: "done" });
      } catch (err) {
        console.error("[/api/chat] error:", err);
        send({
          type: "error",
          value:
            "Sorry — something went wrong reaching the assistant. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
