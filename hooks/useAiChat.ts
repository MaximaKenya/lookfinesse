"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NAIROBI, hasCoords } from "@/lib/geo/haversine";

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type AssistantType =
  | "finance"
  | "stylist"
  | "fitness"
  | "beauty"
  | "concierge"
  | "vendor"
  | "ops";

type SendOpts = {
  assistantType: AssistantType;
  message: string;
  role?: "shopper" | "vendor" | "admin";
  history?: AiChatMessage[];
};

async function readSseReply(res: Response, onDelta: (chunk: string) => void): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as { delta?: string; reply?: string };
        const piece = json.delta ?? json.reply ?? "";
        if (piece) {
          acc += piece;
          onDelta(acc);
        }
      } catch {
        acc += data;
        onDelta(acc);
      }
    }
  }
  return acc;
}

export function useAiChat() {
  const [geo, setGeo] = useState<{ lat?: number; lng?: number; city?: string }>({});

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ lat: NAIROBI.lat, lng: NAIROBI.lng, city: NAIROBI.city }),
      { timeout: 4000, maximumAge: 1000 * 60 * 30 }
    );
  }, []);

  const send = useCallback(
    async (opts: SendOpts, onDelta?: (text: string) => void): Promise<string> => {
      const payload = {
        assistantType: opts.assistantType,
        message: opts.message,
        role: opts.role,
        lat: hasCoords(geo.lat, geo.lng) ? geo.lat : undefined,
        lng: hasCoords(geo.lat, geo.lng) ? geo.lng : undefined,
        city: geo.city,
        history: (opts.history ?? []).slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: !!onDelta,
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: onDelta ? "text/event-stream" : "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Assistant request failed");
      }

      const ctype = res.headers.get("content-type") ?? "";
      if (onDelta && ctype.includes("text/event-stream")) {
        const full = await readSseReply(res, onDelta);
        return full || "I had trouble streaming that — try again.";
      }

      const data = await res.json();
      return (data.reply as string) ?? data.message ?? "";
    },
    [geo]
  );

  return { send, geo };
}

export function useAssistantThread(assistantType: AssistantType) {
  const { send, geo } = useAiChat();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const ask = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;
      abortRef.current = false;
      setInput("");
      setError(null);
      const userMsg: AiChatMessage = {
        role: "user",
        content: msg,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);

      const assistantMsg: AiChatMessage = {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);

      try {
        const reply = await send(
          { assistantType, message: msg, history: [...messages, userMsg] },
          (delta) => {
            if (abortRef.current) return;
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: delta };
              }
              return copy;
            });
          }
        );
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: reply || last.content };
          }
          return copy;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setMessages((m) => m.filter((x) => x.content !== "" || x.role !== "assistant"));
      } finally {
        setLoading(false);
      }
    },
    [assistantType, input, loading, messages, send]
  );

  return { messages, input, setInput, loading, error, ask, geo };
}
