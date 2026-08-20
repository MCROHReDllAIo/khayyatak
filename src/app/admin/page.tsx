"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/context/locale-context";
import { KPIGrid, LiveStatusStrip } from "@/components/admin/sections/KPIAndStatus";
import { ExecutiveInsights } from "@/components/admin/sections/ExecutiveInsights";
import { NationalCoverageSection } from "@/components/admin/sections/NationalCoverage";
import { RevenueAnalyticsSection } from "@/components/admin/sections/RevenueAnalytics";
import { OperationsCenter, AlertsPanel } from "@/components/admin/sections/OperationsAndAlerts";
import { VerificationPanel } from "@/components/admin/sections/VerificationPanel";
import {
  TopTailorsSection,
  CustomerIntelligenceSection,
  FashionTrendsSection,
} from "@/components/admin/sections/AnalyticsSections";
import {
  AIUsageSection,
  AIPerformanceSection,
  InventoryIntelligenceSection,
  MarketplacePerformanceSection,
  GrowthFunnelSection,
  ActivityFeedSection,
  QuickActionsSection,
  NationalAIPanelSection,
  AICommandNetworkSection,
  SystemHealthSection,
} from "@/components/admin/sections/SupportSections";
import { KPISkeleton, SectionSkeleton, ErrorState } from "@/components/admin/AdminSkeleton";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/lib/db/analytics";

const DATE_RANGES: { id: DateRange; ar: string; en: string }[] = [
  { id: "today", ar: "اليوم", en: "Today" },
  { id: "7d", ar: "7 أيام", en: "7 Days" },
  { id: "30d", ar: "30 يوم", en: "30 Days" },
  { id: "custom", ar: "مخصص", en: "Custom" },
];

type DashboardData = Awaited<ReturnType<typeof fetchDashboard>> extends infer R
  ? R extends { data: infer D }
    ? D
    : never
  : never;

async function fetchDashboard(range: DateRange, city: string) {
  const res = await fetch(`/api/admin/analytics?range=${range}&city=${city}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load analytics");
  }
  const data = await res.json();
  return { data };
}

export default function AdminCommandCenterPage() {
  const { t, locale } = useLocale();
  const [range, setRange] = useState<DateRange>("30d");
  const [cityFilter, setCityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await fetchDashboard(range, cityFilter);
      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range, cityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const dateStr = new Date().toLocaleDateString(locale === "ar" ? "ar-OM" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (error && !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState onRetry={load} message={error} />
      </div>
    );
  }

  const empty = data?.kpis?.[0]?.value === "0";

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">National AI Command Center</p>
          <h1 className="text-2xl md:text-3xl font-bold text-navy font-arabic">
            {t("مرحبًا بك في مركز التحكم", "Welcome to Command Center")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            {t("بيانات حية من قاعدة البيانات — بدون أرقام وهمية.", "Live database metrics — no fabricated numbers.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-xl border bg-white p-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  range === r.id ? "bg-navy text-white" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {t(r.ar, r.en)}
              </button>
            ))}
          </div>
          {data?.coverage && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-9 rounded-xl border bg-white px-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">{t("كل عمان", "All Oman")}</option>
              {data.coverage.map((c: { id: string; name_ar: string }) => (
                <option key={c.id} value={c.id}>{c.name_ar}</option>
              ))}
            </select>
          )}
          <span className="text-xs text-muted-foreground hidden lg:block">{dateStr}</span>
        </div>
      </div>

      {empty && !loading && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-medium text-navy">{t("منصة جديدة — لا توجد بيانات بعد", "New platform — no data yet")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("ابدأ بإضافة أول خياط وتسجيل العملاء.", "Start by adding your first tailor and registering customers.")}</p>
        </div>
      )}

      {loading ? <KPISkeleton /> : data && <KPIGrid items={data.kpis} />}
      {!loading && data && <LiveStatusStrip status={data.liveStatus} />}

      {loading ? <SectionSkeleton rows={4} className="min-h-[240px]" /> : data && <ExecutiveInsights insights={data.insights} />}

      {loading ? <SectionSkeleton rows={5} className="min-h-[360px]" /> : data && <NationalCoverageSection cities={data.coverage} />}

      <div className="grid xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {loading ? <SectionSkeleton rows={6} className="min-h-[320px]" /> : <RevenueAnalyticsSection />}
          {loading ? <SectionSkeleton rows={4} /> : data && <OperationsCenter data={data.operations} />}
        </div>
        <div className="space-y-8">
          {!loading && data && <AlertsPanel alerts={data.alerts} />}
          {loading ? <SectionSkeleton rows={5} /> : data && <ActivityFeedSection activities={data.activity} />}
          {!loading && <QuickActionsSection />}
        </div>
      </div>

      {loading ? <SectionSkeleton rows={6} /> : <VerificationPanel compact />}

      <div className="grid lg:grid-cols-2 gap-8">
        {!loading && data && data.topTailors.length > 0 && <TopTailorsSection tailors={data.topTailors} />}
        {!loading && data && <CustomerIntelligenceSection data={data.customers} />}
      </div>

      {!loading && data && data.trends.hasData && <FashionTrendsSection trends={data.trends} />}

      <div className="grid lg:grid-cols-2 gap-8">
        {!loading && data && <AIUsageSection data={data.ai} />}
        {!loading && data && <AIPerformanceSection data={{ ...data.aiPerf, demoLabel: false }} />}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {!loading && data && <InventoryIntelligenceSection data={data.inventory} />}
        {!loading && data && <MarketplacePerformanceSection data={data.marketplace} />}
      </div>

      {!loading && data && <GrowthFunnelSection funnel={data.funnel} />}
      {!loading && data && <NationalAIPanelSection data={{ ...data.national, demoLabel: false }} />}
      {!loading && <AICommandNetworkSection />}
      {!loading && data && <SystemHealthSection health={data.health} />}
    </div>
  );
}
