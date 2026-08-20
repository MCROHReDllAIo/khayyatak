/**
 * Style Twin — visual / semantic match against real published products only.
 */

import { resolveProductImageUrl } from "@/lib/images/product-image";
import { isPostgresConfigured } from "@/lib/db/postgres";
import { logAICall } from "@/lib/db/analytics";
import { getAIConfig } from "@/lib/ai/provider";
import { extractFashionDnaFromImage, extractFashionDnaFromText } from "./fashion-dna";
import { embedText, isEmbeddingsConfigured } from "./embeddings";
import { blendScore, cosineSimilarity, similarityToPercent } from "./similarity";
import {
  fashionDnaToEmbedText,
  productRowToFashionDna,
  STYLE_TWIN_EMBEDDING_MODEL,
  STYLE_TWIN_MIN_SCORE,
  type FashionDNA,
} from "./types";
import {
  getProductsByIds,
  listIndexableProducts,
  listProductEmbeddings,
  upsertProductEmbedding,
  type IndexableProduct,
} from "./product-embeddings-db";

export interface StyleTwinMatch {
  id: string;
  tailor_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  category: string | null;
  tags: string[];
  price: number;
  fabric: string | null;
  style: string | null;
  style_cut: string | null;
  color: string | null;
  color_key: string | null;
  occasion: string | null;
  image_url: string | null;
  available: boolean;
  tailor_name_ar: string | null;
  tailor_rating: number;
  match_score: number;
  match_percent: number;
  match_reasons: string[];
  city?: string | null;
}

export interface StyleTwinResult {
  ok: boolean;
  blocked?: boolean;
  error?: string;
  errorAr?: string;
  dna: FashionDNA | null;
  matches: StyleTwinMatch[];
  indexedCount: number;
  model: string;
  provider?: string;
}

function toMatch(
  product: IndexableProduct & { price?: number },
  score: number,
  reasons: string[]
): StyleTwinMatch {
  return {
    id: product.id,
    tailor_id: product.tailor_id,
    name_ar: product.name_ar,
    name_en: product.name_en,
    description_ar: product.description_ar,
    category: product.category,
    tags: product.tags,
    price: Number(product.price ?? 0),
    fabric: product.fabric,
    style: product.style,
    style_cut: product.style_cut,
    color: product.color,
    color_key: product.color_key,
    occasion: product.occasion,
    image_url: resolveProductImageUrl(product.image_url),
    available: product.available,
    tailor_name_ar: product.tailor_name_ar,
    tailor_rating: product.tailor_rating,
    match_score: score,
    match_percent: similarityToPercent(score),
    match_reasons: reasons,
    city: product.city,
  };
}

