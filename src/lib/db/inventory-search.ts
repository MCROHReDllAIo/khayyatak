/**
 * Real inventory search — never claim availability without DB data.
 */

import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";
import type { MaterialCheckResult, MaterialAvailability } from "@/lib/innovation/types";

const COLOR_FAMILIES: Record<string, string[]> = {
  red: ["أحمر", "حمر", "red", "maroon", "burgundy", "كrimson"],
  black: ["أسود", "اسود", "black", "كحل"],
  beige: ["بيج", "beige", "كريم", "cream"],
  navy: ["كحلي", "navy", "أزرق"],
  white: ["أبيض", "white"],
  gold: ["ذهب", "gold"],
};

function colorMatchScore(query: string, itemColor?: string | null, itemName?: string): number {
  const q = query.toLowerCase();
  const hay = `${itemColor ?? ""} ${itemName ?? ""}`.toLowerCase();
  if (!hay.trim()) return 0;
  if (hay.includes(q) || q.includes(hay)) return 100;

  for (const [, keys] of Object.entries(COLOR_FAMILIES)) {
    const qMatch = keys.some((k) => q.includes(k));
    const hMatch = keys.some((k) => hay.includes(k));
    if (qMatch && hMatch) return 75;
  }
  return 0;
}

function fabricMatchScore(query: string, fabricName?: string | null, fabricType?: string | null): number {
  const hay = `${fabricName ?? ""} ${fabricType ?? ""}`.toLowerCase();
  const q = query.toLowerCase();
  if (!hay.trim()) return 0;
  if (hay.includes(q) || q.includes(hay)) return 100;
  if (/كريب|crepe/.test(q) && /كريب|crepe/.test(hay)) return 90;
  if (/شيفون|chiffon/.test(q) && /شيفون|chiffon/.test(hay)) return 90;
  if (/كتان|linen/.test(q) && /كتان|linen/.test(hay)) return 90;
  return 0;
}

export async function checkMaterialAvailability(
  tailorIds: string[],
  colorQuery: string,
  fabricQuery?: string
): Promise<MaterialCheckResult[]> {
  if (!isPostgresConfigured() || tailorIds.length === 0) return [];

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT i.*, t.name_ar AS tailor_name_ar
     FROM inventory i
     JOIN tailors t ON t.id = i.tailor_id
     WHERE i.tailor_id = ANY($1::uuid[])
     ORDER BY i.current_stock DESC NULLS LAST`,
    [tailorIds]
  );

  if (rows.length === 0) {
    return tailorIds.map((tid) => ({
      tailor_id: tid,
      tailor_name_ar: "—",
      material_name: fabricQuery ?? colorQuery,
      availability: "unknown" as MaterialAvailability,
      notes: "لا يوجد مخزون مسجل لهذا المتجر.",
    }));
  }

  const results: MaterialCheckResult[] = [];

  for (const tailorId of tailorIds) {
    const tailorItems = rows.filter((r) => r.tailor_id === tailorId);
    const tailorName = (tailorItems[0]?.tailor_name_ar as string) ?? "—";

    if (tailorItems.length === 0) {
      results.push({
        tailor_id: tailorId,
        tailor_name_ar: tailorName,
        material_name: fabricQuery ?? colorQuery,
        availability: "unknown",
        notes: "التوفر غير معروف — لا يوجد مخزون مسجل.",
      });
      continue;
    }

    let best: MaterialCheckResult | null = null;
    let bestScore = 0;

    for (const row of tailorItems) {
      const stock = Number(row.current_stock ?? 0);
      const colorScore = colorMatchScore(colorQuery, row.color as string, row.fabric_name_ar as string);
      const fabricScore = fabricQuery ? fabricMatchScore(fabricQuery, row.fabric_name_ar as string, row.fabric_type as string) : 50;
      const score = colorScore * 0.5 + fabricScore * 0.5;

      if (score > bestScore) {
        bestScore = score;
        let availability: MaterialAvailability = "unknown";
        if (stock <= 0) availability = "unavailable";
        else if (score >= 70) availability = "available";
        else if (score >= 40) availability = "close_match";
        else availability = "unavailable";

        best = {
          tailor_id: tailorId,
          tailor_name_ar: tailorName,
          material_name: (row.fabric_name_ar as string) ?? "—",
          color_hex: (row.color_hex as string) ?? undefined,
          availability,
          quantity: stock > 0 ? stock : undefined,
          inventory_id: row.id as string,
          notes: availability === "close_match" ? "مطابقة اللون تقريبية." : undefined,
        };
      }
    }

    results.push(
      best ?? {
        tailor_id: tailorId,
        tailor_name_ar: tailorName,
        material_name: fabricQuery ?? colorQuery,
        availability: "unavailable",
        notes: "لم نجد مطابقة في المخزون.",
      }
    );
  }

  return results;
}

export async function getTailorIdsFromMarketplace(limit = 20): Promise<Array<{ id: string; name_ar: string }>> {
  if (!isPostgresConfigured()) return [];

  const { rows } = await pgQuery<{ id: string; name_ar: string }>(
    `SELECT id, name_ar FROM tailors ORDER BY rating DESC NULLS LAST LIMIT $1`,
    [limit]
  );
  return rows;
}
