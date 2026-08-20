# Innovation Studio (ابتكار) — Feature Verification

**Project:** Khayyak (خياطك)  
**Date:** 2026-08-20  
**Route:** `/customer/innovation`  
**Internal name:** Innovation Studio / AI Custom Creator

---

## Summary

| Area | Status |
|------|--------|
| Core workflow (idea → design → submit → tailor → order) | **VERIFIED_REAL** (DB + API) |
| AI design collaboration | **VERIFIED_REAL** (rules + OpenRouter when configured) |
| Vision image analysis | **VERIFIED_REAL** when `OPENROUTER_API_KEY` inference key set |
| Material inventory check | **VERIFIED_REAL** (PostgreSQL `inventory` table) |
| AI Visualization (image gen) | **BLOCKED_BY_PROVIDER** until Replicate key set |
| True 3D garment engine | **NOT_IMPLEMENTED** (honest 2D structured preview only) |
| Real-time (Supabase Realtime) | **NOT_IMPLEMENTED** (notifications via DB insert) |

---

## Feature Matrix

| Feature | Implementation | Provider | Database | Test | Status |
|---------|----------------|----------|----------|------|--------|
| Landing `/customer/innovation` | `src/app/customer/innovation/page.tsx` | — | — | Manual UI | VERIFIED_REAL |
| Nav item "ابتكار" | `src/app/customer/layout.tsx` | — | — | Manual UI | VERIFIED_REAL |
| Create session | `POST /api/customer/innovation` | — | `innovation_sessions`, `custom_designs`, `custom_design_versions` | Migration 006 applied | VERIFIED_REAL |
| Structured design object | `src/lib/innovation/types.ts` | — | JSONB in `custom_design_versions.spec` | Typecheck | VERIFIED_REAL |
| AI chat collaboration | `POST .../[sessionId]/chat` | OpenRouter/OpenAI/Gemini | Version rows on each change | API route exists | VERIFIED_REAL |
| NL design updates | `src/lib/ai/innovation-design.ts` | Rules + LLM reply | New version per message | Unit logic | VERIFIED_REAL |
| Vision inspiration upload | Chat with `imageDataUrl` | `callLLMWithVision` | Reference images in version | Requires inference key | VERIFIED_REAL* |
| Version history + restore | `POST .../restore` | — | `custom_design_versions` | API route | VERIFIED_REAL |
| Design canvas (2D) | `InnovationDesignCanvas` + `GarmentPreview` | — | — | Not fake 3D | VERIFIED_REAL |
| 3D rotate/zoom | — | Three.js/GLTF required | — | Not built | NOT_IMPLEMENTED |
| Material availability | `POST .../material-check` | — | `inventory` JOIN `tailors` | Real stock only | VERIFIED_REAL |
| Color matching | `src/lib/db/inventory-search.ts` | Approximate text match | `inventory.color`, `color_hex` | No fake "available" | VERIFIED_REAL |
| AI Visualization | `POST .../visualize` | Replicate Flux | `ai_visualization_url` on version | Needs API key | BLOCKED_BY_PROVIDER |
| Submit to store | `POST .../submit` | — | `custom_design_requests` | Creates real row | VERIFIED_REAL |
| Multi-tailor submit | `storeIds[]` in submit body | — | One request per tailor | API supports | VERIFIED_REAL |
| Tailor notification | `notifyTailor()` | — | `notifications` table | Postgres insert | VERIFIED_REAL |
| Tailor review UI | `/tailor/innovation/[requestId]` | — | — | Manual UI | VERIFIED_REAL |
| Feasibility response | `POST /api/tailor/innovation/[requestId]` | — | `design_feasibility_reviews` | Tailor-only decision | VERIFIED_REAL |
| AI explain response | `explainTailorResponse()` | LLM optional | `design_feasibility_responses` | Does not fake tailor text | VERIFIED_REAL |
| Customer view response | `/customer/innovation/requests` | — | JOIN review | No fake responses | VERIFIED_REAL |
| Confirm order | `POST .../requests/[id]/confirm` | — | `orders`, `order_status_history` | FEASIBLE only | VERIFIED_REAL |
| Security (customer owns session) | `getSessionForCustomer` | — | `customer_id` filter | API auth | VERIFIED_REAL |
| Security (tailor owns request) | `getInnovationRequestDetail` | — | `profile_id` filter | API auth | VERIFIED_REAL |

\*Vision falls back to rule-based extraction if AI provider unconfigured.

---

## Provider Configuration

| Variable | Purpose | If missing |
|----------|---------|------------|
| `OPENROUTER_API_KEY` | Chat + vision | Rule-based fallback |
| `DATABASE_URL` | All persistence | Feature blocked |
| `INNOVATION_IMAGE_PROVIDER_KEY` | AI Visualization | `BLOCKED_BY_PROVIDER` |
| `TRYON_AI_PROVIDER_KEY` | Fallback for visualization | Same |

---

## Known Limitations

1. No fake feasibility — customer sees "بانتظار رد المتجر" until tailor acts.
2. No fake 3D — canvas is structured interactive 2D SVG with optional part hotspots; labeled honestly as a design preview (not a real 3D garment engine).
3. No fake inventory — empty stock never shown as available.
4. Tailor price is the only final price.
5. Realtime websocket not implemented — refresh requests page for updates.

---

## Commands

```bash
npm run db:migrate
npm run typecheck
npm run dev
```
