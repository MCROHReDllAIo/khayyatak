# Style Twin ML — توأم الأسلوب

**Feature:** Visual + semantic style matching against **real** published products only.

## What it does

1. User uploads a garment/fabric photo (or describes a look)
2. Vision extracts **Fashion DNA** (category, color, cut, fabric, occasion, …)
3. OpenRouter embeddings turn DNA into a vector
4. Cosine similarity ranks catalog embeddings in Postgres
5. Only matches above threshold (`0.55`) are shown — never invented products

## Stack

| Piece | Implementation |
|-------|----------------|
| Vision DNA | `src/lib/ml/fashion-dna.ts` via `callLLMWithVision` |
| Embeddings | OpenRouter `openai/text-embedding-3-small` (override with `OPENROUTER_EMBEDDING_MODEL`) |
| Similarity | `src/lib/ml/similarity.ts` (cosine in Node) |
| Storage | `product_embeddings` table (`009_style_twin_embeddings.sql`) — JSONB vectors, no pgvector required |
| Orchestration | `src/lib/ml/style-twin.ts` |
| API | `POST /api/ml/style-twin` (auth required) |
| Admin index | `POST /api/ml/style-twin/index` + `npm run ml:index-products` |
| UI | Home AI concierge + `/customer/style-twin` |

## Env

```bash
OPENROUTER_API_KEY=...
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small   # optional
OPENROUTER_VISION_MODEL=google/gemini-3.7-flash            # optional
```

## Ops

```bash
npm run db:migrate
npm run ml:index-products
```

Or Admin → Platform status → **Reindex Style Twin**.

Lazy index: if the catalog is empty at query time, Style Twin indexes up to 80 products from metadata automatically.

## Honesty

- No fake products or stock photos as matches
- Below threshold → honest empty state
- Missing AI key → blocked state with clear message
- Match reasons shown (category / color / fabric / style twin)

## Related routes

- Home floating AI photo upload → Style Twin results + store highlight
- Concierge chat with image → merges Style Twin ranking into products
