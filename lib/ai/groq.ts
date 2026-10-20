/**
 * Groq chat (OpenAI-compatible). Never throws at import time.
 * https://api.groq.com/openai/v1/chat/completions
 */

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const PLACEHOLDERS = new Set(["", "gsk_your-key", "your-key", "changeme"]);

export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY?.trim() ?? "";
  return key.length > 12 && !PLACEHOLDERS.has(key);
}

export function resolveGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
}

type ChatOpts = {
  messages: GroqMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
};

export async function groqChat(opts: ChatOpts): Promise<string | null> {
  if (!isGroqConfigured()) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolveGroqModel(),
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 800,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Server-sent chunks of assistant text. Caller owns the ReadableStream. */
export async function groqStream(opts: ChatOpts): Promise<ReadableStream<Uint8Array> | null> {
  if (!isGroqConfigured()) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveGroqModel(),
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 800,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) return null;
  return res.body;
}
