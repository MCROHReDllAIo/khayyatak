"use client";

import { useState } from "react";
import type {
  AIAnalyticsData,
  InventoryIntelData,
  MarketplacePerfData,
  FunnelStage,
  ActivityItem,
  SystemHealthData,
  NationalPanelData,
  AIPerformanceData,
} from "@/lib/admin/types";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Brain, Zap, Activity } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";

export function AIUsageSection({ data }: { data: AIAnalyticsData }) {
  const { t } = useLocale();

  const metrics = [
    { label: t("طلبات AI", "AI Requests"), value: data.requests.toLocaleString() },
    { label: t("توليد تصاميم", "Design Generations"), value: data.designs.toLocaleString() },
    { label: t("قياسات", "Measurements"), value: data.measurements.toLocaleString() },
    { label: t("مطابقة خياط", "Tailor Matches"), value: data.matches.toLocaleString() },
    { label: t("محادثات", "Conversations"), value: data.conversations.toLocaleString() },
  ];

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-navy">{t("استخدام الذكاء الاصطناعي", "AI Usage Analytics")}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-omani-cream/40 border p-4 text-center">
            <p className="text-xl font-bold text-navy">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chart}>
            <XAxis dataKey="feature" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#0F7654" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {t("أكثر ميزة استخدامًا", "Most Used Feature")}: <span className="font-semibold text-primary">{data.topFeature_ar}</span>
      </p>
      <Link href="/admin/ai-center" className="inline-block mt-2 text-sm text-primary hover:underline">
        {t("مركز الذكاء الاصطناعي", "AI Command Center")} →
      </Link>
    </section>
  );
}

