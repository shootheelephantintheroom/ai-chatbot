"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import type { ChatMessage } from "./types";
import type { StreamEvent } from "@/lib/protocol";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Composer } from "./Composer";

let idCounter = 0;
const nextId = () => `m${++idCounter}-${Date.now()}`;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  // True once the first assistant token arrives — controls the typing indicator.
  const [streamStarted, setStreamStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest content.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  async function sendMessage(text: string) {
    if (isStreaming) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", content: text };
    // Send the full history (incl. this turn) so the model handles follow-ups.
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamStarted(false);

    const assistantId = nextId();

    const apply = (event: StreamEvent) => {
      switch (event.type) {
        case "text":
          setStreamStarted(true);
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            if (!exists) {
              return [
                ...prev,
                { id: assistantId, role: "assistant", content: event.value },
              ];
            }
            return prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + event.value }
                : m,
            );
          });
          break;
        case "sources":
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            if (!exists) {
              return [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  sources: event.value,
                },
              ];
            }
            return prev.map((m) =>
              m.id === assistantId ? { ...m, sources: event.value } : m,
            );
          });
          break;
        case "ticket":
          setStreamStarted(true);
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            if (!exists) {
              return [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  ticket: event.value,
                },
              ];
            }
            return prev.map((m) =>
              m.id === assistantId ? { ...m, ticket: event.value } : m,
            );
          });
          break;
        case "error":
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            if (!exists) {
              return [
                ...prev,
                { id: assistantId, role: "assistant", content: event.value },
              ];
            }
            return prev;
          });
          break;
        case "done":
          break;
      }
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            apply(JSON.parse(line) as StreamEvent);
          } catch {
            // ignore malformed partial line
          }
        }
      }
    } catch {
      apply({
        type: "error",
        value:
          "Sorry — I couldn't reach the assistant just now. Please try again.",
      });
    } finally {
      setIsStreaming(false);
      setStreamStarted(false);
    }
  }

  const showTyping = isStreaming && !streamStarted;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>

      {/* Docked panel */}
      <div
        role="dialog"
        aria-label="Nimbus support chat"
        className={[
          "fixed bottom-24 right-5 z-40 flex w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ease-out",
          "h-[600px] max-h-[calc(100vh-8rem)]",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
            <MessageCircle size={18} />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Nimbus Support</div>
            <div className="text-xs text-slate-500">
              Typically replies instantly
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="scroll-thin flex flex-1 flex-col gap-3 overflow-y-auto p-4"
        >
          {messages.length === 0 && !isStreaming ? (
            <EmptyState onPick={sendMessage} />
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {showTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Composer disabled={isStreaming} onSend={sendMessage} />
      </div>
    </>
  );
}
