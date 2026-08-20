"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIItem } from "@/lib/admin/types";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

export function KPIGrid({ items }: { items: KPIItem[] }) {
  const { t } = useLocale();

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((kpi, i) => {
        const up = kpi.trend >= 0;
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-5 shadow-card hover:shadow-premium hover:border-primary/20 transition-all"
          >
            <div className="absolute top-0 end-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
            <p className="text-sm text-muted-foreground">{t(kpi.label_ar, kpi.label_en)}</p>
            <p className="text-2xl font-bold text-navy mt-1 tracking-tight">{kpi.value}</p>
            <div className="flex items-center gap-2 mt-3">
              {up ? (
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              ) : kpi.trend === 0 ? (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span className={cn("text-xs font-semibold", up ? "text-primary" : "text-amber-600")}>
                {up ? "+" : ""}
                {kpi.trend}%
              </span>
              <span className="text-[10px] text-muted-foreground">{t(kpi.trendLabel_ar, kpi.trendLabel_en)}</span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-omani-gold rounded-full transition-all group-hover:w-full"
                style={{ width: `${Math.min(100, 40 + kpi.trend * 3)}%` }}
              />
            </div>
          </motion.div>
        );
        return kpi.href ? (
          <Link key={kpi.id} href={kpi.href} className="block">
            {content}
          </Link>
        ) : (
          <div key={kpi.id}>{content}</div>
        );
      })}
    </div>
  );
}

export function LiveStatusStrip({ status }: { status: { label_ar: string; label_en: string; services: string[] } }) {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-white px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-sm font-semibold text-navy">{t("حالة المنصة", "Platform Status")}</span>
        <span className="text-sm text-emerald-700">● {t(status.label_ar, status.label_en)}</span>
      </div>
      <div className="flex flex-wrap gap-3 ms-auto">
        {status.services.map((svc) => (
          <span key={svc} className="inline-flex items-center gap-1.5 text-xs bg-white border border-emerald-100 px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {svc}
          </span>
        ))}
      </div>
    </div>
  );
}
