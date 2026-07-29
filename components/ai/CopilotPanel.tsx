"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
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
  CloudSun,
  BarChart3,
  BrainCircuit,
  Store,
  Megaphone,
  Flower2,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

type AssistantType =
  | "finance"
  | "stylist"
  | "fitness"
  | "beauty"
  | "concierge"
  | "vendor"
  | "ops";

type CopilotMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type AiMenuItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  assistant?: AssistantType;
  roles: Array<"shopper" | "vendor" | "admin">;
};

const AI_MENU: AiMenuItem[] = [
  {
    id: "stylist",
    label: "AI Stylist",
    description: "Outfit picks for Nairobi weather & occasions",
    icon: Shirt,
    href: "/ai/stylist",
    assistant: "stylist",
    roles: ["shopper", "vendor", "admin"],
  },
  {
    id: "dresser",
    label: "Virtual Dresser",
    description: "Try looks on your avatar",
    icon: Sparkles,
    href: "/ai/virtual-dresser",
    roles: ["shopper", "vendor", "admin"],
  },
  {
    id: "today",
    label: "Today tips",
    description: "Personalized outfit, skin & move tips",
    icon: CloudSun,
    href: "/for-you",
    roles: ["shopper", "vendor", "admin"],
  },
  {
    id: "beauty",
    label: "AI Beauty",
    description: "Skincare for melanin-rich skin",
    icon: Flower2,
    href: "/ai/beauty",
    assistant: "beauty",
    roles: ["shopper", "vendor", "admin"],
  },
  {
    id: "fitness",
    label: "AI Fitness",
    description: "Workouts & trainer bookings",
    icon: Dumbbell,
    href: "/ai/fitness",
    assistant: "fitness",
    roles: ["shopper", "vendor", "admin"],
  },
  {
    id: "lifestyle",
    label: "Lifestyle concierge",
    description: "Chat — experiences, shops, bookings",
    icon: ConciergeBell,
    assistant: "concierge",
    roles: ["shopper", "vendor", "admin"],
  },
  {
    id: "vendor-insights",
    label: "Vendor insights",
    description: "Growth signals & merchandising intel",
    icon: BarChart3,
    href: "/vendor/intelligence",
    assistant: "vendor",
    roles: ["vendor", "admin"],
  },
  {
    id: "creator",
    label: "Creator Studio",
    description: "Content, products & live commerce",
    icon: Store,
    href: "/dashboard/creator-studio",
    roles: ["vendor", "admin"],
  },
  {
    id: "ads",
    label: "Ads & campaigns",
    description: "Promote posts and carousel ads",
    icon: Megaphone,
    href: "/dashboard/ads",
    roles: ["vendor", "admin"],
  },
  {
    id: "finance",
    label: "Finance assistant",
    description: "Payouts, escrow & M-Pesa help",
    icon: Wallet,
    assistant: "finance",
    roles: ["vendor", "admin"],
  },
  {
    id: "sentiment",
    label: "Sentiment",
    description: "Marketplace mood & review signals",
    icon: Heart,
    href: "/intelligence",
    assistant: "ops",
    roles: ["admin"],
  },
  {
    id: "intel",
    label: "AI Intelligence",
    description: "Risk, treasury & ops command",
    icon: BrainCircuit,
    href: "/intelligence",
    assistant: "ops",
    roles: ["admin"],
  },
];

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
  const bottomNav = 88;
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

type PanelView = "menu" | "chat";

export default function CopilotPanel() {
  const { isAdmin, isVendor, loading: roleLoading } = useUserRole();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantType, setAssistantType] = useState<AssistantType>("concierge");
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<PanelView>("menu");
  const [mounted, setMounted] = useState(false);
  const [geo, setGeo] = useState<{ lat?: number; lng?: number }>({});
  const [fabPos, setFabPos] = useState<FabPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const role = useMemo<"shopper" | "vendor" | "admin">(() => {
    if (isAdmin) return "admin";
    if (isVendor) return "vendor";
    return "shopper";
  }, [isAdmin, isVendor]);

  const menuItems = useMemo(() => {
    return AI_MENU.filter((item) => item.roles.includes(role));
  }, [role]);

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

  const onFabPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const openCopilot = useCallback(() => {
    setIsOpen(true);
    setCollapsed(false);
    setView("menu");
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
  }, [messages, isOpen, view]);

  function openChat(assistant: AssistantType) {
    setAssistantType(assistant);
    setView("chat");
  }

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
          assistantType,
          message: currentInput,
          lat: geo.lat,
          lng: geo.lng,
          role,
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

  const roleLabel =
    role === "admin" ? "Admin tools" : role === "vendor" ? "Vendor tools" : "Shopper tools";

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
                <div className="text-[10px] text-emerald-300/70">
                  {roleLoading ? "LookFinesse intelligence" : roleLabel}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {view === "chat" && (
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  className="px-2 py-1.5 text-[11px] text-amber-200/80 hover:text-amber-100"
                >
                  Menu
                </button>
              )}
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
        </div>

        {view === "menu" ? (
          <div className="flex-1 min-h-0 overflow-y-auto max-h-[min(520px,calc(100vh-12rem))] p-3 space-y-1.5">
            <p className="px-2 pb-2 text-[11px] text-white/45 leading-relaxed">
              Scroll for more tools. Tap a link to open it, or chat with an assistant.
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const chatOnly = !item.href && item.assistant;
              const row = (
                <div className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-amber-500/25 transition-colors">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <Icon className="h-4 w-4 text-amber-200" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-white/45 truncate">
                      {item.description}
                    </span>
                  </span>
                  {item.href ? (
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  ) : (
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 text-amber-300/70" />
                  )}
                </div>
              );

              if (chatOnly && item.assistant) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openChat(item.assistant!)}
                    className="w-full text-left"
                  >
                    {row}
                  </button>
                );
              }

              return (
                <div key={item.id} className="space-y-1">
                  {item.href && (
                    <Link href={item.href} onClick={() => setIsOpen(false)}>
                      {row}
                    </Link>
                  )}
                  {item.assistant && item.href && (
                    <button
                      type="button"
                      onClick={() => openChat(item.assistant!)}
                      className="w-full px-3 py-1.5 text-left text-[11px] text-amber-200/70 hover:text-amber-100"
                    >
                      Chat about {item.label.toLowerCase()} →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-white font-semibold capitalize">{assistantType} chat</div>
                  <div className="text-zinc-400 mt-2 text-xs leading-relaxed">
                    Ask anything — answers use your prefs, weather, and role context when available.
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
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
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
          </>
        )}
      </div>
    </>
  );
}
