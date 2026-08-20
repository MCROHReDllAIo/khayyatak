# REAL DATA AUDIT — Khayyatak / خياطك

**Audit date:** 2026-08-21  
**Method:** Code + schema review. Runtime production DB contents were not fully inspected unless noted.

## VERIFIED_REAL (code paths)

| Domain | Path | Notes |
|--------|------|-------|
| Tailor marketplace | `/api/public/marketplace` → `lib/db/tailors.ts` | Ratings/prices from DB |
| Product search | `searchProducts()` → Postgres `products` | Empty when no match (no fake fill) |
| Product detail | `getProductById` | DB row only |
| AI shopping | `concierge-shopping.ts` → `searchProducts` | Structured intent → DB |
| Admin KPIs | `/api/admin/analytics` | Live queries; empty/zero when no data |
| Virtual try-on | `virtual-tryon.ts` | Real Replicate or blocked |
| Innovation viz | `innovation-visualization.ts` | Real Flux or blocked |
| Auth (Railway) | Postgres sessions | When `DATABASE_URL` set |

## FAKE / ILLUSTRATED (verified)

| Item | Location | Fix applied |
|------|----------|-------------|
| SVG garments as product-like UI | `GarmentPreview` on home/studio | Concept labels |
| Unsplash seed images | Old `seed-products.mjs` | Removed; seed refuses prod; images null + unpublished |
| Inflated AI match fallback | `searchProducts` zero-score dump | Removed — require score threshold |
| Dead demo catalog | `src/lib/demo-data.ts` | Quarantined; not imported |

## SCHEMA

| Table / column | Status |
|----------------|--------|
| `products.image_url` | Used |
| `products.image_source_type` | Added in migration `007` |
| `product_images` | Schema exists; **not written by app yet** |
| `tailor_portfolio` | Used when uploaded |

## SEED / PRODUCTION GUARDS

| Script | Guard |
|--------|-------|
| `seed-products.mjs` | Refuses Railway/prod-like URLs unless `ALLOW_DEMO_SEED=1` + `--force` |
| `purge-stock-product-images.mjs` | Unpublishes stock-host products |
| Migration `007` | Nulls stock URLs + unpublishes |

## NOT VERIFIED ON LIVE PROD DB

Without Railway DB access in this session we **cannot** assert:

- Current row counts of published products
- Whether Unsplash rows still exist until purge/migrate is run on prod
- Whether any tailor has uploaded real photos

**Operator action required:**

```bash
npm run db:migrate
npm run purge:stock-images
```

## Adjacent honesty gaps (not image, still fake-ish)

| Area | File | Issue |
|------|------|-------|
| Measurement “camera” | `measurement.ts` | Random estimates if presented as AI scan |
| Tailor forecasting | `forecasting.ts` | Hardcoded trend % |
| Image understanding fallback | `image-understanding.ts` | Demo analyses when AI off |

These do not invent marketplace product photos but must not be marketed as fully real AI.
