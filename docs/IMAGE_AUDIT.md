# IMAGE AUDIT — Khayyatak / خياطك

**Audit date:** 2026-08-21  
**Rule:** Only report what was verified in code / schema. Do not claim “everything is real.”

## Legend

| Status | Meaning |
|--------|---------|
| REAL_DB | Loaded from database / storage records |
| DESIGN_UI | Illustrated SVG / UI concept — must not be sold as product |
| AI_GEN | Provider-generated; must be labeled |
| BLOCKED | Stock/fake host blocked or unpublished |
| EMPTY | Honest empty / unavailable state |
| GAP | Not implemented / incomplete |

---

## Major surfaces

| Location | Image / visual | Source | Real? | Owner | Status |
|----------|----------------|--------|-------|-------|--------|
| Homepage hero AI box | N/A (UI) | — | — | — | UI |
| Homepage garment carousel | SVG silhouette | `GarmentPreview.tsx` | No | System | DESIGN_UI — labeled “معاينة تصميم — ليست منتجات السوق” |
| Marketplace tailor cards | Cover / portfolio | `tailors` + `tailor_portfolio` | When uploaded | Tailor | REAL_DB or EMPTY |
| AI chat product cards | `products.image_url` | Postgres | Only if trusted URL | Tailor | REAL_DB; stock hosts stripped → EMPTY |
| Product detail | `products.image_url` | Postgres | Same | Tailor | REAL_DB / EMPTY (“لا توجد صورة للمنتج”) |
| Customer home “current design” | SVG | `GarmentPreview` | No | System | DESIGN_UI — labeled concept |
| Design studio | SVG | `GarmentPreview` | No | System | DESIGN_UI (editor tool) |
| Checkout / order / spec card | SVG of design config | `GarmentPreview` | No | Customer design | DESIGN_UI |
| Innovation canvas | SVG + optional Flux | Replicate / SVG | AI optional | User session | DESIGN_UI + AI_GEN labeled |
| Virtual try-on | Replicate IDM-VTON | Provider | When keyed | Customer + product | AI_GEN or BLOCKED_BY_PROVIDER |
| True 3D | — | — | No | — | GAP — `NOT_IMPLEMENTED` |
| Tailor profile avatar | Initials / upload | Profile / storage | When uploaded | Tailor | REAL_DB or initials EMPTY |
| Admin dashboard | Charts / KPIs | Analytics queries | Numbers from DB | Platform | REAL_DB (zeros when empty) |
| Presentation deck | SVG + marketing | `SlideVisuals` | Pitch only | System | DESIGN_UI (non-marketplace) |
| Seeded Unsplash products | Unsplash URLs | `seed-products.mjs` (old) | Fake | — | BLOCKED — purge + migration 007 |

---

## Code search findings

| Pattern | Result |
|---------|--------|
| `unsplash` | Removed from `next.config.mjs`; purged by migration/script |
| `GarmentPreview` | Designer/home/innovation — labeled non-product |
| `demo-data.ts` | Quarantined; **zero runtime imports** verified previously |
| `product_images` table | Exists in schema 002; **app still uses `products.image_url` only** (GAP) |
| Placeholder input text | Form placeholders only — OK |

---

## Trust filter

`src/lib/images/product-image.ts` blocks:

- unsplash / pexels / picsum / placehold / loremflickr
- `data:` URLs as catalog photos

Marketplace / chat / product pages use `resolveProductImageUrl()`.

---

## Remaining gaps (honest)

1. **No full tailor multi-image upload → Supabase Storage → `product_images`** wired end-to-end in UI.
2. **Tailor product creator** saves drafts; durable storage publish path still incomplete.
3. **3D** not implemented — correctly reported unavailable.
4. Production DB must run `007_real_product_images.sql` + `npm run purge:stock-images` to clear legacy Unsplash rows.
