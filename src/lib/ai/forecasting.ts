import type { BusinessInsight } from "@/types";

export function forecastDemand(orders?: { design: { colorKey?: string; fabricKey?: string } }[]): {
  insight_ar: string;
  insight_en: string;
  trend: { item: string; change: number }[];
} {
  const whiteCount = orders?.filter((o) => o.design.colorKey === "white").length ?? 0;
  const total = orders?.length ?? 1;
  const whitePct = Math.round((whiteCount / Math.max(total, 1)) * 100);

  return {
    insight_ar:
      whitePct > 20
        ? `الثياب البيضاء الرسمية تمثل ${whitePct}% من الطلب — من المتوقع استمرار الارتفاع.`
        : "من المتوقع ارتفاع الطلب على الثياب البيضاء الرسمية خلال الفترة القادمة.",
    insight_en:
      whitePct > 20
        ? `White formal garments are ${whitePct}% of demand — growth expected.`
        : "Demand for white formal dishdashas is expected to increase.",
    trend: [
      { item: "أبيض رسمي", change: Math.max(8, whitePct) },
      { item: "كتان صيفي", change: 15 },
      { item: "تطريز ذهبي", change: 12 },
      { item: "ياقة عمانية", change: 8 },
    ],
  };
}

export function generateBusinessInsights(): BusinessInsight[] {
  return [
    {
      id: "bi1",
      message_ar: "لديك 12 طلبًا هذا الأسبوع.",
      message_en: "You have 12 orders this week.",
      type: "general",
      priority: "medium",
    },
    {
      id: "bi2",
      message_ar: "الطلب على الثياب البيضاء ارتفع 23%.",
      message_en: "Demand for white dishdashas increased by 23%.",
      type: "demand",
      priority: "high",
    },
    {
      id: "bi3",
      message_ar: "أنصح بزيادة مخزون القماش الأبيض بنسبة 15%.",
      message_en: "Recommend increasing white fabric inventory by 15%.",
      type: "inventory",
      priority: "high",
    },
    {
      id: "bi4",
      message_ar: "ثلاثة عملاء يبحثون عن تسليم خلال 48 ساعة.",
      message_en: "Three customers are looking for delivery within 48 hours.",
      type: "customer",
      priority: "medium",
    },
  ];
}
