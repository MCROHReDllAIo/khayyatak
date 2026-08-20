import type { GarmentType } from "@/types";

export interface FashionKnowledgeItem {
  id: string;
  term_ar: string;
  term_en: string;
  category: "garment" | "fabric" | "style" | "occasion" | "regional";
  description_ar: string;
}

export const OMANI_GARMENTS: FashionKnowledgeItem[] = [
  { id: "dishdasha", term_ar: "دشداشة", term_en: "Dishdasha", category: "garment", description_ar: "الثوب التقليدي العماني للرجال" },
  { id: "abaya", term_ar: "عباية", term_en: "Abaya", category: "garment", description_ar: "ملابس تقليدية وعصرية للنساء" },
  { id: "kuma", term_ar: "كمة", term_en: "Kuma", category: "regional", description_ar: "غطاء الرأس العماني التقليدي" },
  { id: "mussar", term_ar: "مصر", term_en: "Mussar", category: "regional", description_ar: "شال رأس عماني تقليدي" },
  { id: "bisht", term_ar: "بشت", term_en: "Bisht", category: "garment", description_ar: "رداء رسمي فاخر فوق الدشداشة" },
  { id: "thobe", term_ar: "ثوب", term_en: "Thobe", category: "garment", description_ar: "ثوب عربي عام" },
  { id: "jalabiya", term_ar: "جلابية", term_en: "Jalabiya", category: "garment", description_ar: "ملابس تقليدية مريحة" },
];

export const OMANI_FABRICS = [
  { id: "cotton", ar: "قطن", en: "Cotton", season: "all" },
  { id: "linen", ar: "كتان", en: "Linen", season: "summer" },
  { id: "premium", ar: "فاخر", en: "Premium", season: "formal" },
  { id: "summer", ar: "صيفي", en: "Summer", season: "summer" },
  { id: "winter", ar: "شتوي", en: "Winter", season: "winter" },
];

export const MARKETPLACE_CATEGORIES = {
  men: {
    ar: "رجال",
    en: "Men",
    items: ["دشداشة", "ثوب", "كندورة", "بشت", "قمصان", "ملابس رسمية"],
  },
  women: {
    ar: "نساء",
    en: "Women",
    items: ["عبايات", "جلابيات", "فساتين", "ملابس مناسبات"],
  },
  children: {
    ar: "أطفال",
    en: "Children",
    items: ["ملابس تقليدية", "ملابس مناسبات", "تفصيل خاص"],
  },
};

export function lookupTerm(query: string): FashionKnowledgeItem | undefined {
  const q = query.toLowerCase();
  return OMANI_GARMENTS.find(
    (g) => g.term_ar.includes(q) || g.term_en.toLowerCase().includes(q) || g.id.includes(q)
  );
}

export function detectGarmentFromText(text: string): GarmentType {
  const lower = text.toLowerCase();
  if (lower.includes("عبا") || lower.includes("abaya") || lower.includes("جلاب")) return "abaya";
  return "dishdasha";
}
