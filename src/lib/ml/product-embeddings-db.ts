/**
 * Persist and load product embeddings for Style Twin.
 */

import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";
import type { FashionDNA, ProductEmbeddingRow } from "@/lib/ml/types";
import { parseFashionDna } from "@/lib/ml/types";

function parseEmbedding(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => Number.isFinite(n));
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parseEmbedding(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export async function countProductEmbeddings(): Promise<number> {
  if (!isPostgresConfigured()) return 0;
  const { rows } = await pgQuery<{ n: string }>(`SELECT COUNT(*)::text AS n FROM product_embeddings`);
  return Number(rows[0]?.n ?? 0);
}

export async function upsertProductEmbedding(input: {
  productId: string;
  dna: FashionDNA;
  embedding: number[];
  model: string;
  source?: string;
}): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  if (!input.embedding.length) return false;

  await pgQuery(
    `INSERT INTO product_embeddings (product_id, dna_json, embedding, model, source, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, NOW())
     ON CONFLICT (product_id) DO UPDATE SET
       dna_json = EXCLUDED.dna_json,
       embedding = EXCLUDED.embedding,
       model = EXCLUDED.model,
       source = EXCLUDED.source,
       updated_at = NOW()`,
    [
      input.productId,
      JSON.stringify(input.dna),
      JSON.stringify(input.embedding),
      input.model,
      input.source ?? "catalog",
    ]
  );
  return true;
}

export async function listProductEmbeddings(model?: string): Promise<ProductEmbeddingRow[]> {
  if (!isPostgresConfigured()) return [];

  const { rows } = model
    ? await pgQuery<Record<string, unknown>>(
        `SELECT product_id, dna_json, embedding, model, source, updated_at
         FROM product_embeddings WHERE model = $1`,
        [model]
      )
    : await pgQuery<Record<string, unknown>>(
        `SELECT product_id, dna_json, embedding, model, source, updated_at
         FROM product_embeddings`
      );

  return rows
    .map((row) => {
      const dna = parseFashionDna(row.dna_json) ?? {};
      const embedding = parseEmbedding(row.embedding);
      if (!embedding.length) return null;
      return {
        product_id: String(row.product_id),
        dna_json: dna,
        embedding,
        model: String(row.model),
        source: String(row.source ?? "catalog"),
        updated_at: row.updated_at ? String(row.updated_at) : undefined,
      } satisfies ProductEmbeddingRow;
    })
    .filter(Boolean) as ProductEmbeddingRow[];
}

export interface IndexableProduct {
  id: string;
  tailor_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  category: string | null;
  tags: string[];
  price: number;
  color: string | null;
  color_key: string | null;
  style: string | null;
  style_cut: string | null;
  fabric: string | null;
  occasion: string | null;
  gender: string | null;
  image_url: string | null;
  available: boolean;
  tailor_name_ar: string | null;
  tailor_rating: number;
  city?: string | null;
}

export async function listIndexableProducts(): Promise<IndexableProduct[]> {
  if (!isPostgresConfigured()) return [];

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT p.id, p.tailor_id, p.name_ar, p.name_en, p.description_ar, p.category, p.tags,
            p.price, p.color, p.color_key, p.style, p.style_cut, p.fabric, p.occasion, p.gender,
            p.image_url, p.available, t.name_ar AS tailor_name_ar, t.rating AS tailor_rating,
            t.city
     FROM products p
     JOIN tailors t ON t.id = p.tailor_id
     WHERE p.published = TRUE AND COALESCE(p.available, TRUE) = TRUE
     ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
     LIMIT 500`
  );

  return rows.map((row) => ({
    id: String(row.id),
    tailor_id: String(row.tailor_id),
    name_ar: String(row.name_ar),
    name_en: (row.name_en as string) ?? null,
    description_ar: (row.description_ar as string) ?? null,
    category: (row.category as string) ?? null,
    tags: (row.tags as string[]) ?? [],
    price: Number(row.price ?? 0),
    color: (row.color as string) ?? null,
    color_key: (row.color_key as string) ?? null,
    style: (row.style as string) ?? null,
    style_cut: (row.style_cut as string) ?? null,
    fabric: (row.fabric as string) ?? null,
    occasion: (row.occasion as string) ?? null,
    gender: (row.gender as string) ?? null,
    image_url: (row.image_url as string) ?? null,
    available: row.available !== false,
    tailor_name_ar: (row.tailor_name_ar as string) ?? null,
    tailor_rating: Number(row.tailor_rating ?? 0),
    city: (row.city as string) ?? null,
  }));
}

export async function getProductsByIds(ids: string[]): Promise<IndexableProduct[]> {
  if (!isPostgresConfigured() || ids.length === 0) return [];
  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT p.id, p.tailor_id, p.name_ar, p.name_en, p.description_ar, p.category, p.tags,
            p.price, p.color, p.color_key, p.style, p.style_cut, p.fabric, p.occasion, p.gender,
            p.image_url, p.available, t.name_ar AS tailor_name_ar, t.rating AS tailor_rating,
            t.city
     FROM products p
     JOIN tailors t ON t.id = p.tailor_id
     WHERE p.id = ANY($1::uuid[])`,
    [ids]
  );

  const map = new Map(
    rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        tailor_id: String(row.tailor_id),
        name_ar: String(row.name_ar),
        name_en: (row.name_en as string) ?? null,
        description_ar: (row.description_ar as string) ?? null,
        category: (row.category as string) ?? null,
        tags: (row.tags as string[]) ?? [],
        price: Number(row.price ?? 0),
        color: (row.color as string) ?? null,
        color_key: (row.color_key as string) ?? null,
        style: (row.style as string) ?? null,
        style_cut: (row.style_cut as string) ?? null,
        fabric: (row.fabric as string) ?? null,
        occasion: (row.occasion as string) ?? null,
        gender: (row.gender as string) ?? null,
        image_url: (row.image_url as string) ?? null,
        available: row.available !== false,
        tailor_name_ar: (row.tailor_name_ar as string) ?? null,
        tailor_rating: Number(row.tailor_rating ?? 0),
        city: (row.city as string) ?? null,
      } satisfies IndexableProduct,
    ])
  );

  return ids.map((id) => map.get(id)).filter(Boolean) as IndexableProduct[];
}
