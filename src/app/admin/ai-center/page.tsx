"use client";

import { AICommandNetworkSection, AIUsageSection, AIPerformanceSection } from "@/components/admin/sections/SupportSections";
import { ExecutiveInsights } from "@/components/admin/sections/ExecutiveInsights";
import { useLocale } from "@/lib/context/locale-context";
import { useEffect, useState } from "react";
import { SectionSkeleton } from "@/components/admin/AdminSkeleton";

export default function AdminAICenterPage() {
  const { t } = useLocale();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <SectionSkeleton rows={8} />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">AI Command Center</h1>
        <p className="text-sm text-muted-foreground">{t("شبكة الذكاء الاصطناعي للمنصة", "Platform AI network")}</p>
      </div>
      <AICommandNetworkSection />
      <AIUsageSection data={data.ai as Parameters<typeof AIUsageSection>[0]["data"]} />
      <AIPerformanceSection data={data.aiPerf as Parameters<typeof AIPerformanceSection>[0]["data"]} />
      <ExecutiveInsights insights={data.insights as Parameters<typeof ExecutiveInsights>[0]["insights"]} />
    </div>
  );
}
