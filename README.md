# Nimbus Support — AI customer-support widget

A customer-support AI chatbot embedded as a real product feature inside a
believable SaaS dashboard. The "product" is **Nimbus**, a fictional
project-management tool; the assistant docks bottom-right like Intercom and runs
end to end with real API calls — no database.

![widget](https://img.shields.io/badge/Next.js-14-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## What this demonstrates

A production-style support assistant embedded as a real product feature:
streaming token-by-token responses, retrieval-augmented answers grounded in a
knowledge base with **real Voyage embeddings** and source citations, a **live
tool call** that files a support ticket, and an escalate-to-human fallback — all
running end to end against real APIs, with no database, deployable to Vercel as a
public link.

## Features

1. **Streaming responses** — tokens stream from the Anthropic API to the UI with
   a typing indicator before the first token; send is disabled while streaming.
2. **RAG with real embeddings** — 7 markdown knowledge-base docs are chunked and
   embedded with Voyage `voyage-3.5` into a committed `embeddings.json`. At
   request time the question is embedded, ranked by in-memory cosine similarity,
   and the top 3 chunks are injected into the system prompt as labeled context.
3. **Citations** — the model answers only from retrieved context; the source
   docs render as small pills under the answer.
4. **Live tool call** — a `create_support_ticket` tool (email, issue summary,
   priority) writes to a local JSON store and returns a ticket id, rendered as a
   confirmation card in the chat.
5. **Multi-turn memory + escalate-to-human** — full conversation history is sent
   each turn. When the assistant can't answer from the docs (or the user asks for
   a human) and has no email yet, it asks for one, then fires the ticket tool.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind**
- **Anthropic API** — streaming chat, model `claude-sonnet-4-6`
- **Voyage AI** — embeddings, model `voyage-3.5`
- **No database** — KB vectors in committed `embeddings.json`; tickets in a local
  JSON file (`./data` locally, `/tmp` on Vercel). All API calls go through
  Next.js route handlers; keys are read server-side only.

## Setup

```bash
npm install
cp .env.local.example .env.local      # then fill in the two keys
npm run embed                          # builds embeddings.json from /knowledge
npm run dev                            # http://localhost:3000
```

Open the app and click the chat button in the bottom-right corner.

> `embeddings.json` is committed, so `npm run embed` only needs to be re-run when
> you change the docs in `/knowledge`.

### Environment variables

| Variable            | Used for                                   |
| ------------------- | ------------------------------------------ |
| `ANTHROPIC_API_KEY` | Streaming chat completions                 |
| `VOYAGE_API_KEY`    | Embeddings for retrieval (RAG)             |

Both are read **server-side only**, inside Next.js route handlers / the seed
script — never shipped to the browser. `.env.local` is gitignored.

## Try it

- *"What plans do you offer?"* → grounded answer + citation pills
- *"How do I export my data?"* → grounded answer
- *"I need help with a refund"* → grounded answer; ask for a human to escalate
- *"I've been double-charged, I need a person"* → it asks for your email, then
  files a ticket and shows the confirmation card

## Deploying to Vercel

1. Push the repo to GitHub (`embeddings.json` is committed; `.env.local` is not).
2. Import the project in Vercel.
3. Add `ANTHROPIC_API_KEY` and `VOYAGE_API_KEY` as Environment Variables.
4. Deploy. No build configuration needed.

## Scripts

| Command          | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `npm run dev`    | Start the dev server                                   |
| `npm run build`  | Production build                                       |
| `npm run start`  | Run the production build                               |
| `npm run embed`  | Re-embed `/knowledge` → `embeddings.json` (uses Voyage)|

## Project structure

```
app/
  api/chat/route.ts     # streaming chat: RAG retrieval + tool loop (server-only)
  page.tsx              # Nimbus dashboard shell + chat widget
  layout.tsx            # fonts, metadata
components/
  Sidebar / Header / DashboardContent   # the Nimbus product shell
  chat/                 # ChatWidget, MessageBubble (pills + ticket card), Composer, …
lib/
  anthropic.ts          # server-only Anthropic client
  voyage.ts             # Voyage embeddings client
  rag.ts                # cosine similarity + context/citation builders
  tickets.ts            # local JSON ticket store
  prompt.ts             # system prompt (grounding + escalation rules)
  protocol.ts           # NDJSON stream event types (shared client/server)
knowledge/              # 7 markdown KB docs
scripts/embed.ts        # seed script for embeddings.json
embeddings.json         # committed vectors (generated by npm run embed)
```
# chatbot-demo
