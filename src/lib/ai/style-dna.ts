import type { DesignConfig, Order, StylePreferenceEvent } from "@/types";

export interface StyleDNA {
  preferredColors: { name: string; percent: number }[];
  preferredFabrics: string[];
  preferredCuts: string[];
  embroideryPreference: string;
  occasions: string[];
  budgetRange: string;
  styleTags: string[];
  favoriteTailorIds: string[];
  orderCount: number;
}

const COLOR_LABELS: Record<string, string> = {
  white: "أبيض",
  navy: "كحلي",
  black: "أسود",
  beige: "بيج",
  offwhite: "أوف وايت",
  gray: "رمادي",
};

const FABRIC_LABELS: Record<string, string> = {
  cotton: "قطني",
  linen: "كتان",
  premium: "فاخر",
  summer: "صيفي",
  winter: "شتوي",
};

export function buildStyleDNA(
  orders: Order[],
  design: DesignConfig,
  styleEvents: StylePreferenceEvent[],
  favoriteTailorIds: string[] = []
): StyleDNA {
  const colors: Record<string, number> = {};
  const fabrics: Record<string, number> = {};
  const fits: Record<string, number> = {};

  const bump = (map: Record<string, number>, key: string | undefined, label?: string) => {
    if (!key) return;
    const name = label ?? key;
    map[name] = (map[name] ?? 0) + 1;
  };

  orders.forEach((o) => {
    bump(colors, o.design.colorKey, o.design.color);
    bump(fabrics, o.design.fabricKey, o.design.fabric);
    bump(fits, o.design.fitKey, o.design.fit);
  });

  styleEvents.forEach((e) => {
    bump(colors, e.colorKey, COLOR_LABELS[e.colorKey ?? ""] ?? e.colorKey);
    bump(fabrics, e.fabricKey, FABRIC_LABELS[e.fabricKey ?? ""] ?? e.fabricKey);
    bump(fits, e.fitKey, e.fitKey === "slim" ? "أنحف" : "قياسي");
  });

  bump(colors, design.colorKey, design.color);
  bump(fabrics, design.fabricKey, design.fabric);
  bump(fits, design.fitKey, design.fit);

  const colorTotal = Object.values(colors).reduce((a, b) => a + b, 0) || 1;
  const preferredColors = Object.entries(colors)
    .map(([name, count]) => ({ name, percent: Math.round((count / colorTotal) * 100) }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  const fabricList = Object.entries(fabrics)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 4);

  const avgPrice =
    orders.length > 0 ? orders.reduce((s, o) => s + o.total_price, 0) / orders.length : 18;

  const formalScore = (fits["أنحف"] ?? 0) + orders.filter((o) => o.design.fabricKey === "premium").length;
  const styleTags =
    formalScore >= 3 ? ["Formal", "Minimal", "Traditional"] : formalScore >= 1 ? ["Formal", "Modern"] : ["Minimal", "Casual"];

  return {
    preferredColors: preferredColors.length
      ? preferredColors
      : [
          { name: "أبيض", percent: 42 },
          { name: "كحلي", percent: 27 },
        ],
    preferredFabrics: fabricList.length ? fabricList : [design.fabric],
    preferredCuts: Object.keys(fits).length ? Object.keys(fits).slice(0, 3) : ["رسمي", "كلاسيكي"],
    embroideryPreference: design.embroidery || "بسيط",
    occasions: styleTags.includes("Formal") ? ["رسمي", "دوام"] : ["يومي", "مناسبات"],
    budgetRange: `${Math.floor(avgPrice - 5)}–${Math.ceil(avgPrice + 5)} ر.ع`,
    styleTags,
    favoriteTailorIds: [...new Set([...favoriteTailorIds, ...orders.map((o) => o.tailor_id)])].slice(0, 5),
    orderCount: orders.length,
  };
}