export async function runStyleTwin(input: {
  imageDataUrl?: string;
  text?: string;
  cityId?: string;
  limit?: number;
}): Promise<StyleTwinResult> {
  const model = STYLE_TWIN_EMBEDDING_MODEL;
  const limit = Math.min(12, Math.max(1, input.limit ?? 6));

  if (!isPostgresConfigured()) {
    return {
      ok: false,
      blocked: true,
      error: "Database is not configured",
      errorAr: "قاعدة البيانات غير مفعّلة",
      dna: null,
      matches: [],
      indexedCount: 0,
      model,
    };
  }

  if (!isEmbeddingsConfigured()) {
    return {
      ok: false,
      blocked: true,
      error: "Style Twin needs OpenRouter or OpenAI embeddings",
      errorAr: "فعّل OPENROUTER_API_KEY لتفعيل توأم الأسلوب",
      dna: null,
      matches: [],
      indexedCount: 0,
      model,
      provider: getAIConfig().provider,
    };
  }

  const start = Date.now();
  let dna: FashionDNA | null = null;
  let provider: string | undefined;

  if (input.imageDataUrl) {
    const extracted = await extractFashionDnaFromImage(input.imageDataUrl, input.text);
    dna = extracted.dna;
    provider = extracted.provider;
    if (!dna) {
      await logAICall({
        feature: "style_twin",
        provider: extracted.provider ?? "unknown",
        model,
        status: "fallback",
        latencyMs: Date.now() - start,
      });
      return {
        ok: false,
        error: extracted.error ?? "Could not analyze image",
        errorAr: "تعذر تحليل الصورة",
        dna: null,
        matches: [],
        indexedCount: 0,
        model,
        provider,
      };
    }
  } else if (input.text?.trim()) {
    const extracted = await extractFashionDnaFromText(input.text);
    dna = extracted.dna;
    provider = extracted.provider;
    if (!dna) {
      return {
        ok: false,
        error: extracted.error ?? "Could not analyze text",
        errorAr: "تعذر فهم الطلب",
        dna: null,
        matches: [],
        indexedCount: 0,
        model,
        provider,
      };
    }
  } else {
    return {
      ok: false,
      error: "Provide an image or text",
      errorAr: "أرفق صورة أو اكتب وصفًا",
      dna: null,
      matches: [],
      indexedCount: 0,
      model,
    };
  }

  const embedInput = fashionDnaToEmbedText(dna);
  const emb = await embedText(embedInput);
  if (!emb.embedding) {
    await logAICall({
      feature: "style_twin",
      provider: provider ?? "unknown",
      model,
      status: "error",
      latencyMs: Date.now() - start,
    });
    return {
      ok: false,
      blocked: emb.error?.includes("not configured") || emb.error?.includes("OpenRouter"),
      error: emb.error ?? "Embedding failed",
      errorAr: "تعذر إنشاء بصمة الأسلوب",
      dna,
      matches: [],
      indexedCount: 0,
      model,
      provider,
    };
  }

  let catalog = await listProductEmbeddings(emb.model);
  // If model mismatch left catalog empty, try any embeddings
  if (catalog.length === 0) {
    catalog = await listProductEmbeddings();
  }

  // Lazy index if empty: build from product metadata (no vision per product on query path)
  if (catalog.length === 0) {
    const indexed = await indexProductsFromMetadata({ max: 80 });
    catalog = await listProductEmbeddings(indexed.model || emb.model);
    if (catalog.length === 0) {
      catalog = await listProductEmbeddings();
    }
  }

  const scored = catalog
    .map((row) => {
      // Dimension mismatch → skip
      if (row.embedding.length !== emb.embedding!.length) return null;
      const cosine = cosineSimilarity(emb.embedding!, row.embedding);
      const { score, reasons } = blendScore(cosine, dna!, row.dna_json, 0);
      return { productId: row.product_id, score, reasons, dna: row.dna_json };
    })
    .filter(Boolean) as Array<{
    productId: string;
    score: number;
    reasons: string[];
    dna: FashionDNA;
  }>;

  scored.sort((a, b) => b.score - a.score);
  const above = scored.filter((s) => s.score >= STYLE_TWIN_MIN_SCORE).slice(0, limit);

  const products = await getProductsByIds(above.map((s) => s.productId));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const matches: StyleTwinMatch[] = [];
  for (const s of above) {
    const p = productMap.get(s.productId);
    if (!p || !p.available) continue;
    const { score, reasons } = blendScore(s.score, dna!, s.dna, p.tailor_rating);
    matches.push(toMatch(p, score, reasons.length ? reasons : s.reasons));
  }

  await logAICall({
    feature: "style_twin",
    provider: provider ?? "openrouter",
    model: emb.model,
    status: "success",
    latencyMs: Date.now() - start,
  });

  return {
    ok: true,
    dna,
    matches,
    indexedCount: catalog.length,
    model: emb.model,
    provider,
  };
}

/** Index published products from metadata (+ optional vision later). */
export async function indexProductsFromMetadata(opts?: {
  max?: number;
  useVision?: boolean;
}): Promise<{ indexed: number; skipped: number; model: string; errors: string[] }> {
  const model = STYLE_TWIN_EMBEDDING_MODEL;
  const errors: string[] = [];
  if (!isPostgresConfigured() || !isEmbeddingsConfigured()) {
    return {
      indexed: 0,
      skipped: 0,
      model,
      errors: ["Database or embeddings not configured"],
    };
  }

  const products = await listIndexableProducts();
  const max = opts?.max ?? products.length;
  let indexed = 0;
  let skipped = 0;

  for (const product of products.slice(0, max)) {
    const dna = productRowToFashionDna(product);
    const text = fashionDnaToEmbedText(dna);
    if (!text.trim()) {
      skipped++;
      continue;
    }
    const emb = await embedText(text);
    if (!emb.embedding) {
      skipped++;
      if (emb.error) errors.push(`${product.id}: ${emb.error}`);
      continue;
    }
    const ok = await upsertProductEmbedding({
      productId: product.id,
      dna,
      embedding: emb.embedding,
      model: emb.model,
      source: "catalog_metadata",
    });
    if (ok) indexed++;
    else skipped++;
  }

  return { indexed, skipped, model, errors: errors.slice(0, 10) };
}

export { STYLE_TWIN_MIN_SCORE, STYLE_TWIN_EMBEDDING_MODEL };
