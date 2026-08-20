"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

type RevenueTab = "gmv" | "orders" | "customers" | "tailors";

const TABS: { id: RevenueTab; ar: string; en: string }[] = [
  { id: "gmv", ar: "GMV", en: "GMV" },
  { id: "orders", ar: "الطلبات", en: "Orders" },
  { id: "customers", ar: "العملاء", en: "Customers" },
  { id: "tailors", ar: "الخياطون", en: "Tailors" },
];

const PERIODS = [
  { id: "7d", ar: "7 أيام", en: "7 Days" },
  { id: "30d", ar: "30 يوم", en: "30 Days" },
  { id: "6m", ar: "6 أشهر", en: "6 Months" },
  { id: "1y", ar: "سنة", en: "1 Year" },
];

export function RevenueAnalyticsSection() {
  const { t } = useLocale();
  const [tab, setTab] = useState<RevenueTab>("gmv");
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<{ label: string; value: number; prev: number }[]>([]);

  useEffect(() => {
    fetch(`/api/admin/revenue?tab=${tab}&period=${period}`)
      .then((r) => r.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]));
  }, [tab, period]);

  const growth = useMemo(() => {
    const last = data[data.length - 1];
    if (!last?.prev) return 0;
    return Math.round(((last.value - last.prev) / last.prev) * 1000) / 10;
  }, [data]);

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy">{t("نمو المنصة", "Platform Growth")}</h2>
          <p className="text-sm text-muted-foreground">{t("تحليل الإيرادات من الطلبات الفعلية", "Revenue from actual orders")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                period === p.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t(p.ar, p.en)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-border/40 pb-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              tab === item.id ? "bg-navy text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t(item.ar, item.en)}
          </button>
        ))}
        {data.length > 0 && <span className="ms-auto text-sm text-primary font-semibold">+{growth}%</span>}
      </div>

      {data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
          {t("لا توجد بيانات كافية لعرض الرسم البياني", "Insufficient data for chart")}
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" name={t("الحالي", "Current")} stroke="#0F7654" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="prev" name={t("السابق", "Previous")} stroke="#C8A45D" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <Link href="/admin/analytics" className="inline-block mt-4 text-sm text-primary hover:underline">
        {t("عرض التحليلات الكاملة", "View full analytics")} →
      </Link>
    </section>
  );
}
