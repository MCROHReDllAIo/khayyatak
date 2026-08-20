/** Central brand identity — خياطك / Khayyatak */
export const BRAND = {
  nameAr: "خياطك",
  nameEn: "Khayyatak",
  shortEn: "kytk",
  logo: "/brand/khayyatak-logo.png",
  taglineAr: "نفصّلها على مقاسك... بذكاء",
  taglineEn: "Tailored to you, intelligently",
  descriptionAr:
    "منصة وطنية ذكية للخياطة العمانية — من الفكرة إلى التصميم والقياس والخياط.",
  descriptionEn:
    "Oman's smart tailoring platform — from idea to design, measurement, and your tailor.",
  aiAssistantAr: "مساعد خياطك الذكي",
  aiAssistantEn: "Khayyatak AI",
  marketplaceAr: "سوق خياطك",
  marketplaceEn: "Khayyatak Marketplace",
  copyright: "© 2026 خياطك",
  domain: "kytk.online",
  url: "https://kytk.online",
} as const;

export function brandTitle(locale: "ar" | "en" = "ar") {
  return locale === "ar" ? `${BRAND.nameAr} | Khayyatak` : `${BRAND.nameEn} | ${BRAND.nameAr}`;
}
