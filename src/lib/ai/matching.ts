import type { Tailor, TailorMatch, DesignConfig, City, TailorRailItem } from "@/types";
import type { StyleDNA } from "@/lib/ai/style-dna";
import type { FashionIntent } from "@/lib/ai/intent";

export interface MatchCriteria {
  budget?: number;
  city_id?: string;
  style?: string;
  design?: DesignConfig;
  intent?: FashionIntent;
  styleDNA?: StyleDNA;
  favoriteTailorIds?: string[];
}

const MAX_SCORE = 100;

function parseBudgetRange(budgetRange?: string): number | undefined {
  if (!budgetRange) return undefined;
  const match = budgetRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return Number(match[2]);
  const single = budgetRange.match(/(\d+)/);
  return single ? Number(single[1]) : undefined;
}

function scoreTailor(tailor: Tailor, criteria: MatchCriteria): TailorMatch {
  let score = 0;
  const reasons_ar: string[] = [];
  const reasons_en: string[] = [];

  const design = criteria.design;
  const intent = criteria.intent;
  const dna = criteria.styleDNA;
  const budget = criteria.budget ?? parseBudgetRange(dna?.budgetRange) ?? parseBudgetRange(intent?.budget) ?? 20;

  // 1. AI Match / specialty (highest weight)
  const garment = design?.garmentType ?? intent?.garmentType;
  if (garment === "abaya" && tailor.specializations.includes("abaya")) {
    score += 18;
    reasons_ar.push("متخصص بالعبايات");
    reasons_en.push("Specializes in abayas");
  }
  if (garment === "dishdasha" && tailor.specializations.includes("dishdasha")) {
    score += 18;
    reasons_ar.push("متخصص في الدشداشة العمانية");
    reasons_en.push("Specializes in Omani dishdasha");
  }
  if (
    (design?.collarKey === "omani" || intent?.style === "رسمي" || dna?.styleTags.includes("Formal")) &&
    tailor.specializations.includes("formal")
  ) {
    score += 14;
    reasons_ar.push("متخصص في الدشداشة الرسمية");
    reasons_en.push("Specializes in formal dishdasha");
  }

  const fabricKey = design?.fabricKey ?? intent?.fabricKey;
  if (fabricKey === "summer" && tailor.specializations.includes("summer")) {
    score += 8;
    reasons_ar.push("خبرة في الأقمشة الصيفية");
    reasons_en.push("Experienced with summer fabrics");
  }
  if (fabricKey === "premium" && tailor.specializations.includes("premium")) {
    score += 8;
    reasons_ar.push("يتقن التفصيل الفاخر");
    reasons_en.push("Skilled in premium tailoring");
  }

  // 2. Location
  if (criteria.city_id && tailor.city_id === criteria.city_id) {
    score += 16;
    reasons_ar.push("قريب منك");
    reasons_en.push("Near your location");
  }

  // 3. Style DNA alignment
  if (dna?.favoriteTailorIds.includes(tailor.id)) {
    score += 12;
    reasons_ar.push("خياط تعاملت معه سابقًا");
    reasons_en.push("Tailor you've worked with before");
  }

  const topColor = dna?.preferredColors[0]?.name;
  const designColor = design?.color ?? intent?.color;
  if (topColor && designColor && topColor === designColor) {
    score += 6;
    reasons_ar.push("يتماشى مع ألوانك المفضلة");
    reasons_en.push("Matches your preferred colors");
  }

  if (dna?.styleTags.includes("Formal") && tailor.specializations.includes("formal")) {
    score += 5;
  }

  // 4. Rating
  if (tailor.rating >= 4.8) {
    score += 12;
    reasons_ar.push("تقييم مرتفع");
    reasons_en.push("High rating");
  } else if (tailor.rating >= 4.5) {
    score += 10;
    reasons_ar.push("تقييم ممتاز");
    reasons_en.push("Excellent rating");
  } else if (tailor.rating >= 4) {
    score += 6;
    reasons_ar.push("تقييم جيد");
    reasons_en.push("Good rating");
  }

  // 5. Delivery speed
  if (tailor.delivery_days <= 2) {
    score += 10;
    reasons_ar.push("تسليم سريع");
    reasons_en.push("Fast delivery");
  } else if (tailor.delivery_days <= 3) {
    score += 8;
    reasons_ar.push("وقت التسليم مناسب");
    reasons_en.push("Suitable delivery time");
  } else if (tailor.delivery_days <= 5) {
    score += 4;
  }

  // 6. Price compatibility
  if (tailor.starting_price <= budget) {
    score += 10;
    reasons_ar.push("يناسب ميزانيتك");
    reasons_en.push("Fits your budget");
  } else if (tailor.starting_price <= budget + 5) {
    score += 4;
  }

  // 7. Availability
  const availability = tailor.availability_status ?? "accepting_orders";
  if (availability === "available_now") {
    score += 8;
    reasons_ar.push("متاح الآن");
    reasons_en.push("Available now");
  } else if (availability === "accepting_orders") {
    score += 5;
  } else if (availability === "busy") {
    score -= 4;
  } else if (availability === "paused") {
    score -= 12;
  }

  if (tailor.verified) {
    score += 6;
    if (!reasons_ar.some((r) => r.includes("موث"))) {
      reasons_ar.push("خياط موثّق");
      reasons_en.push("Verified tailor");
    }
  }

  if (tailor.review_count >= 10) {
    score += 3;
  }

  score = Math.max(0, Math.min(MAX_SCORE, Math.round(score)));

  return { tailor, score, reasons_ar: reasons_ar.slice(0, 5), reasons_en: reasons_en.slice(0, 5) };
}