export function AIPerformanceSection({ data }: { data: { successRate: number; avgResponseSec: number; fallbackPct: number; providerStatus: string; hasData?: boolean; demoLabel?: boolean } }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border bg-navy text-white p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">AI Performance</h2>
        {!data.hasData && (
          <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-1 rounded-full">
            {t("لا توجد سجلات بعد", "No logs yet")}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: t("معدل النجاح", "Success Rate"), value: `${data.successRate}%` },
          { icon: Activity, label: t("متوسط الاستجابة", "Avg Response"), value: `${data.avgResponseSec} sec` },
          { icon: Brain, label: t("Fallback", "Fallback"), value: `${data.fallbackPct}%` },
          { icon: Brain, label: t("المزود", "Provider"), value: data.providerStatus },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <item.icon className="h-5 w-5 text-omani-gold mb-2" />
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs text-white/60 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InventoryIntelligenceSection({ data }: { data: InventoryIntelData }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">{t("ذكاء المخزون", "Inventory Intelligence")}</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <p className="text-3xl font-bold text-amber-800">{data.lowStockMerchants}</p>
          <p className="text-sm text-amber-700 mt-1">{t("متاجر مخزون منخفض", "Low Stock Merchants")}</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm font-medium text-navy mb-2">{t("أكثر الأقمشة طلبًا", "Most Requested Fabrics")}</p>
          <div className="flex flex-wrap gap-2">
            {data.mostRequested.map((f) => (
              <span key={f} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.forecastShortages.map((item) => (
          <div key={item.material} className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium text-navy">{item.material}</p>
              <p className="text-xs text-muted-foreground">{item.merchants} {t("متاجر معرضة للخطر", "merchants at risk")}</p>
            </div>
            <Link href={item.action} className="text-sm text-primary hover:underline">{t("عرض المتاجر", "View Merchants")}</Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MarketplacePerformanceSection({ data }: { data: MarketplacePerfData }) {
  const { t } = useLocale();

  const items = [
    { label_ar: "أعلى فئة", label_en: "Top Category", value: data.topCategory },
    { label_ar: "أعلى مدينة", label_en: "Top City", value: data.topCity },
    { label_ar: "أعلى منتج", label_en: "Top Product", value: data.topProduct },
    { label_ar: "متوسط الطلب", label_en: "Avg Order", value: `${data.avgOrder} ر.ع` },
    { label_ar: "التحويل", label_en: "Conversion", value: `${data.conversion}%` },
    { label_ar: "إعادة الطلب", label_en: "Repeat Rate", value: `${data.repeatRate}%` },
  ];

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">{t("أداء السوق", "Marketplace Performance")}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.label_en} className="rounded-xl bg-omani-cream/30 border border-border/40 p-4">
            <p className="text-xs text-muted-foreground">{t(item.label_ar, item.label_en)}</p>
            <p className="text-lg font-bold text-navy mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GrowthFunnelSection({ funnel }: { funnel: FunnelStage[] }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <h2 className="text-2xl font-bold text-navy mb-2">{t("قمع النمو", "Growth Funnel")}</h2>
      {funnel.every((f) => f.count === 0) && (
        <p className="text-xs text-muted-foreground mb-6">{t("لا توجد بيانات كافية", "Insufficient data")}</p>
      )}
      <div className="space-y-2 max-w-2xl mx-auto">
        {funnel.map((stage, i) => (
          <div key={stage.stage} className="relative">
            <div
              className="mx-auto rounded-xl bg-gradient-to-r from-primary/90 to-primary text-white py-3 px-4 text-center transition-all hover:from-navy hover:to-navy-light"
              style={{ width: `${Math.max(30, stage.pct)}%` }}
            >
              <p className="text-sm font-semibold">{t(stage.stage_ar, stage.stage)}</p>
              <p className="text-xs opacity-80">{stage.pct}% · {stage.count.toLocaleString()}</p>
            </div>
            {i < funnel.length - 1 && (
              <div className="flex justify-center py-1 text-muted-foreground text-xs">↓</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActivityFeedSection({ activities }: { activities: ActivityItem[] }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6">
      <h2 className="text-xl font-bold text-navy mb-4">{t("آخر النشاطات", "Recent Activity")}</h2>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3 items-start border-b border-border/30 pb-3 last:border-0">
            <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
            <div>
              <p className="text-sm text-navy">{t(a.message_ar, a.message_en)}</p>
              <p className="text-xs text-muted-foreground">{a.time_ar}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const QUICK_ACTIONS = [
  { href: "/admin/tailors?action=add", ar: "إضافة خياط", en: "Add Tailor" },
  { href: "/admin/verification", ar: "توثيق الخياطين", en: "Verify Tailors" },
  { href: "/admin/orders", ar: "مراجعة الطلبات", en: "Review Orders" },
  { href: "/admin/customers", ar: "عرض العملاء", en: "View Customers" },
  { href: "/admin/analytics", ar: "عرض التحليلات", en: "View Analytics" },
  { href: "/admin/settings", ar: "إدارة المدن", en: "Manage Cities" },
  { href: "/admin/settings", ar: "إدارة المحتوى", en: "Manage Content" },
];

export function QuickActionsSection() {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border bg-gradient-to-br from-omani-cream to-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-navy mb-4">{t("إجراءات سريعة", "Quick Actions")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.en}
            href={action.href}
            className="rounded-xl bg-white border border-border/50 px-3 py-3 text-sm font-medium text-navy hover:border-primary hover:text-primary transition-colors text-center"
          >
            {t(action.ar, action.en)}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function NationalAIPanelSection({ data }: { data: NationalPanelData & { demoLabel?: boolean } }) {
  const { t } = useLocale();

  const items = [
    { label_ar: "أعلى مدينة", label_en: "Top City", value: data.topCity },
    { label_ar: "أعلى فئة", label_en: "Top Category", value: data.topCategory },
    { label_ar: "أعلى قماش", label_en: "Top Fabric", value: data.topFabric },
    { label_ar: "أعلى لون", label_en: "Top Color", value: data.topColor },
    { label_ar: "الطلب الموسمي", label_en: "Seasonal Demand", value: t(data.seasonalDemand_ar, data.seasonalDemand_en) },
    { label_ar: "متوسط الطلب", label_en: "Avg Order", value: `${data.avgOrder} ر.ع` },
    { label_ar: "إعادة الشراء", label_en: "Repeat Rate", value: `${data.repeatRate}%` },
  ];

  return (
    <section className="rounded-3xl border-2 border-omani-gold/30 bg-gradient-to-br from-navy via-navy-light to-navy p-6 md:p-8 text-white shadow-premium">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-omani-gold text-xs uppercase tracking-widest font-semibold">National Tailoring Intelligence</p>
          <h2 className="text-2xl font-bold mt-1">{t("الذكاء الوطني للخياطة", "National Tailoring Intelligence")}</h2>
          <p className="text-white/60 text-sm mt-1">{t("ذكاء مجهول الهوية لدعم نمو القطاع.", "Anonymized intelligence to support sector growth.")}</p>
        </div>
        {!data.hasData && (
          <span className="text-xs bg-white/10 text-white/80 border border-white/20 px-3 py-1.5 rounded-full">
            {t("لا توجد بيانات كافية", "Insufficient data")}
          </span>
        )}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label_en} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50">{t(item.label_ar, item.label_en)}</p>
            <p className="text-lg font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <Link href="/admin/national-intelligence" className="inline-block mt-6 text-sm text-omani-gold hover:text-white">
        {t("عرض الذكاء الوطني الكامل", "View full national intelligence")} →
      </Link>
    </section>
  );
}

const AI_NODES = [
  { id: "customer", ar: "Customer AI", href: "/admin/ai-center" },
  { id: "design", ar: "Design AI", href: "/admin/ai-center" },
  { id: "measure", ar: "Measurement AI", href: "/admin/ai-center" },
  { id: "match", ar: "Matching AI", href: "/admin/ai-center" },
  { id: "order", ar: "Order AI", href: "/admin/orders" },
  { id: "tailor", ar: "Tailor AI", href: "/admin/tailors" },
  { id: "inventory", ar: "Inventory AI", href: "/admin/inventory" },
  { id: "pricing", ar: "Pricing AI", href: "/admin/analytics" },
  { id: "marketing", ar: "Marketing AI", href: "/admin/analytics" },
  { id: "quality", ar: "Quality AI", href: "/admin/ai-center" },
  { id: "national", ar: "National Intelligence", href: "/admin/national-intelligence" },
];

export function AICommandNetworkSection() {
  const { t } = useLocale();
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8 overflow-hidden">
      <h2 className="text-2xl font-bold text-navy mb-2">AI Command Center</h2>
      <p className="text-sm text-muted-foreground mb-8">{t("شبكة الذكاء الاصطناعي للمنصة", "Platform AI network")}</p>
      <div className="relative min-h-[280px] flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-32 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-pulse-soft">
            <Brain className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="relative w-full max-w-lg aspect-square">
          {AI_NODES.map((node, i) => {
            const angle = (i / AI_NODES.length) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + 42 * Math.cos(angle);
            const y = 50 + 42 * Math.sin(angle);
            return (
              <Link
                key={node.id}
                href={node.href}
                onMouseEnter={() => setActive(node.id)}
                onMouseLeave={() => setActive(null)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span
                  className={`block text-[10px] font-medium px-2 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                    active === node.id
                      ? "bg-primary text-white border-primary shadow-glow scale-110"
                      : "bg-white text-navy border-border/60 hover:border-primary"
                  }`}
                >
                  {node.ar}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SystemHealthSection({ health }: { health: SystemHealthData }) {
  const { t, locale } = useLocale();

  const statusColor = {
    operational: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-navy">{t("صحة النظام", "System Health")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("آخر فحص", "Last checked")}: {new Date(health.lastChecked).toLocaleString(locale === "ar" ? "ar-OM" : "en-GB")}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {health.services.map((svc) => (
          <div key={svc.id} className="rounded-xl border p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-navy">{t(svc.name_ar, svc.name_en)}</span>
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className={`h-2 w-2 rounded-full ${statusColor[svc.status]}`} />
              {svc.status === "operational" ? t("تشغيل", "Operational") : svc.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
