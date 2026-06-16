import { FileText, CheckCircle2, Mail } from "lucide-react";
import type { ChatMessage, Ticket } from "./types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[88%] flex-col gap-1.5 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {message.content && (
          <div
            className={[
              "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              isUser
                ? "rounded-br-md bg-accent text-white"
                : "rounded-bl-md bg-slate-100 text-slate-800",
            ].join(" ")}
          >
            {message.content}
          </div>
        )}

        {message.ticket && <TicketCard ticket={message.ticket} />}

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((s) => (
              <span
                key={s.doc}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
              >
                <FileText size={11} className="text-slate-400" />
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const priorityStyles: Record<Ticket["priority"], string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-accent-50 text-accent-700",
  high: "bg-rose-50 text-rose-700",
};

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
        <CheckCircle2 size={16} className="text-emerald-600" />
        <span className="text-sm font-semibold text-slate-900">
          Ticket created
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityStyles[ticket.priority]}`}
        >
          {ticket.priority}
        </span>
      </div>
      <div className="space-y-2 px-3.5 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-slate-500">Reference</span>
          <span className="font-mono text-sm font-semibold text-slate-900">
            {ticket.id}
          </span>
        </div>
        <p className="text-sm leading-snug text-slate-700">{ticket.summary}</p>
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
          <Mail size={13} className="text-slate-400" />
          We&apos;ll email <span className="font-medium text-slate-700">{ticket.email}</span> with an update.
        </div>
      </div>
    </div>
  );
}
