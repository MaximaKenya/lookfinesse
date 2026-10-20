# AI providers

LookFinesse calls **Groq** (OpenAI-compatible chat completions) for every assistant.

| Surface | Provider | Model | Fallback |
|---|---|---|---|
| `/api/ai/chat` (stylist, beauty, fitness, copilot) | Groq when `GROQ_API_KEY` is set | `GROQ_MODEL` or `llama-3.3-70b-versatile` | Local replies in `lib/ai/prompts.ts` |
| Today outfit and activity tips | Groq | same | `lib/ai/weatherTips.ts` |
| Sentiment | Groq | same | Keyword heuristics |
| Search | Keyword search in Supabase | — | Empty results |
| Ops copilot and fraud insight | Groq | same | Local summary |
| Virtual dresser portrait | Illustrated avatar | — | No image API |

```bash
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

OpenAI is not a dependency. Streaming stays on `/api/ai/chat`. If Groq is down or the key is missing, the same routes return the local fallback instead of an error page.
