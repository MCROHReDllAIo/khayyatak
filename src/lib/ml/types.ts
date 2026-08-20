/**
 * Fashion DNA — structured style signature for Omani garments / fabrics.
 * Used by Style Twin ML (vision extract → embed → match real catalog).
 */

export type FashionCategory =
  | "dishdasha"
  | "abaya"
  | "fabric"
  | "embroidery"
  | "kids"
  | "other";

export interface FashionDNA {
  category?: FashionCategory;
  color?: string;
  colorKey?: string;
  styleCut?: string;
  fabric?: string;
  embroidery?: string;
  occasion?: string;
  collar?: string;
  sleeve?: string;
  gender?: "men" | "women" | "unisex" | "kids";
  summaryAr?: string;
  summaryEn?: string;
  tags?: string[];
}

export interface ProductEmbeddingRow {
  product_id: string;
  dna_json: FashionDNA;
  embedding: number[];
  model: string;
  source: string;
  updated_at?: string;
}

/** Minimum cosine similarity (0–1) to show a match — never invent weak results. */
export const STYLE_TWIN_MIN_SCORE = 0.55;

export const STYLE_TWIN_EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small";

/** Build bilingual text used for embedding. */
export function fashionDnaToEmbedText(dna: FashionDNA): string {
  const parts = [
    dna.summaryEn,
    dna.summaryAr,
    dna.category,
    dna.color,
    dna.colorKey,
    dna.styleCut,
    dna.fabric,
    dna.embroidery,
    dna.occasion,
    dna.collar,
    dna.sleeve,
    dna.gender,
    ...(dna.tags ?? []),
  ]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean);

  return parts.join(" · ");
}

export function productRowToFashionDna(row: {
  name_ar?: string | null;
  name_en?: string | null;
  description_ar?: string | null;
  category?: string | null;
  color?: string | null;
  color_key?: string | null;
  style?: string | null;
  style_cut?: string | null;
  fabric?: string | null;
  occasion?: string | null;
  gender?: string | null;
  tags?: string[] | null;
}): FashionDNA {
  const categoryRaw = String(row.category ?? "").toLowerCase();
  let category: FashionCategory | undefined;
  if (categoryRaw.includes("abaya") || categoryRaw.includes("عبا")) category = "abaya";
  else if (categoryRaw.includes("dish") || categoryRaw.includes("دش")) category = "dishdasha";
  else if (categoryRaw.includes("fabric") || categoryRaw.includes("قماش")) category = "fabric";
  else if (categoryRaw.includes("embroider") || categoryRaw.includes("تطريز")) category = "embroidery";
  else if (categoryRaw.includes("kid") || categoryRaw.includes("طفل")) category = "kids";
  else if (categoryRaw) category = "other";

  const genderRaw = String(row.gender ?? "").toLowerCase();
  const gender: FashionDNA["gender"] =
    genderRaw === "men" || genderRaw === "women" || genderRaw === "kids" || genderRaw === "unisex"
      ? genderRaw
      : category === "abaya"
        ? "women"
        : category === "dishdasha"
          ? "men"
          : undefined;

  return {
    category,
    color: row.color ?? undefined,
    colorKey: row.color_key ?? undefined,
    styleCut: row.style_cut ?? row.style ?? undefined,
    fabric: row.fabric ?? undefined,
    occasion: row.occasion ?? undefined,
    gender,
    summaryAr: [row.name_ar, row.description_ar].filter(Boolean).join(" — ") || undefined,
    summaryEn: row.name_en ?? undefined,
    tags: row.tags ?? undefined,
  };
}

export function parseFashionDna(raw: unknown): FashionDNA | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const cat = String(o.category ?? "").toLowerCase();
  let category: FashionCategory | undefined;
  if (cat.includes("abaya")) category = "abaya";
  else if (cat.includes("dish")) category = "dishdasha";
  else if (cat.includes("fabric") || cat.includes("قماش")) category = "fabric";
  else if (cat.includes("embroider") || cat.includes("تطريز")) category = "embroidery";
  else if (cat.includes("kid") || cat.includes("طفل")) category = "kids";
  else if (cat) category = "other";

  const genderRaw = String(o.gender ?? "").toLowerCase();
  const gender: FashionDNA["gender"] =
    genderRaw === "men" || genderRaw === "women" || genderRaw === "kids" || genderRaw === "unisex"
      ? genderRaw
      : undefined;

  const tags = Array.isArray(o.tags)
    ? o.tags.map((t) => String(t)).filter(Boolean)
    : undefined;

  return {
    category,
    color: o.color ? String(o.color) : undefined,
    colorKey: o.colorKey || o.color_key ? String(o.colorKey ?? o.color_key) : undefined,
    styleCut: o.styleCut || o.style_cut || o.style ? String(o.styleCut ?? o.style_cut ?? o.style) : undefined,
    fabric: o.fabric ? String(o.fabric) : undefined,
    embroidery: o.embroidery ? String(o.embroidery) : undefined,
    occasion: o.occasion ? String(o.occasion) : undefined,
    collar: o.collar ? String(o.collar) : undefined,
    sleeve: o.sleeve ? String(o.sleeve) : undefined,
    gender,
    summaryAr: o.summaryAr || o.summary_ar ? String(o.summaryAr ?? o.summary_ar) : undefined,
    summaryEn: o.summaryEn || o.summary_en ? String(o.summaryEn ?? o.summary_en) : undefined,
    tags,
  };
}

/** Human-readable match reasons from DNA overlap. */
export function dnaMatchReasons(query: FashionDNA, candidate: FashionDNA): string[] {
  const reasons: string[] = [];
  if (query.category && candidate.category && query.category === candidate.category) {
    reasons.push("category");
  }
  if (
    query.colorKey &&
    candidate.colorKey &&
    query.colorKey.toLowerCase() === candidate.colorKey.toLowerCase()
  ) {
    reasons.push("color");
  } else if (
    query.color &&
    candidate.color &&
    query.color.toLowerCase().includes(candidate.color.toLowerCase())
  ) {
    reasons.push("color");
  }
  if (
    query.styleCut &&
    candidate.styleCut &&
    (query.styleCut.toLowerCase().includes(candidate.styleCut.toLowerCase()) ||
      candidate.styleCut.toLowerCase().includes(query.styleCut.toLowerCase()))
  ) {
    reasons.push("style");
  }
  if (
    query.fabric &&
    candidate.fabric &&
    (query.fabric.toLowerCase().includes(candidate.fabric.toLowerCase()) ||
      candidate.fabric.toLowerCase().includes(query.fabric.toLowerCase()))
  ) {
    reasons.push("fabric");
  }
  if (
    query.occasion &&
    candidate.occasion &&
    query.occasion.toLowerCase().includes(candidate.occasion.toLowerCase())
  ) {
    reasons.push("occasion");
  }
  if (
    query.embroidery &&
    candidate.embroidery &&
    (query.embroidery.toLowerCase().includes(candidate.embroidery.toLowerCase()) ||
      candidate.embroidery.toLowerCase().includes(query.embroidery.toLowerCase()))
  ) {
    reasons.push("embroidery");
  }
  return reasons;
}
