"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Scissors,
  ShoppingBag,
  Coins,
  Sparkles,
  BadgeCheck,
  Package,
  MapPinned,
  Brain,
} from "lucide-react";
import type { KPIItem } from "@/lib/admin/types";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

const KPI_ICONS: Record<string, typeof Users> = {
  customers: Users,
  tailors: Scissors,
  orders: ShoppingBag,
  gmv: Coins,
  aov: Coins,
  repeat: Users,
  ai: Brain,
  verified: BadgeCheck,
  innovation: Sparkles,
  products: Package,
  network: MapPinned,
};

const ACCENT: Record<NonNullable<KPIItem["accent"]> | "default", string> = {
  navy: "from-navy/12 to-transparent",
  green: "from-primary/15 to-transparent",
  gold: "from-omani-gold/25 to-transparent",
  cream: "from-[#e8e2d6] to-transparent",
  default: "from-primary/8 to-transparent",
};

export function KPIGrid({ items }: { items: KPIItem[] }) {
  const { t } = useLocale();

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
      {items.map((kpi, i) => {
        const up = kpi.trend > 0;
        const Icon = KPI_ICONS[kpi.id] ?? Sparkles;
        const accent = kpi.accent ?? "default";
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group relative overflow-hidden rounded-2xl border border-navy/8 bg-white p-4 shadow-[0_12px_32px_-24px_rgba(7,26,51,0.45)] hover:border-primary/25 hover:shadow-[0_18px_40px_-22px_rgba(15,118,84,0.35)] transition-all"
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-bl opacity-90 pointer-events-none",
                ACCENT[accent]
              )}
            />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-navy/50">{t(kpi.label_ar, kpi.label_en)}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-navy truncate">{kpi.value}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-omani-gold shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5">
              {up ? (
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              ) : kpi.trend === 0 ? (
                <Minus className="h-3.5 w-3.5 text-navy/30" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span className={cn("text-[11px] font-semibold", up ? "text-primary" : "text-navy/45")}>
                {up ? "+" : ""}
                {kpi.trend}%
              </span>
              <span className="text-[10px] text-navy/40 truncate">{t(kpi.trendLabel_ar, kpi.trendLabel_en)}</span>
            </div>
            <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-navy/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-navy to-primary transition-all group-hover:brightness-110"
                style={{ width: `${Math.min(100, 28 + Math.abs(kpi.trend) * 2 + (kpi.value !== "0" && kpi.value !== "—" ? 35 : 0))}%` }}
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
    <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-[#e8f5ef] via-white to-[#f7f4ee] px-4 py-3.5 flex flex-wrap items-center gap-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-sm font-semibold text-navy">{t("حالة المنصة", "Platform Status")}</span>
        <span className="text-sm text-emerald-700">● {t(status.label_ar, status.label_en)}</span>
      </div>
      <div className="flex flex-wrap gap-2 ms-auto">
        {status.services.map((svc) => (
          <span
            key={svc}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white border border-navy/8 px-2.5 py-1 rounded-full text-navy/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {svc}
          </span>
        ))}
      </div>
    </div>
  );
}
