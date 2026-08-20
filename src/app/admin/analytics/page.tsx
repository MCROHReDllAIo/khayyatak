"use client";

import { RevenueAnalyticsSection } from "@/components/admin/sections/RevenueAnalytics";
import { MarketplacePerformanceSection, GrowthFunnelSection } from "@/components/admin/sections/SupportSections";
import { useLocale } from "@/lib/context/locale-context";
import { useEffect, useState } from "react";
import { SectionSkeleton } from "@/components/admin/AdminSkeleton";

export default function AdminAnalyticsPage() {
  const { t } = useLocale();
  const [data, setData] = useState<{ marketplace: unknown; funnel: unknown } | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <SectionSkeleton rows={8} />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("التحليلات", "Analytics")}</h1>
        <p className="text-sm text-muted-foreground">{t("تحليلات حية من قاعدة البيانات", "Live database analytics")}</p>
      </div>
      <RevenueAnalyticsSection />
      <MarketplacePerformanceSection data={data.marketplace as Parameters<typeof MarketplacePerformanceSection>[0]["data"]} />
      <GrowthFunnelSection funnel={data.funnel as Parameters<typeof GrowthFunnelSection>[0]["funnel"]} />
    </div>
  );
}
