"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import {
  Sparkles,
  Send,
  Dumbbell,
  Shirt,
  Heart,
  Wallet,
  ConciergeBell,
  X,
  MessageCircle,
  ChevronDown,
  Minimize2,
} from "lucide-react";

type AssistantType =
  | "finance"
  | "stylist"
  | "fitness"
  | "beauty"
  | "concierge";

type CopilotMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const assistants = [
  { id: "concierge", label: "Lifestyle", icon: ConciergeBell },
  { id: "stylist", label: "Stylist", icon: Shirt },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "beauty", label: "Beauty", icon: Heart },
  { id: "finance", label: "Finance", icon: Wallet },
] as const;

const FAB_STORAGE_KEY = "lf_copilot_fab_pos";
const FAB_SIZE = 56;

type FabPosition = { x: number; y: number };

function loadFabPosition(): FabPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FAB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FabPosition;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function defaultFabPosition(): FabPosition {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const margin = 16;
  const bottomNav = 88; // ~5.5rem
  return {
    x: window.innerWidth - FAB_SIZE - margin,
    y: window.innerHeight - FAB_SIZE - bottomNav - margin,
  };
}

function clampFabPosition(pos: FabPosition): FabPosition {
  if (typeof window === "undefined") return pos;
  const margin = 8;
  const topBar = 56;
  const bottomNav = 72;
  return {
    x: Math.min(Math.max(margin, pos.x), window.innerWidth - FAB_SIZE - margin),
    y: Math.min(
      Math.max(topBar + margin, pos.y),
      window.innerHeight - FAB_SIZE - bottomNav - margin
    ),
  };
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function MessageTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(formatTime(iso));
  }, [iso]);

  if (!label) return null;
  return <div className="text-[10px] opacity-60 mt-2">{label}</div>;
}

export default function CopilotPanel() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantType, setAssistantType] = useState<AssistantType>("concierge");
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [geo, setGeo] = useState<{ lat?: number; lng?: number }>({});
  const [fabPos, setFabPos] = useState<FabPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  useEffect(() => {
    setMounted(true);
    const saved = loadFabPosition();
    setFabPos(clampFabPosition(saved ?? defaultFabPosition()));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const onResize = () => setFabPos((p) => clampFabPosition(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted]);

  const persistFab = useCallback((pos: FabPosition) => {
    const clamped = clampFabPosition(pos);
    setFabPos(clamped);
    try {
      localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(clamped));
    } catch {
      /* ignore */
    }
  }, []);

  const onFabPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      dragMoved.current = false;
      setDragging(true);
      dragOffset.current = {
        x: e.clientX - fabPos.x,
        y: e.clientY - fabPos.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [fabPos]
  );

  const onFabPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging) return;
      dragMoved.current = true;
      persistFab({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    },
    [dragging, persistFab]
  );

  const onFabPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      setDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    []
  );

  const openCopilot = useCallback(() => {
    setIsOpen(true);
    setCollapsed(false);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 3000, maximumAge: 1000 * 60 * 30 }
    );
  }, []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function askCopilot() {
    if (!input.trim()) return;

    const userMessage: CopilotMessage = {
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user-id",
          assistantType,
          message: currentInput,
          lat: geo.lat,
          lng: geo.lng,
        }),
      });

      if (!response.ok) throw new Error("Copilot request failed");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const panelBottom = "calc(5rem + env(safe-area-inset-bottom, 0px))";

  const fabStyle: React.CSSProperties = {
    left: fabPos.x,
    top: fabPos.y,
    touchAction: "none",
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerUp}
        onClick={() => {
          if (!dragMoved.current) openCopilot();
        }}
        aria-label="Open AI Copilot"
        style={fabStyle}
        className={`fixed z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-xl border border-amber-500/30 text-amber-200 shadow-lg shadow-amber-500/10 flex items-center justify-center hover:border-rose-400/40 transition-colors select-none ${dragging ? "scale-105 cursor-grabbing" : "hover:scale-105 cursor-grab"}`}
      >
        <Sparkles className="w-5 h-5 md:w-6 md:h-6 pointer-events-none" />
      </button>
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerUp}
        onClick={() => {
          if (!dragMoved.current) setCollapsed(false);
        }}
        style={fabStyle}
        aria-label="Expand AI Copilot"
        className={`fixed z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/70 backdrop-blur-xl border border-emerald-500/25 text-emerald-200 text-xs font-semibold shadow-lg select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <Sparkles className="w-4 h-4 text-amber-300 pointer-events-none" />
        Copilot
        <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={() => setIsOpen(false)}
        aria-hidden
      />

      <div
        style={{ bottom: panelBottom }}
        className="fixed z-50 flex flex-col bg-black/75 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-amber-900/20 overflow-hidden inset-x-0 top-14 md:inset-x-auto md:top-auto md:right-6 md:w-[400px] md:h-[min(680px,calc(100vh-8rem))] md:rounded-[28px] rounded-t-[28px] max-h-[calc(100vh-5rem-env(safe-area-inset-bottom))]"
      >
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-950/30 via-black/80 to-rose-950/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-white font-bold text-base">AI Copilot</div>
                <div className="text-[10px] text-emerald-300/70">LookFinesse intelligence</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="p-2 text-zinc-400 hover:text-white hidden md:block"
                aria-label="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1 scrollbar-hide">
            {assistants.map((assistant) => {
              const Icon = assistant.icon;
              const active = assistant.id === assistantType;
              return (
                <button
                  key={assistant.id}
                  type="button"
                  onClick={() => setAssistantType(assistant.id as AssistantType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition ${
                    active
                      ? "bg-gradient-to-r from-amber-500/30 to-rose-500/20 border-amber-400/40 text-amber-100"
                      : "bg-white/5 text-white/60 border-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {assistant.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-white font-semibold">Welcome</div>
              <div className="text-zinc-400 mt-2 text-xs leading-relaxed">
                Outfit picks · skincare · workouts · bookings · creator tips · finance insights
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.created_at}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-amber-400 to-rose-400 text-black"
                    : "bg-white/8 text-white border border-white/10"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                <MessageTime iso={message.created_at} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-zinc-400 text-sm">
              Thinking…
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-white/10 bg-black/80 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    askCopilot();
                  }
                }}
                placeholder={`Ask ${assistantType}…`}
                rows={1}
                className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder:text-zinc-500 max-h-24"
              />
            </div>
            <button
              type="button"
              onClick={askCopilot}
              disabled={loading}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-black flex items-center justify-center disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <MessageCircle className="w-4 h-4 animate-pulse" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
