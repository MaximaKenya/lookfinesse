# AI providers (Groq vs OpenAI)

**LookFinesse uses OpenAI only.** There is no Groq wiring in the codebase.

| Surface | Provider | Model (default) | Fallback |
|---|---|---|---|
| `/api/ai/chat` (Copilot FAB) | OpenAI when `OPENAI_API_KEY` set | `gpt-4o` (deep) / `gpt-4o-mini` (fast) | Demo replies in `lib/ai/prompts.ts` |
| Today tips (`lib/ai/todayPersonalization.ts`) | OpenAI | `gpt-4o-mini` | Prefs-aware weather tips |
| Sentiment (`lib/ai/sentimentAnalysis.ts`) | OpenAI | `gpt-4o-mini` | Local heuristics |
| Embeddings / search | OpenAI | `text-embedding-3-small` | Keyword search |
| Intelligence insights / `/api/copilot` | OpenAI | `gpt-4o` | Local summary strings |
| Virtual dresser avatar | OpenAI Images | DALL·E | Built-in SVG avatar |

Source of truth: `lib/ai/provider.ts`.

Set in `.env.local`:

```bash
OPENAI_API_KEY=sk-...
# optional overrides
OPENAI_MODEL_FAST=gpt-4o-mini
OPENAI_MODEL_DEEP=gpt-4o
```

Do **not** expect `GROQ_API_KEY` to power any route — it is unused.
