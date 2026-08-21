/**
 * When live tailor network is sparse, overlay labeled showcase store counts
 * so national coverage looks active for demos — never invents GMV/orders.
 */

import { SHOWCASE_STORES, SHOWCASE_CITIES } from "@/lib/showcase/demo-stores";
import type { CityCoverage } from "@/lib/admin/types";

const MAP_POS: Record<string, { x: number; y: number }> = {
  muscat: { x: 72, y: 36 },
  salalah: { x: 38, y: 78 },
  sohar: { x: 52, y: 18 },
  nizwa: { x: 55, y: 50 },
  sur: { x: 84, y: 52 },
};

export function mapPosForCity(id: string, nameEn?: string): { x: number; y: number } {
  const slug = (nameEn ?? id).toLowerCase().replace(/\s/g, "");
  return MAP_POS[id] ?? MAP_POS[slug] ?? { x: 55, y: 45 };
}

export function enrichCoverageWithShowcase(
  live: CityCoverage[],
  liveTailorTotal: number
): { cities: CityCoverage[]; showcaseNetwork: boolean } {
  if (liveTailorTotal >= 3 && live.some((c) => c.tailors > 0)) {
    return {
      cities: live.map((c) => ({
        ...c,
        mapX: c.mapX || mapPosForCity(c.id, c.name_en).x,
        mapY: c.mapY || mapPosForCity(c.id, c.name_en).y,
      })),
      showcaseNetwork: false,
    };
  }

  const byCity = new Map<string, number>();
  for (const s of SHOWCASE_STORES) {
    byCity.set(s.city_id, (byCity.get(s.city_id) ?? 0) + 1);
  }

  const baseCities =
    live.length > 0
      ? live
      : SHOWCASE_CITIES.map((c) => ({
          id: c.id,
          name_ar: c.name_ar,
          name_en: c.name_en,
          lat: c.lat,
          lng: c.lng,
          mapX: mapPosForCity(c.id, c.name_en).x,
          mapY: mapPosForCity(c.id, c.name_en).y,
          tailors: 0,
          orders: 0,
          customers: 0,
          gmv: 0,
          avgOrder: 0,
          topCategory: "—",
          topColor: "—",
          topFabric: "—",
          aiInsight_ar: "",
          aiInsight_en: "",
        }));

  const cities = baseCities.map((c) => {
    const demo = byCity.get(c.id) ?? 0;
    const pos = mapPosForCity(c.id, c.name_en);
    const liveTailors = c.tailors;
    const displayTailors = liveTailors > 0 ? liveTailors : demo;
    return {
      ...c,
      mapX: pos.x,
      mapY: pos.y,
      tailors: displayTailors,
      showcaseTailors: demo,
      isShowcaseNetwork: liveTailors === 0 && demo > 0,
      aiInsight_ar:
        liveTailors > 0
          ? c.aiInsight_ar || `${c.name_ar}: ${liveTailors} خياط مسجل.`
          : `${c.name_ar}: ${demo} متجر في شبكة العرض التجريبي (للمظهر — ليست حجوزات).`,
      aiInsight_en:
        liveTailors > 0
          ? c.aiInsight_en || `${c.name_en}: ${liveTailors} live tailor(s).`
          : `${c.name_en}: ${demo} stores in showcase network (appearance only — not bookings).`,
    };
  });

  return { cities, showcaseNetwork: true };
}

export function buildReadinessInsights(input: {
  customers: number;
  tailors: number;
  orders: number;
  aiCalls: number;
  innovationSessions: number;
  products: number;
  healthOk: boolean;
  showcaseNetwork: boolean;
}) {
  const insights = [];

  insights.push({
    id: "ops-pulse",
    title_ar: "نبض العمليات",
    title_en: "Ops pulse",
    message_ar: `${input.orders} طلب · ${input.tailors} خياط · ${input.customers} عميل — أرقام حية من قاعدة البيانات.`,
    message_en: `${input.orders} orders · ${input.tailors} tailors · ${input.customers} customers — live from the database.`,
    action_ar: "الطلبات",
    action_en: "Orders",
    href: "/admin/orders",
  });

  insights.push({
    id: "ai-pulse",
    title_ar: "نبض الذكاء",
    title_en: "AI pulse",
    message_ar:
      input.aiCalls > 0
        ? `${input.aiCalls} استدعاء AI مسجّل · ${input.innovationSessions} جلسة ابتكار.`
        : `جلسات الابتكار: ${input.innovationSessions}. فعّل مزود AI لملء سجلات الاستخدام.`,
    message_en:
      input.aiCalls > 0
        ? `${input.aiCalls} AI calls logged · ${input.innovationSessions} innovate sessions.`
        : `Innovate sessions: ${input.innovationSessions}. Configure AI provider to fill usage logs.`,
    action_ar: "مركز AI",
    action_en: "AI Center",
    href: "/admin/ai-center",
  });

  insights.push({
    id: "market",
    title_ar: "السوق",
    title_en: "Marketplace",
    message_ar: input.showcaseNetwork
      ? "شبكة العرض التجريبي ظاهرة على الصفحة الرئيسية — عند انضمام خياطين حقيقيين تُستبدل تلقائيًا."
      : `${input.tailors} خياط حي · ${input.products} منتج في الكتالوج.`,
    message_en: input.showcaseNetwork
      ? "Showcase network is live on home — replaced automatically when real tailors join."
      : `${input.tailors} live tailors · ${input.products} catalog products.`,
    action_ar: "الخياطون",
    action_en: "Tailors",
    href: "/admin/tailors",
  });

  insights.push({
    id: "health",
    title_ar: "صحة المنصة",
    title_en: "Platform health",
    message_ar: input.healthOk
      ? "الخدمات الأساسية تعمل. راقب التخزين والمصادقة والإشعارات من صحة النظام."
      : "بعض الخدمات تحتاج إعداد — راجع صحة النظام الآن.",
    message_en: input.healthOk
      ? "Core services are up. Monitor storage, auth, and notifications in System Health."
      : "Some services need setup — review System Health now.",
    action_ar: "الإعدادات",
    action_en: "Settings",
    href: "/admin/settings",
  });

  if (input.tailors < 3) {
    insights.push({
      id: "grow",
      title_ar: "نمو الشبكة",
      title_en: "Grow the network",
      message_ar: "أضف خياطين موثّقين في مسقط وصلالة لملء التغطية الوطنية ببيانات تشغيلية حقيقية.",
      message_en: "Onboard verified tailors in Muscat and Salalah to fill national coverage with live ops data.",
      action_ar: "دعوة خياط",
      action_en: "Invite tailor",
      href: "/admin/tailors",
    });
  }

  return insights;
}
