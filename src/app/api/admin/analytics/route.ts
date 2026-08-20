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

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") ?? "30d") as DateRange;
  const city = searchParams.get("city") ?? "all";

  const [
    kpis,
    insights,
    coverage,
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
  ]);

  return NextResponse.json({
    kpis,
    insights,
    coverage,
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
  });
}
