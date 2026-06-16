import { MessageSquareText } from "lucide-react";

const SUGGESTIONS = [
  "What plans do you offer?",
  "How do I export my data?",
  "I need help with a refund",
];

export function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
        <MessageSquareText size={22} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        How can we help?
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Ask about plans, billing, integrations, or your account.
      </p>
      <div className="mt-5 w-full space-y-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-700 transition-colors hover:border-accent hover:bg-accent-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
