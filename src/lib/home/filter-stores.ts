import type { ProductSearchIntent } from "@/lib/ai/product-intent";
import type { City, Tailor } from "@/types";

export type StoreFilter = {
  category: "all" | "dishdasha" | "abaya" | "fabric" | "embroidery" | "kids";
  cityId: string | "all";
  query: string;
  intent: ProductSearchIntent | null;
  selectedTailorId: string | null;
  highlightTailorIds: string[];
};

export const STORE_CATEGORIES: Array<{
  id: StoreFilter["category"];
  ar: string;
  en: string;
  specs: string[];
}> = [
  { id: "all", ar: "الكل", en: "All", specs: [] },
  { id: "dishdasha", ar: "دشاديش", en: "Dishdasha", specs: ["dishdasha", "formal", "thobe"] },
  { id: "abaya", ar: "عبايات", en: "Abayas", specs: ["abaya"] },
  { id: "fabric", ar: "أقمشة", en: "Fabrics", specs: ["fabric", "summer", "premium"] },
  { id: "embroidery", ar: "تطريز", en: "Embroidery", specs: ["embroidery"] },
  { id: "kids", ar: "أطفال", en: "Kids", specs: ["kids", "children"] },
];

const CITY_ALIASES: Array<{ keys: RegExp; nameAr: string }> = [
  { keys: /مسقط|muscat/i, nameAr: "مسقط" },
  { keys: /صلالة|salalah/i, nameAr: "صلالة" },
  { keys: /صحار|sohar/i, nameAr: "صحار" },
  { keys: /نزوى|نزوه|nizwa/i, nameAr: "نزوى" },
  { keys: /صور|sur/i, nameAr: "صور" },
];

export function extractCityFromMessage(message: string, cities: City[]): City | null {
  for (const alias of CITY_ALIASES) {
    if (!alias.keys.test(message)) continue;
    const byName = cities.find((c) => alias.keys.test(c.name_ar) || alias.keys.test(c.name_en));
    if (byName) return byName;
  }
  return null;
}

function specialtyHit(tailor: Tailor, needles: string[]): boolean {
  const bag = [
    ...tailor.specializations,
    ...tailor.specializations_ar,
    tailor.description_ar,
    tailor.description_en,
    tailor.name_ar,
    tailor.name_en,
  ]
    .join(" ")
    .toLowerCase();
  return needles.some((n) => bag.includes(n.toLowerCase()));
}

export function deriveStoreBadges(tailor: Tailor, newestIds: Set<string>): string[] {
  const badges: string[] = [];
  if (tailor.verified) badges.push("موثق");
  if (newestIds.has(tailor.id)) badges.push("انضم حديثًا");
  if (tailor.rating >= 4.7 && tailor.review_count >= 5) badges.push("الأكثر تقييمًا");
  if (tailor.specializations.includes("dishdasha") || tailor.specializations_ar.some((s) => s.includes("دش"))) {
    badges.push("متخصص بالدشداشة");
  }
  if (tailor.specializations.includes("abaya") || tailor.specializations_ar.some((s) => s.includes("عبا"))) {
    badges.push("متخصص بالعبايات");
  }
  if (tailor.specializations.includes("fabric") || tailor.specializations.includes("summer")) {
    badges.push("متخصص بالأقمشة");
  }
  if (tailor.specializations.includes("embroidery")) {
    badges.push("متخصص بالتطريز");
  }
  if (
    tailor.availability_status === "available_now" ||
    tailor.availability_status === "accepting_orders"
  ) {
    badges.push("متاح للطلبات");
  }
  return badges.slice(0, 3);
}

export function scoreStoreForIntent(tailor: Tailor, intent: ProductSearchIntent | null, cities: City[]): number {
  if (!intent) return 0;
  let score = 0;

  if (intent.category === "abaya" && specialtyHit(tailor, ["abaya", "عبا"])) score += 40;
  if (intent.category === "dishdasha" && specialtyHit(tailor, ["dishdasha", "دش", "ثوب"])) score += 40;
  if (intent.styleCut === "summer" || intent.fabric === "كتان") {
    if (specialtyHit(tailor, ["summer", "صيف", "خفيف"])) score += 20;
  }
  if (intent.styleCut === "formal" && specialtyHit(tailor, ["formal", "رسم", "فخم"])) score += 18;

  const cityHint = extractCityFromMessage(intent.rawMessage, cities);
  if (cityHint && tailor.city_id === cityHint.id) score += 35;
  else if (cityHint && (tailor.city.includes(cityHint.name_ar) || tailor.city === cityHint.name_en)) score += 35;

  if (intent.budgetMax && tailor.starting_price > 0 && tailor.starting_price <= intent.budgetMax) {
    score += 15;
  }

  score += Math.min(12, tailor.rating * 2);
  return score;
}

export function filterAndRankStores(
  tailors: Tailor[],
  cities: City[],
  filter: StoreFilter
): Array<{ tailor: Tailor; score: number; badges: string[]; highlighted: boolean }> {
  const newest = [...tailors]
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(-Math.min(5, Math.ceil(tailors.length * 0.25)))
    .map((t) => t.id);
  const newestIds = new Set(newest);

  const cat = STORE_CATEGORIES.find((c) => c.id === filter.category);
  const q = filter.query.trim().toLowerCase();

  const list = tailors.filter((t) => {
    if (filter.selectedTailorId && t.id === filter.selectedTailorId) return true;
    if (filter.cityId !== "all" && t.city_id !== filter.cityId) return false;
    if (cat && cat.id !== "all" && cat.specs.length) {
      if (!specialtyHit(t, cat.specs) && !specialtyHit(t, [cat.ar, cat.en])) return false;
    }
    if (q) {
      const blob = `${t.name_ar} ${t.name_en} ${t.city} ${t.specializations_ar.join(" ")} ${t.description_ar}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });

  // Soft-rank by AI intent without hiding everyone unless we have strong matches
  const withScores = list.map((tailor) => {
    const intentScore = scoreStoreForIntent(tailor, filter.intent, cities);
    const highlighted =
      filter.highlightTailorIds.includes(tailor.id) ||
      (filter.selectedTailorId === tailor.id) ||
      intentScore >= 35;
    return {
      tailor,
      score: intentScore + tailor.rating * 5 + (tailor.verified ? 8 : 0),
      badges: deriveStoreBadges(tailor, newestIds),
      highlighted,
    };
  });

  if (filter.intent && withScores.some((x) => x.score >= 35)) {
    withScores.sort((a, b) => {
      if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
      return b.score - a.score;
    });
  } else {
    withScores.sort((a, b) => b.score - a.score);
  }

  return withScores;
}

export function citiesWithStores(cities: City[], tailors: Tailor[]): City[] {
  const ids = new Set(tailors.map((t) => t.city_id));
  return cities.filter((c) => ids.has(c.id) || c.tailor_count > 0);
}
