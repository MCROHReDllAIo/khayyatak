/**
 * Cosine similarity + Style Twin ranking helpers.
 */

import type { FashionDNA } from "./types";
import { dnaMatchReasons } from "./types";

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Map cosine (-1..1) to display percent 0–100. */
export function similarityToPercent(sim: number): number {
  const clamped = Math.max(0, Math.min(1, (sim + 1) / 2));
  // Embeddings for similar fashion text usually land ~0.5–0.95 cosine;
  // map raw cosine 0..1 directly for clearer UX when vectors are unit-normalized.
  const pct = Math.round(Math.max(0, Math.min(1, sim)) * 100);
  return pct > 0 ? pct : Math.round(clamped * 100);
}

export function blendScore(
  cosine: number,
  queryDna: FashionDNA,
  candidateDna: FashionDNA,
  tailorRating = 0
): { score: number; reasons: string[] } {
  const reasons = dnaMatchReasons(queryDna, candidateDna);
  // Soft boost for explicit DNA overlap (max +0.08) and rating (max +0.04)
  const dnaBoost = Math.min(0.08, reasons.length * 0.02);
  const ratingBoost = Math.min(0.04, (Math.max(0, tailorRating) / 5) * 0.04);
  const score = Math.min(1, Math.max(0, cosine) + dnaBoost + ratingBoost);
  if (cosine >= 0.55 && reasons.length === 0) {
    reasons.push("style_twin");
  }
  return { score, reasons };
}
