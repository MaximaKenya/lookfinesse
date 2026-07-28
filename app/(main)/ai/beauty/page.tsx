"use client";

import { useState } from "react";
import { Flower2, Send, Sparkles } from "lucide-react";

const STARTERS = [
  "Skincare routine for oily skin",
  "Glass skin morning routine",
  "Best products for hyperpigmentation",
  "Gentle routine for sensitive skin",
  "DIY hair mask for natural hair",
];

export default function BeautyAIPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim()) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, assistantType: "beauty" }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.reply ?? data.message ?? "Cleanse, treat, moisturize, SPF — in that order." }]);
    setLoading(false);
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header className="relative bg-gradient-to-br from-pink-900/25 via-[#0f0f0f] to-rose-900/15 border border-pink-500/15 rounded-3xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 border border-pink-500/20 flex items-center justify-center">
            <Flower2 className="w-6 h-6 text-pink-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold text-white">AI Beauty Advisor</h1>
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <p className="text-white/40 text-sm">Skincare, makeup & wellness routines</p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button key={s} onClick={() => send(s)} className="text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-2 rounded-full hover:bg-white/10 hover:text-white transition-all">
            {s}
          </button>
        ))}
      </div>

      <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl overflow-hidden flex flex-col" style={{ height: "460px" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Flower2 className="w-10 h-10 text-white/15" />
              <p className="text-white/30 text-sm">Your beauty advisor is ready</p>
              <p className="text-white/20 text-xs">Ask about skincare, makeup & routines</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-white text-black rounded-br-sm" : "bg-white/8 text-white/80 border border-white/8 rounded-bl-sm"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-white/8 p-4 flex gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your skin or beauty goal..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors" onKeyDown={(e) => e.key === "Enter" && send()} />
          <button onClick={() => send()} disabled={!input.trim() || loading} className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