export function railItemToTailor(item: TailorRailItem): Tailor {
  return {
    id: item.id,
    profile_id: item.profile_id,
    name_ar: item.name_ar,
    name_en: item.name_en,
    city_id: item.city_id,
    city: item.city,
    rating: item.rating,
    review_count: item.review_count,
    starting_price: item.starting_price,
    delivery_days: item.delivery_days,
    specializations: item.specializations,
    specializations_ar: item.specializations,
    verified: item.verified,
    cover_image: item.cover_image,
    description_ar: "",
    description_en: "",
    gallery: item.portfolio_preview,
    availability_status: item.availability_status,
  };
}

export function matchTailors(tailors: Tailor[], criteria: MatchCriteria = {}): TailorMatch[] {
  const budget = criteria.budget ?? parseBudgetRange(criteria.styleDNA?.budgetRange) ?? 20;
  return tailors
    .map((tailor) => scoreTailor(tailor, { ...criteria, budget }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.tailor.rating !== a.tailor.rating) return b.tailor.rating - a.tailor.rating;
      return a.tailor.delivery_days - b.tailor.delivery_days;
    });
}

export function matchRailItems(items: TailorRailItem[], criteria: MatchCriteria = {}): TailorMatch[] {
  return matchTailors(items.map(railItemToTailor), criteria);
}

export function getBestMatch(tailors: Tailor[], criteria: MatchCriteria = {}): TailorMatch | null {
  const matches = matchTailors(tailors, criteria);
  return matches[0] ?? null;
}

export function filterTailors(
  tailors: Tailor[],
  filters: {
    city_id?: string;
    maxPrice?: number;
    minRating?: number;
    maxDelivery?: number;
    specialization?: string;
  }
): TailorMatch[] {
  let filtered = tailors;

  if (filters.city_id) filtered = filtered.filter((t) => t.city_id === filters.city_id);
  if (filters.maxPrice) filtered = filtered.filter((t) => t.starting_price <= filters.maxPrice!);
  if (filters.minRating) filtered = filtered.filter((t) => t.rating >= filters.minRating!);
  if (filters.maxDelivery) filtered = filtered.filter((t) => t.delivery_days <= filters.maxDelivery!);
  if (filters.specialization) {
    filtered = filtered.filter((t) => t.specializations.includes(filters.specialization!));
  }

  return matchTailors(filtered, { budget: filters.maxPrice });
}

export function buildMatchContextLabel(
  criteria: MatchCriteria,
  locale: "ar" | "en" = "ar"
): { title: string; subtitle: string } {
  const hasIntent = Boolean(criteria.intent?.garmentType || criteria.intent?.color || criteria.intent?.fabric);
  const hasDesign = Boolean(criteria.design?.garmentType);

  if (hasIntent || hasDesign) {
    const parts: string[] = [];
    const garment = criteria.design?.garmentType ?? criteria.intent?.garmentType;
    if (garment === "abaya") parts.push(locale === "ar" ? "عباية" : "abaya");
    else if (garment === "dishdasha") parts.push(locale === "ar" ? "دشداشة" : "dishdasha");
    const color = criteria.design?.color ?? criteria.intent?.color;
    if (color) parts.push(color);
    const fabric = criteria.design?.fabric ?? criteria.intent?.fabric;
    if (fabric) parts.push(fabric);

    return locale === "ar"
      ? {
          title: "أفضل خياطين لهذا التصميم",
          subtitle: parts.length ? parts.join(" · ") : "خياطون مختارون لك بالذكاء الاصطناعي",
        }
      : {
          title: "Best tailors for this design",
          subtitle: parts.length ? parts.join(" · ") : "AI-curated tailors for you",
        };
  }

  return locale === "ar"
    ? { title: "خياطوك", subtitle: "خياطون مختارون لك بالذكاء الاصطناعي" }
    : { title: "Your tailors", subtitle: "AI-curated tailors for you" };
}

export function findCityByName(cities: City[], name: string): City | undefined {
  const q = name.trim().toLowerCase();
  return cities.find(
    (c) =>
      c.name_ar === name ||
      c.name_en.toLowerCase() === q ||
      c.name_ar.includes(name) ||
      c.name_en.toLowerCase().includes(q)
  );
}

export const DEFAULT_CITY_NAMES = {
  ar: "صلالة",
  en: "Salalah",
} as const;
