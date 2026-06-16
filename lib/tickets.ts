import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Ticket } from "@/components/chat/types";

/**
 * Local JSON ticket store. Locally this writes to ./data/tickets.json; on
 * Vercel (read-only filesystem except /tmp) it writes under the temp dir.
 * No database — exactly as the demo requires.
 */
const DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "nimbus")
  : path.join(process.cwd(), "data");
const FILE = path.join(DIR, "tickets.json");

type StoredTicket = Ticket & { createdAt: string };

function readAll(): StoredTicket[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as StoredTicket[];
  } catch {
    return [];
  }
}

function writeAll(tickets: StoredTicket[]) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(tickets, null, 2));
}

function generateId(): string {
  const suffix = Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5)
    .padEnd(5, "0");
  return `NIM-${suffix}`;
}

const PRIORITIES = ["low", "normal", "high"] as const;

export interface CreateTicketInput {
  email: string;
  issue_summary: string;
  priority?: string;
}

export function createTicket(input: CreateTicketInput): Ticket {
  const priority = (
    PRIORITIES.includes(input.priority as (typeof PRIORITIES)[number])
      ? input.priority
      : "normal"
  ) as Ticket["priority"];

  const ticket: Ticket = {
    id: generateId(),
    email: input.email,
    summary: input.issue_summary,
    priority,
  };

  const all = readAll();
  all.push({ ...ticket, createdAt: new Date().toISOString() });
  writeAll(all);

  return ticket;
}
