export type Role = "user" | "assistant";

/** A knowledge-base doc cited by the assistant. */
export interface Source {
  doc: string; // slug, e.g. "refund-policy"
  title: string; // display name, e.g. "Refund Policy"
}

/** A support ticket created by the create_support_ticket tool. */
export interface Ticket {
  id: string;
  email: string;
  priority: "low" | "normal" | "high";
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  sources?: Source[];
  ticket?: Ticket;
}
