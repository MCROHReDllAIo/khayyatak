import { NextResponse } from "next/server";
import {
  getPlatformKPIs,
  getExecutiveInsights,
  getNationalCoverage,
  getOrderOperations,
  getCriticalAlerts,
  getTopTailors,
  getCustomerIntelligence,
  getFashionTrends,
  getAIAnalyticsFromLogs,
  getAIPerformanceFromLogs,
  getInventoryIntelligence,
  getMarketplacePerformance,
  getGrowthFunnel,
  getPlatformActivity,
  getSystemHealth,
  getLivePlatformStatus,
  getNationalAIPanel,
  type DateRange,
} from "@/lib/db/analytics";
import {
  buildReadinessInsights,
  enrichCoverageWithShowcase,
} from "@/lib/admin/enrich-coverage";
import { isPostgresConfigured, pgQuery } from "@/lib/db/postgres";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function countTable(sql: string): Promise<number> {
  if (!isPostgresConfigured()) return 0;
  try {
    const { rows } = await pgQuery<{ n: number }>(sql);
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") ?? "30d") as DateRange;
  const city = searchParams.get("city") ?? "all";

  const [
    kpis,
    baseInsights,
    rawCoverage,
    operations,
    alerts,
    topTailors,
    customers,
    trends,
    ai,
    aiPerf,
    inventory,
    marketplace,
    funnel,
    activity,
    health,
    liveStatus,
    national,
    innovationSessions,
    products,
  ] = await Promise.all([
    safe(() => getPlatformKPIs(range), []),
    safe(() => getExecutiveInsights(), []),
    safe(() => getNationalCoverage(city === "all" ? undefined : city), []),
    safe(() => getOrderOperations(), {
      active: 0,
      delayed: 0,
      dueToday: 0,
      ready: 0,
      delivered: 0,
      pipeline: [],
    }),
    safe(() => getCriticalAlerts(), []),
    safe(() => getTopTailors(), []),
    safe(() => getCustomerIntelligence(), {
      total: 0,
      new: 0,
      returning: 0,
      highValue: 0,
      atRisk: 0,
      likelyReorder: 0,
      segments: [],
    }),
    safe(() => getFashionTrends(), {
      colors: [],
      fabrics: [],
      garments: [],
      embroidery: [],
      styles: [],
      hasData: false,
    }),
    safe(() => getAIAnalyticsFromLogs(), {
      requests: 0,
      designs: 0,
      measurements: 0,
      matches: 0,
      conversations: 0,
      topFeature_ar: "—",
      topFeature_en: "—",
      chart: [],
    }),
    safe(() => getAIPerformanceFromLogs(), {
      successRate: 0,
      avgResponseSec: 0,
      fallbackPct: 0,
      providerStatus: "Not configured",
      hasData: false,
    }),
    safe(() => getInventoryIntelligence(), {
      lowStockMerchants: 0,
      criticalMaterials: [],
      mostRequested: [],
      forecastShortages: [],
    }),
    safe(() => getMarketplacePerformance(), {
      topCategory: "—",
      topCity: "—",
      topProduct: "—",
      avgOrder: 0,
      conversion: 0,
      repeatRate: 0,
    }),
    safe(() => getGrowthFunnel(), []),
    safe(() => getPlatformActivity(), []),
    safe(() => getSystemHealth(), {
      overall: "warning" as const,
      services: [],
      lastChecked: new Date().toISOString(),
    }),
    safe(() => getLivePlatformStatus(), {
      status: "operational" as const,
      label_ar: "جاري التحميل",
      label_en: "Loading",
      services: [],
    }),
    safe(() => getNationalAIPanel(), {
      topCity: "—",
      topCategory: "—",
      topFabric: "—",
      topColor: "—",
      seasonalDemand_ar: "لا توجد بيانات كافية",
      seasonalDemand_en: "Insufficient data",
      avgOrder: 0,
      repeatRate: 0,
      hasData: false,
    }),
    countTable(`SELECT COUNT(*)::int AS n FROM innovation_sessions`),
    countTable(`SELECT COUNT(*)::int AS n FROM products`),
  ]);

  const liveTailorTotal = rawCoverage.reduce((s, c) => s + (c.tailors ?? 0), 0);
  const { cities: coverage, showcaseNetwork } = enrichCoverageWithShowcase(
    rawCoverage,
    liveTailorTotal
  );

  const kpiNum = (id: string) => {
    const row = kpis.find((k) => k.id === id);
    if (!row) return 0;
    const n = parseInt(String(row.value).replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const readiness = buildReadinessInsights({
    customers: kpiNum("customers") || customers.total,
    tailors: kpiNum("tailors") || liveTailorTotal,
    orders: kpiNum("orders"),
    aiCalls: ai.requests || kpiNum("ai"),
    innovationSessions,
    products,
    healthOk: health.overall === "operational",
    showcaseNetwork,
  });

  const insightIds = new Set(baseInsights.map((i) => i.id));
  const insights = [
    ...baseInsights.filter((i) => i.id !== "empty"),
    ...readiness.filter((i) => !insightIds.has(i.id)),
  ].slice(0, 6);

  const enrichedKpis = [
    ...kpis,
    {
      id: "innovation",
      label_ar: "جلسات ابتكار",
      label_en: "Innovate sessions",
      value: String(innovationSessions),
      trend: 0,
      trendLabel_ar: "من قاعدة البيانات",
      trendLabel_en: "from database",
      href: "/admin/designs",
      accent: "gold" as const,
    },
    {
      id: "products",
      label_ar: "منتجات الكتالوج",
      label_en: "Catalog products",
      value: String(products),
      trend: 0,
      trendLabel_ar: "منتجات حقيقية",
      trendLabel_en: "real products",
      href: "/admin/products",
      accent: "cream" as const,
    },
    {
      id: "network",
      label_ar: showcaseNetwork ? "شبكة العرض" : "تغطية المدن",
      label_en: showcaseNetwork ? "Showcase network" : "City coverage",
      value: String(coverage.filter((c) => c.tailors > 0).length),
      trend: 0,
      trendLabel_ar: showcaseNetwork ? "مدن في العرض التجريبي" : "مدن نشطة",
      trendLabel_en: showcaseNetwork ? "showcase cities" : "active cities",
      href: "/admin/national-intelligence",
      accent: "green" as const,
    },
  ];

  const enrichedActivity =
    activity.length > 0
      ? activity
      : [
          {
            id: "act-health",
            message_ar: `صحة النظام: ${health.overall === "operational" ? "تشغيل" : "يحتاج انتباه"}`,
            message_en: `System health: ${health.overall}`,
            time_ar: "الآن",
          },
          {
            id: "act-net",
            message_ar: showcaseNetwork
              ? "شبكة العرض التجريبي مفعّلة على الصفحة الرئيسية"
              : `${liveTailorTotal} خياط في الشبكة الحية`,
            message_en: showcaseNetwork
              ? "Showcase network active on home"
              : `${liveTailorTotal} live tailors on network`,
            time_ar: "الآن",
          },
          {
            id: "act-innov",
            message_ar: `${innovationSessions} جلسة ابتكار مسجّلة`,
            message_en: `${innovationSessions} innovate sessions logged`,
            time_ar: "اليوم",
          },
        ];

  const enrichedAlerts =
    alerts.length > 0
      ? alerts
      : [
          {
            id: "ok-platform",
            priority: "low" as const,
            icon: "✅",
            message_ar: "لا تنبيهات حرجة — المنصة جاهزة للمتابعة اليومية.",
            message_en: "No critical alerts — platform ready for daily ops.",
            time_ar: "الآن",
            href: "/admin/settings",
          },
          {
            id: "next-tailors",
            priority: "medium" as const,
            icon: "🪡",
            message_ar: "الخطوة التالية: توثيق خياطين جدد لملء GMV والطلبات الحقيقية.",
            message_en: "Next: verify new tailors to fill real GMV and orders.",
            time_ar: "أولوية",
            href: "/admin/verification",
          },
        ];

  return NextResponse.json({
    kpis: enrichedKpis,
    insights,
    coverage,
    showcaseNetwork,
    operations,
    alerts: enrichedAlerts,
    topTailors,
    customers,
    trends,
    ai,
    aiPerf,
    inventory,
    marketplace,
    funnel,
    activity: enrichedActivity,
    health,
    liveStatus,
    national,
    modules: {
      innovationSessions,
      products,
      showcaseNetwork,
      liveTailors: liveTailorTotal,
    },
  });
}
