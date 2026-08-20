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

export async function GET(request: Request) {
  try {
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
      getPlatformKPIs(range),
      getExecutiveInsights(),
      getNationalCoverage(city === "all" ? undefined : city),
      getOrderOperations(),
      getCriticalAlerts(),
      getTopTailors(),
      getCustomerIntelligence(),
      getFashionTrends(),
      getAIAnalyticsFromLogs(),
      getAIPerformanceFromLogs(),
      getInventoryIntelligence(),
      getMarketplacePerformance(),
      getGrowthFunnel(),
      getPlatformActivity(),
      getSystemHealth(),
      getLivePlatformStatus(),
      getNationalAIPanel(),
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
