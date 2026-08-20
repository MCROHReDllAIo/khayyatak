/**
 * Real product search against PostgreSQL — no fabricated results.
 */

import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";
import type { ProductSearchIntent } from "@/lib/ai/product-intent";
import { resolveProductImageUrl } from "@/lib/images/product-image";

export interface MatchedProduct {
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
  match_reasons: string[];
  image_source_type?: string | null;
}

function mapProductRow(row: Record<string, unknown>, score: number, reasons: string[]): MatchedProduct {
  return {
    id: row.id as string,
    tailor_id: row.tailor_id as string,
    name_ar: row.name_ar as string,
    name_en: (row.name_en as string) ?? null,
    description_ar: (row.description_ar as string) ?? null,
    category: (row.category as string) ?? null,
    tags: (row.tags as string[]) ?? [],
    price: Number(row.price ?? 0),
    fabric: (row.fabric as string) ?? null,
    style: (row.style as string) ?? null,
    style_cut: (row.style_cut as string) ?? null,
    color: (row.color as string) ?? null,
    color_key: (row.color_key as string) ?? null,
    occasion: (row.occasion as string) ?? null,
    image_url: resolveProductImageUrl((row.image_url as string) ?? null),
    available: row.available !== false,
    tailor_name_ar: (row.tailor_name_ar as string) ?? null,
    tailor_rating: Number(row.tailor_rating ?? 0),
    match_score: score,
    match_reasons: reasons,
    image_source_type: (row.image_source_type as string) ?? null,
  };
}

function scoreProduct(row: Record<string, unknown>, intent: ProductSearchIntent): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const max = 100;

  const category = String(row.category ?? "").toLowerCase();
  const tags = ((row.tags as string[]) ?? []).map((t) => t.toLowerCase());
  const colorKey = String(row.color_key ?? row.color ?? "").toLowerCase();
  const styleCut = String(row.style_cut ?? row.style ?? "").toLowerCase();
  const fabric = String(row.fabric ?? "").toLowerCase();
  const nameAr = String(row.name_ar ?? "").toLowerCase();

  if (intent.category) {
    const catMatch =
      category.includes(intent.category) ||
      tags.includes(intent.category) ||
      nameAr.includes(intent.category === "abaya" ? "عبا" : "دش");
    if (catMatch) {
      score += 30;
      reasons.push("category");
    }
  }

  if (intent.colorKey) {
    const colorMatch =
      colorKey.includes(intent.colorKey) ||
      nameAr.includes(intent.color ?? "") ||
      tags.some((t) => t.includes(intent.colorKey!));
    if (colorMatch) {
      score += 25;
      reasons.push("color");
    }
  }

  if (intent.styleCut) {
    const styleMatch =
      styleCut.includes(intent.styleCut) ||
      nameAr.includes(intent.style ?? "") ||
      tags.some((t) => t.includes(intent.styleCut!));
    if (styleMatch) {
      score += 20;
      reasons.push("style");
    }
  }

  if (intent.fabric) {
    const fabricMatch = fabric.includes(intent.fabric) || nameAr.includes(intent.fabric);
    if (fabricMatch) {
      score += 10;
      reasons.push("fabric");
    }
  }

  if (intent.occasion && String(row.occasion ?? "").includes(intent.occasion)) {
    score += 8;
    reasons.push("occasion");
  }

  if (intent.budgetMax && Number(row.price ?? 0) <= intent.budgetMax) {
    score += 5;
    reasons.push("budget");
  }

  if (row.available !== false && row.published === true) {
    score += 5;
  }

  return { score: Math.min(max, score), reasons };
}

export async function searchProducts(intent: ProductSearchIntent, limit = 3): Promise<MatchedProduct[]> {
  if (!isPostgresConfigured()) return [];

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT p.*, t.name_ar AS tailor_name_ar, t.rating AS tailor_rating
     FROM products p
     JOIN tailors t ON t.id = p.tailor_id
     WHERE p.published = TRUE AND COALESCE(p.available, TRUE) = TRUE
     ORDER BY p.created_at DESC
     LIMIT 200`
  );

  if (rows.length === 0) return [];

  const scored = rows
    .map((row) => {
      const { score, reasons } = scoreProduct(row, intent);
      return mapProductRow(row, score, reasons);
    })
    .filter((p) => {
      // Require a meaningful match — never invent "recommended" products with 0 relevance
      const hasIntentSignal =
        Boolean(intent.category) ||
        Boolean(intent.colorKey) ||
        Boolean(intent.styleCut) ||
        Boolean(intent.fabric) ||
        Boolean(intent.occasion);
      if (!hasIntentSignal) return p.match_score >= 5;
      return p.match_score >= 25;
    })
    .sort((a, b) => b.match_score - a.match_score);

  return scored.slice(0, limit);
}

export async function getProductById(id: string): Promise<MatchedProduct | null> {
  if (!isPostgresConfigured()) return null;

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT p.*, t.name_ar AS tailor_name_ar, t.rating AS tailor_rating
     FROM products p
     JOIN tailors t ON t.id = p.tailor_id
     WHERE p.id = $1
     LIMIT 1`,
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  return mapProductRow(row, 100, []);
}

export async function saveProductSearchSession(
  userId: string | null,
  queryText: string,
  intent: ProductSearchIntent,
  matches: MatchedProduct[]
): Promise<string | null> {
  if (!isPostgresConfigured()) return null;

  const { rows } = await pgQuery<{ id: string }>(
    `INSERT INTO product_search_sessions (user_id, query_text, structured_intent)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id`,
    [userId, queryText, JSON.stringify(intent)]
  );

  const sessionId = rows[0]?.id;
  if (!sessionId) return null;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    await pgQuery(
      `INSERT INTO ai_product_matches (session_id, product_id, match_score, rank)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, m.id, m.match_score, i + 1]
    );
  }

  return sessionId;
}
