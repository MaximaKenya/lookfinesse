import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabaseClient";
import { trackBehavior } from "@/lib/ai/trackBehavior";
import type { SentimentLabel, SentimentSourceType } from "@/lib/ai/sentimentTypes";
import { isOpenAiConfigured, resolveOpenAiModel } from "@/lib/ai/provider";

export type { SentimentLabel, SentimentSourceType } from "@/lib/ai/sentimentTypes";

export type SentimentResult = {
  sentiment: SentimentLabel;
  score: number;
  topics: string[];
};

const POSITIVE_WORDS = [
  "love", "great", "amazing", "excellent", "beautiful", "perfect", "best",
  "happy", "recommend", "awesome", "fantastic", "gorgeous", "stunning",
  "thank", "wonderful", "fire", "slay", "obsessed", "incredible",
];

const NEGATIVE_WORDS = [
  "hate", "bad", "terrible", "awful", "worst", "disappointed", "scam",
  "fake", "broken", "refund", "rude", "slow", "never", "horrible",
  "disgusting", "overpriced", "waste", "fail", "angry", "complaint",
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  delivery: ["delivery", "shipping", "late", "arrived", "courier"],
  quality: ["quality", "material", "fabric", "durability", "cheap"],
  service: ["service", "staff", "salon", "trainer", "appointment"],
  pricing: ["price", "expensive", "affordable", "value", "cost"],
  product: ["product", "item", "size", "fit", "color"],
  wellness: ["workout", "skin", "hair", "beauty", "wellness", "yoga"],
};

function clampScore(n: number): number {
  return Math.max(-1, Math.min(1, Math.round(n * 1000) / 1000));
}

function extractTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) topics.push(topic);
  }
  return topics.length ? topics : ["general"];
}

export function analyzeTextRuleBased(text: string): SentimentResult {
  const lower = text.toLowerCase();
  let score = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) score += 0.15;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) score -= 0.18;
  }

  if (text.includes("!")) score += 0.05;
  if (lower.includes("not ") || lower.includes("don't")) score -= 0.08;

  score = clampScore(score);

  let sentiment: SentimentLabel = "neutral";
  if (score >= 0.12) sentiment = "positive";
  else if (score <= -0.12) sentiment = "negative";

  return {
    sentiment,
    score,
    topics: extractTopics(text),
  };
}

async function analyzeTextWithOpenAI(text: string): Promise<SentimentResult | null> {
  if (!isOpenAiConfigured()) return null;

  try {
    const response = await openai.chat.completions.create({
      model: resolveOpenAiModel("fast"),
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze marketplace user content sentiment. Return JSON: { sentiment: 'positive'|'neutral'|'negative', score: number from -1 to 1, topics: string[] }",
        },
        { role: "user", content: text.slice(0, 2000) },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      sentiment?: string;
      score?: number;
      topics?: string[];
    };

    const sentiment: SentimentLabel =
      parsed.sentiment === "positive" || parsed.sentiment === "negative"
        ? parsed.sentiment
        : "neutral";

    return {
      sentiment,
      score: clampScore(Number(parsed.score ?? 0)),
      topics: Array.isArray(parsed.topics) && parsed.topics.length
        ? parsed.topics.slice(0, 8)
        : extractTopics(text),
    };
  } catch {
    return null;
  }
}

export async function analyzeText(text: string): Promise<SentimentResult> {
  const trimmed = text?.trim();
  if (!trimmed) {
    return { sentiment: "neutral", score: 0, topics: ["general"] };
  }

  const aiResult = await analyzeTextWithOpenAI(trimmed);
  return aiResult ?? analyzeTextRuleBased(trimmed);
}

type QueueParams = {
  sourceType: SentimentSourceType;
  sourceId: string;
  userId?: string | null;
  text: string;
};

export async function queueSentimentAnalysis(params: QueueParams): Promise<void> {
  const { sourceType, sourceId, userId, text } = params;
  const trimmed = text?.trim();
  if (!trimmed || !sourceId) return;

  const result = await analyzeText(trimmed);
  const snippet = trimmed.slice(0, 500);

  await supabase.from("content_sentiments").upsert(
    {
      source_type: sourceType,
      source_id: sourceId,
      user_id: userId ?? null,
      text_snippet: snippet,
      sentiment: result.sentiment,
      score: result.score,
      topics: result.topics,
      created_at: new Date().toISOString(),
    },
    { onConflict: "source_type,source_id" }
  );

  if (userId) {
    await trackBehavior({
      userId,
      entityType: sourceType,
      entityId: sourceId,
      eventType: "sentiment_analyzed",
      metadata: {
        sentiment: result.sentiment,
        score: result.score,
        topics: result.topics,
      },
    }).catch(() => {});
  }
}

export type SentimentOverview = {
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  feedHealthScore: number;
  trendingNegativeTopics: { topic: string; count: number; sourceType: string; sourceId: string }[];
  recent: {
    id: string;
    sourceType: SentimentSourceType;
    sourceId: string;
    sentiment: SentimentLabel;
    score: number;
    textSnippet: string;
    topics: string[];
    createdAt: string;
  }[];
  total: number;
};

export async function getSentimentOverview(limit = 200): Promise<SentimentOverview> {
  const { data } = await supabase
    .from("content_sentiments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const total = rows.length;

  if (total === 0) {
    return {
      positivePercent: 0,
      neutralPercent: 0,
      negativePercent: 0,
      feedHealthScore: 0,
      trendingNegativeTopics: [],
      recent: [],
      total: 0,
    };
  }

  const positive = rows.filter((r) => r.sentiment === "positive").length;
  const neutral = rows.filter((r) => r.sentiment === "neutral").length;
  const negative = rows.filter((r) => r.sentiment === "negative").length;

  const positivePercent = Math.round((positive / total) * 100);
  const neutralPercent = Math.round((neutral / total) * 100);
  const negativePercent = Math.round((negative / total) * 100);
  const feedHealthScore = Math.max(0, Math.min(100, positivePercent + Math.round(neutralPercent * 0.4)));

  const topicCounts = new Map<string, { count: number; sourceType: string; sourceId: string }>();
  for (const row of rows.filter((r) => r.sentiment === "negative")) {
    const topics = Array.isArray(row.topics) ? row.topics : [];
    for (const topic of topics) {
      const key = String(topic);
      const existing = topicCounts.get(key);
      if (!existing || existing.count < 1) {
        topicCounts.set(key, {
          count: (existing?.count ?? 0) + 1,
          sourceType: row.source_type,
          sourceId: row.source_id,
        });
      } else {
        topicCounts.set(key, { ...existing, count: existing.count + 1 });
      }
    }
  }

  const trendingNegativeTopics = [...topicCounts.entries()]
    .map(([topic, meta]) => ({ topic, ...meta }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const recent = rows.slice(0, 12).map((row) => ({
    id: row.id,
    sourceType: row.source_type as SentimentSourceType,
    sourceId: row.source_id,
    sentiment: row.sentiment as SentimentLabel,
    score: Number(row.score),
    textSnippet: row.text_snippet,
    topics: Array.isArray(row.topics) ? row.topics : [],
    createdAt: row.created_at,
  }));

  return {
    positivePercent,
    neutralPercent,
    negativePercent,
    feedHealthScore,
    trendingNegativeTopics,
    recent,
    total,
  };
}
