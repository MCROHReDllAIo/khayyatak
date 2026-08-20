"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { aggregatePlatformStats } from "@/lib/analytics/platform-stats";
import { DEMO_ORDERS } from "@/lib/demo-data";
import { OmanMapIntel } from "@/components/national/OmanMapIntel";

export default function NationalIntelligencePage() {
  const { t } = useLocale();
  const { orders } = useAppState();

  const stats = useMemo(() => {
    const source = orders.length > 10 ? orders : DEMO_ORDERS;
    return aggregatePlatformStats(source);
  }, [orders]);

  return (
    <div className="space-y-12 md:space-y-16 max-w-5xl">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-700 mb-2">
          Aggregate Demo Intelligence
        </p>
        <h1 className="editorial-title">{t("الذكاء الوطني للخياطة", "National Tailoring Intelligence")}</h1>
        <p className="editorial-sub mt-4">
          {t(
            "فهم مجمّع للسوق المحلي — دون كشف بيانات الأفراد.",
            "Aggregate understanding of the local market — no personal data exposed."
          )}
        </p>
      </header>

      <OmanMapIntel />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
        {[
          { label: t("متوسط الطلب", "Avg order"), value: `${stats.avgOrderPrice} ر.ع` },
          { label: t("طلبات شهرية", "Monthly orders"), value: String(stats.monthlyOrders) },
          { label: t("خياطون نشطون", "Active tailors"), value: String(stats.activeTailors) },
          { label: t("نمو المنصة", "Growth"), value: `+${stats.growthPercent}%` },
        ].map((stat) => (
          <div key={stat.label} className="border-s-2 border-primary/30 ps-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold text-navy mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="fashion-divider pt-12">
        <h2 className="text-xl font-bold text-navy mb-6">{t("الطلب حسب المدينة", "Demand by city")}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.ordersByCity}>
            <XAxis dataKey="city" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="#0F7654" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
