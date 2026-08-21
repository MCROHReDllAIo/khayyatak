"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MapPinned,
  Scissors,
  Users,
  ShoppingBag,
  Sparkles,
  Settings,
  RefreshCw,
} from "lucide-react";
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

const QUICK_LINKS = [
  { href: "/admin/tailors", ar: "الخياطون", en: "Tailors", icon: Scissors },
  { href: "/admin/customers", ar: "العملاء", en: "Customers", icon: Users },
  { href: "/admin/orders", ar: "الطلبات", en: "Orders", icon: ShoppingBag },
  { href: "/admin/national-intelligence", ar: "الذكاء الوطني", en: "National intel", icon: MapPinned },
  { href: "/admin/ai-center", ar: "مركز AI", en: "AI Center", icon: Sparkles },
  { href: "/admin/settings", ar: "الإعدادات", en: "Settings", icon: Settings },
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
      <div className="mx-auto max-w-7xl">
        <ErrorState onRetry={load} message={error} />
      </div>
    );
  }

  const showcaseNetwork = Boolean(data?.showcaseNetwork);
  const sparseOps =
    data?.kpis?.find((k: { id: string }) => k.id === "orders")?.value === "0" &&
    data?.kpis?.find((k: { id: string }) => k.id === "gmv")?.value?.startsWith?.("0");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      {/* Hero command header */}
      <div className="overflow-hidden rounded-[1.75rem] border border-navy/10 bg-gradient-to-br from-navy via-[#0c2340] to-[#0a3d2e] p-5 text-white shadow-[0_24px_60px_-36px_rgba(7,26,51,0.7)] md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-omani-gold">
              <LayoutDashboard className="h-4 w-4" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                National AI Command Center
              </p>
            </div>
            <h1 className="font-arabic text-2xl font-bold md:text-3xl">
              {t("مرحبًا بك في مركز التحكم", "Welcome to Command Center")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-white/60">
              {t(
                "لوحة تشغيل حية: أرقام من قاعدة البيانات، وإجراءات جاهزة، وتغطية وطنية فعّالة.",
                "Live ops board: database metrics, ready actions, and an active national coverage map."
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {DATE_RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    range === r.id ? "bg-omani-gold text-navy" : "text-white/65 hover:bg-white/10"
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
                className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
              >
                <option value="all" className="text-navy">
                  {t("كل عمان", "All Oman")}
                </option>
                {data.coverage.map((c: { id: string; name_ar: string }) => (
                  <option key={c.id} value={c.id} className="text-navy">
                    {c.name_ar}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={load}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white/80 hover:bg-white/10"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              {t("تحديث", "Refresh")}
            </button>
            <span className="hidden text-xs text-white/40 lg:block">{dateStr}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/85 transition-colors hover:border-omani-gold/40 hover:bg-white/10"
            >
              <link.icon className="h-3.5 w-3.5 text-omani-gold" />
              {t(link.ar, link.en)}
            </Link>
          ))}
        </div>
      </div>

      {sparseOps && !loading && (
        <div className="rounded-2xl border border-omani-gold/30 bg-gradient-to-l from-[#f7f4ee] to-white px-5 py-4">
          <p className="font-semibold text-navy">
            {t("المنصة جاهزة — الطلبات وGMV ستمتلئ مع التشغيل الحقيقي", "Platform ready — orders & GMV fill with real operations")}
          </p>
          <p className="mt-1 text-sm text-navy/50">
            {showcaseNetwork
              ? t(
                  "شبكة العرض ظاهرة على الخريطة والصفحة الرئيسية للمظهر. GMV والطلبات تبقى صفرًا حتى تحدث طلبات فعلية.",
                  "Showcase network is visible on the map and home for appearance. GMV and orders stay zero until real orders happen."
                )
              : t(
                  "ابدأ بتوثيق خياطين وتسجيل طلبات حقيقية — كل رقم هنا من قاعدة البيانات.",
                  "Start by verifying tailors and recording real orders — every number here is from the database."
                )}
          </p>
        </div>
      )}

      {loading ? <KPISkeleton /> : data && <KPIGrid items={data.kpis} />}
      {!loading && data && <LiveStatusStrip status={data.liveStatus} />}

      {loading ? (
        <SectionSkeleton rows={4} className="min-h-[240px]" />
      ) : (
        data && <ExecutiveInsights insights={data.insights} />
      )}

      {loading ? (
        <SectionSkeleton rows={5} className="min-h-[360px]" />
      ) : (
        data && (
          <NationalCoverageSection cities={data.coverage} showcaseNetwork={showcaseNetwork} />
        )
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {loading ? <SectionSkeleton rows={6} className="min-h-[320px]" /> : <RevenueAnalyticsSection />}
          {loading ? <SectionSkeleton rows={4} /> : data && <OperationsCenter data={data.operations} />}
        </div>
        <div className="space-y-6">
          {!loading && data && <AlertsPanel alerts={data.alerts} />}
          {loading ? <SectionSkeleton rows={5} /> : data && <ActivityFeedSection activities={data.activity} />}
          {!loading && <QuickActionsSection />}
        </div>
      </div>

      {loading ? <SectionSkeleton rows={6} /> : <VerificationPanel compact />}

      <div className="grid gap-6 lg:grid-cols-2">
        {!loading && data && data.topTailors.length > 0 && <TopTailorsSection tailors={data.topTailors} />}
        {!loading && data && <CustomerIntelligenceSection data={data.customers} />}
      </div>

      {!loading && data && data.trends.hasData && <FashionTrendsSection trends={data.trends} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {!loading && data && <AIUsageSection data={data.ai} />}
        {!loading && data && <AIPerformanceSection data={data.aiPerf} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {!loading && data && <InventoryIntelligenceSection data={data.inventory} />}
        {!loading && data && <MarketplacePerformanceSection data={data.marketplace} />}
      </div>

      {!loading && data && <GrowthFunnelSection funnel={data.funnel} />}
      {!loading && data && <NationalAIPanelSection data={data.national} />}
      {!loading && <AICommandNetworkSection />}
      {!loading && data && <SystemHealthSection health={data.health} />}
    </div>
  );
}
