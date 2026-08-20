"use client";

import Link from "next/link";
import { NationalAIPanelSection, AIUsageSection, AIPerformanceSection } from "@/components/admin/sections/SupportSections";
import { ExecutiveInsights } from "@/components/admin/sections/ExecutiveInsights";
import { useLocale } from "@/lib/context/locale-context";
import { useEffect, useState } from "react";
import { SectionSkeleton } from "@/components/admin/AdminSkeleton";

export default function AdminAIPage() {
  const { t } = useLocale();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <SectionSkeleton rows={8} />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("الذكاء الوطني", "National AI")}</h1>
          <p className="text-sm text-muted-foreground">{t("رؤى وتحليلات الذكاء الاصطناعي", "AI insights and analytics")}</p>
        </div>
        <Link href="/admin/ai-center" className="text-sm text-primary hover:underline">
          {t("مركز القيادة", "Command Center")} →
        </Link>
      </div>
      <ExecutiveInsights insights={data.insights as Parameters<typeof ExecutiveInsights>[0]["insights"]} />
      <NationalAIPanelSection data={data.national as Parameters<typeof NationalAIPanelSection>[0]["data"]} />
      <AIUsageSection data={data.ai as Parameters<typeof AIUsageSection>[0]["data"]} />
      <AIPerformanceSection data={data.aiPerf as Parameters<typeof AIPerformanceSection>[0]["data"]} />
    </div>
  );
}
