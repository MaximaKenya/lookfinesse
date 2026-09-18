"use client";

import type { LucideIcon } from "lucide-react";
import { Send } from "lucide-react";
import AiMarkdown from "@/components/ai/AiMarkdown";
import { useAssistantThread } from "@/hooks/useAiChat";

type AssistantType = "stylist" | "fitness" | "beauty" | "concierge";

export default function AssistantChat({
  assistantType,
  title,
  subtitle,
  icon: Icon,
  accent,
  starters,
  emptyTitle,
  emptyHint,
}: {
  assistantType: AssistantType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: "purple" | "cyan" | "pink" | "amber";
  starters: string[];
  emptyTitle: string;
  emptyHint: string;
}) {
  const { messages, input, setInput, loading, error, ask } = useAssistantThread(assistantType);

  const tones: Record<typeof accent, { header: string; icon: string; bounce: string; btn: string }> = {
    purple: {
      header: "from-purple-900/25 via-[#0f0f0f] to-pink-900/15 border-purple-500/15",
      icon: "from-purple-500/30 to-pink-500/20 border-purple-500/20 text-purple-300",
      bounce: "bg-purple-400",
      btn: "from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
    },
    cyan: {
      header: "from-cyan-900/25 via-[#0f0f0f] to-blue-900/15 border-cyan-500/15",
      icon: "from-cyan-500/30 to-blue-500/20 border-cyan-500/20 text-cyan-300",
      bounce: "bg-cyan-400",
      btn: "from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500",
    },
    pink: {
      header: "from-pink-900/25 via-[#0f0f0f] to-rose-900/15 border-pink-500/15",
      icon: "from-pink-500/30 to-rose-500/20 border-pink-500/20 text-pink-300",
      bounce: "bg-pink-400",
      btn: "from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500",
    },
    amber: {
      header: "from-amber-900/25 via-[#0f0f0f] to-orange-900/15 border-amber-500/15",
      icon: "from-amber-500/30 to-orange-500/20 border-amber-500/20 text-amber-300",
      bounce: "bg-amber-400",
      btn: "from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500",
    },
  };

  const t = tones[accent];

  return (
    <section className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">
      <header className={`relative bg-gradient-to-br ${t.header} border rounded-3xl p-6 overflow-hidden`}>
        <div className="relative flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.icon} border flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-white/40 text-sm">{subtitle}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2" role="list">
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            disabled={loading}
            className="text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-2 rounded-full hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div
        className="bg-[#0f0f0f] border border-white/8 rounded-3xl overflow-hidden flex flex-col"
        style={{ height: "min(520px, 70vh)" }}
        aria-live="polite"
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <Icon className="w-10 h-10 text-white/15" />
              <p className="text-white/50 text-sm font-medium">{emptyTitle}</p>
              <p className="text-white/25 text-xs">{emptyHint}</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={`${m.created_at}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-white text-black rounded-br-sm"
                    : "bg-white/8 text-white/85 border border-white/8 rounded-bl-sm"
                }`}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <AiMarkdown content={m.content} />
                  ) : (
                    <div className="flex gap-1.5 items-center py-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.bounce} animate-bounce`} style={{ animationDelay: "0ms" }} />
                      <span className={`w-1.5 h-1.5 rounded-full ${t.bounce} animate-bounce`} style={{ animationDelay: "150ms" }} />
                      <span className={`w-1.5 h-1.5 rounded-full ${t.bounce} animate-bounce`} style={{ animationDelay: "300ms" }} />
                    </div>
                  )
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="px-4 pb-2 text-xs text-red-400">{error} — check your connection and try again.</p>
        )}

        <form
          className="border-t border-white/8 p-4 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <label className="sr-only" htmlFor={`ai-input-${assistantType}`}>
            Message {title}
          </label>
          <input
            id={`ai-input-${assistantType}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            autoComplete="off"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`bg-gradient-to-r ${t.btn} text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all shrink-0`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
