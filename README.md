# Smart Tailor AI | سمارت تايلور AI

**من أول قياس إلى آخر غرزة... كل شيء أذكى.**

Arabic-first, Oman-focused AI platform for traditional tailoring — connecting customers, tailors, and AI intelligence.

> **نحن لا ننافس الخياطين، نحن نمكّنهم.**

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or next available port)

```bash
npm run lint
npm run typecheck
npm run build
```

## Demo Login (`/login`)

One-click demo access:

| Role | Button |
|------|--------|
| Customer | دخول كعميل |
| Tailor | دخول كخياط |
| Admin | دخول كمسؤول |

## Main Demo Flow (3–5 min)

1. `/login` → Customer
2. `/customer/ai` — AI Concierge (text/voice/image)
3. `/customer/designer` — AI Design Studio + natural language edits
4. `/customer/image-ai` — Image understanding
5. `/customer/measurements` — AI body measurement simulation
6. `/customer/style-dna` — Style DNA profile
7. `/customer/match` — AI tailor matching (96% score)
8. `/customer/specification` → `/customer/checkout` — Tailor spec + order
9. Switch to Tailor → `/tailor/ai` — Smart Tailor Brain
10. `/tailor/inventory`, `/tailor/pricing`, `/tailor/analytics`
11. `/admin/national-intelligence` — National aggregate intelligence
12. `/ai-control-center` — Architecture visualization for judges
13. `/presentation` — Cinematic pitch deck

Use the floating **دليل العرض** button for step-by-step navigation.

## Environment Variables

Copy `.env.example` → `.env.local`:

```env
# OpenRouter (recommended)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-3.7-flash

# Direct providers (optional)
OPENAI_API_KEY=
GEMINI_API_KEY=

# Supabase (optional — demo uses localStorage)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Demo AI mode:** Works fully without API keys using deterministic mock responses.

**Real AI mode:** Set `OPENROUTER_API_KEY` or `OPENAI_API_KEY` / `GEMINI_API_KEY`.

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — خياطة عمانية... بذكاء |
| `/marketplace` | Smart tailor marketplace |
| `/ai-control-center` | AI ecosystem visualization |
| `/customer/ai` | AI Fashion Concierge |
| `/customer/image-ai` | Image understanding |
| `/customer/designer` | AI Design Studio |
| `/customer/measurements` | AI body measurement |
| `/customer/style-dna` | Style DNA |
| `/customer/try-on` | Virtual try-on prototype |
| `/customer/specification` | Tailor specification card |
| `/tailor/ai` | Smart Tailor Brain |
| `/tailor/quality` | AI quality control |
| `/tailor/marketing` | AI marketing campaigns |
| `/tailor/products` | AI product creator |
| `/admin/national-intelligence` | National analytics (demo) |
| `/privacy` | Privacy & responsible AI |
| `/presentation` | Hackathon presentation |

## AI Architecture

```
src/lib/ai/
├── provider.ts           — OpenRouter / OpenAI / Gemini / mock
├── concierge.ts          — AI concierge + NL design
├── image-understanding.ts
├── stylist.ts
├── measurement.ts
├── matching.ts
├── style-dna.ts
├── specification.ts
├── pricing.ts
├── forecasting.ts
└── agentic.ts            — Order/Inventory/Marketing agents

src/lib/knowledge/fashion.ts — Omani fashion knowledge
```

## Prototype Limitations

- Measurements, try-on, and quality checks are **AI estimates/simulations**
- National intelligence uses **aggregate demo data**
- Demo auth + localStorage (Supabase schema ready, not wired live)
- OpenRouter key must be valid for live LLM responses; invalid keys fall back to mock
- Agentic workflows require user approval — no autonomous spending

## Recommended Next Steps

1. Wire Supabase auth + RLS for production data
2. Connect real camera CV for measurements
3. Valid OpenRouter/OpenAI key for live Arabic concierge
4. Embeddings/RAG on `lib/knowledge/` for Omani fashion terms
5. Payment + order notifications
6. Mobile PWA + push notifications

## Tech Stack

Next.js 15 · TypeScript · Tailwind · shadcn/ui · Framer Motion · Recharts · Supabase (schema)

Built for Oman AI Hackathon — **the AI intelligence layer for traditional tailoring**.
