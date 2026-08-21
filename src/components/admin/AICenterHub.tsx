"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Ruler,
  MessageSquare,
  Shirt,
  ScanEye,
  Network,
  Boxes,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings,
  ExternalLink,
  RefreshCw,
  Activity,
  BarChart3,
  Wand2,
} from "lucide-react";
import type { AIAnalyticsData, AIPerformanceData, ExecutiveInsight } from "@/lib/admin/types";
import type { SystemFeatureCheck, SystemStatusPayload } from "@/lib/admin/system-status";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MODULES: Array<{
  id: string;
  ar: string;
  en: string;
  desc_ar: string;
  desc_en: string;
  href: string;
  icon: typeof Brain;
  featureId?: string;
}> = [
  {
    id: "concierge",
    ar: "المستشار الذكي",
    en: "AI Concierge",
    desc_ar: "محادثة وتوجيه تسوق على الصفحة الرئيسية",
    desc_en: "Home shopping chat and guidance",
    href: "/",
    icon: MessageSquare,
    featureId: "ai_chat",
  },
  {
    id: "innovate",
    ar: "استوديو ابتكار",
    en: "Innovate Studio",
    desc_ar: "تصميم تعاوني + مجسم 3D + معاينة AI",
    desc_en: "Collaborative design + 3D + AI viz",
    href: "/customer/innovation",
    icon: Wand2,
    featureId: "innovation_viz",
  },
  {
    id: "measure",
    ar: "القياسات",
    en: "Measurements",
    desc_ar: "تقدير مقاسات بالكاميرا والأنثروبومتري",
    desc_en: "Camera + anthropometric estimates",
    href: "/customer/measurements",
    icon: Ruler,
    featureId: "ai_chat",
  },
  {
    id: "style-twin",
    ar: "توأم الأسلوب",
    en: "Style Twin",
    desc_ar: "مطابقة منتجات بالـ embeddings",
    desc_en: "Product matching via embeddings",
    href: "/customer/ai-stylist",
    icon: Shirt,
    featureId: "style_twin",
  },
  {
    id: "tryon",
    ar: "تجربة افتراضية",
    en: "Virtual Try-On",
    desc_ar: "معاينة مظهر على الصورة (عند التفعيل)",
    desc_en: "Look preview on photo (when enabled)",
    href: "/customer/ai",
    icon: ScanEye,
    featureId: "virtual_tryon",
  },
  {
    id: "national",
    ar: "الذكاء الوطني",
    en: "National Intelligence",
    desc_ar: "رؤى قطاعية مجهولة الهوية",
    desc_en: "Anonymized sector insights",
    href: "/admin/national-intelligence",
    icon: Network,
    featureId: "ai_chat",
  },
];

function statusMeta(status: SystemFeatureCheck["status"], t: (a: string, e: string) => string) {
  if (status === "ready")
    return { label: t("جاهز", "Ready"), color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (status === "misconfigured")
    return { label: t("إعداد خاطئ", "Misconfigured"), color: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" };
  if (status === "offline")
    return { label: t("غير مفهرس", "Offline"), color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  return { label: t("يحتاج إعداد", "Needs setup"), color: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50 border-slate-200" };
}

const CHART_COLORS = ["#0F7654", "#071A33", "#C8A45D", "#1a4a6b", "#7a1f1f", "#2a1840"];

interface AICenterHubProps {
  analytics: AIAnalyticsData;
  performance: AIPerformanceData;
  insights: ExecutiveInsight[];
  system: SystemStatusPayload | null;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function AICenterHub({
  analytics,
  performance,
  insights,
  system,
  onRefresh,
  refreshing,
}: AICenterHubProps) {
  const { t, locale } = useLocale();
  const ai = system?.ai;
  const features = system?.features ?? [];
  const featureMap = Object.fromEntries(features.map((f) => [f.id, f]));

  const readyCount = features.filter((f) => f.status === "ready").length;
  const chartData =
    analytics.chart.length > 0
      ? analytics.chart
      : [
          { feature: "chat", value: analytics.conversations || 0 },
          { feature: "design", value: analytics.designs || 0 },
          { feature: "measurement", value: analytics.measurements || 0 },
          { feature: "match", value: analytics.matches || 0 },
        ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      {/* Hero */}
      <div className="overflow-hidden rounded-[1.75rem] border border-navy/10 bg-gradient-to-br from-navy via-[#0c2340] to-[#0a3d2e] p-6 text-white shadow-[0_28px_70px_-40px_rgba(7,26,51,0.75)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-omani-gold">
              <Brain className="h-5 w-5" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">AI Command Center</span>
            </div>
            <h1 className="font-arabic text-2xl font-bold md:text-3xl">
              {t("مركز قيادة الذكاء الاصطناعي", "AI Command Center")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              {t(
                "حالة المزودات الحقيقية، وحدات المنصة، والاستخدام من سجلات AI — بدون أرقام وهمية.",
                "Real provider status, platform modules, and usage from AI logs — no fabricated numbers."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-medium hover:bg-white/10"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              {t("تحديث الحالة", "Refresh status")}
            </button>
            <Link
              href="/admin/settings"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-omani-gold px-4 text-xs font-semibold text-navy hover:brightness-105"
            >
              <Settings className="h-3.5 w-3.5" />
              {t("الإعدادات", "Settings")}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: t("المزود", "Provider"),
              value: ai?.provider ?? "—",
              sub: ai?.model ?? t("غير محدد", "unset"),
            },
            {
              label: t("الاتصال", "Connection"),
              value: ai?.connected
                ? t("متصل", "Connected")
                : ai?.configured
                  ? t("مُعدّ", "Configured")
                  : t("غير مفعّل", "Off"),
              sub: ai?.error || ai?.keyIssue || t("فحص حي", "Live check"),
            },
            {
              label: t("وحدات جاهزة", "Modules ready"),
              value: `${readyCount}/${Math.max(features.length, 1)}`,
              sub: t("من فحص النظام", "from system check"),
            },
            {
              label: t("استدعاءات AI", "AI calls"),
              value: analytics.requests.toLocaleString(),
              sub: t("من سجلات المنصة", "from platform logs"),
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5"
            >
              <p className="text-[10px] uppercase tracking-wider text-white/45">{card.label}</p>
              <p className="mt-1 truncate text-xl font-bold text-omani-gold">{card.value}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/50">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Provider + Style Twin */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-navy">{t("مزودات الذكاء", "AI providers")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => {
              const meta = statusMeta(f.status, t);
              return (
                <div
                  key={f.id}
                  className={cn("rounded-2xl border p-4", meta.bg)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy">{t(f.name_ar, f.name_en)}</p>
                      <p className="mt-1 text-xs text-navy/55">
                        {t(f.detail_ar ?? "", f.detail_en ?? "")}
                      </p>
                      {f.envKey && (
                        <p className="mt-1 font-mono text-[10px] text-navy/35">{f.envKey}</p>
                      )}
                    </div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", meta.text)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.color)} />
                      {meta.label}
                    </span>
                  </div>
                  {f.setupUrl && f.status !== "ready" && (
                    <a
                      href={f.setupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      {t("إعداد", "Setup")} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          {system?.checkedAt && (
            <p className="mt-3 text-[10px] text-navy/40">
              {t("آخر فحص", "Last checked")}:{" "}
              {new Date(system.checkedAt).toLocaleString(locale === "ar" ? "ar-OM" : "en-GB")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-navy/10 bg-gradient-to-b from-[#f7f4ee] to-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-omani-gold" />
            <h2 className="text-lg font-bold text-navy">{t("توأم الأسلوب", "Style Twin")}</h2>
          </div>
          <p className="text-3xl font-bold text-navy">
            {system?.styleTwin?.indexedCount?.toLocaleString() ?? "0"}
          </p>
          <p className="text-xs text-navy/50">{t("منتجات مفهرسة", "Indexed products")}</p>
          <p className="mt-3 rounded-xl bg-navy/5 px-3 py-2 font-mono text-[10px] text-navy/55">
            {system?.styleTwin?.model ?? "—"}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-navy/50">
            {system?.styleTwin?.configured
              ? t(
                  "Embeddings جاهزة. إن كان العدد صفرًا شغّل فهرسة المنتجات على السيرفر.",
                  "Embeddings ready. If count is zero, run product indexing on the server."
                )
              : t(
                  "فعّل OPENROUTER_API_KEY ثم فهرس المنتجات.",
                  "Enable OPENROUTER_API_KEY then index products."
                )}
          </p>
          <Link
            href="/admin/products"
            className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            {t("إدارة المنتجات", "Manage products")} →
          </Link>
        </div>
      </div>

      {/* Capability modules */}
      <section className="rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-omani-gold">
              {t("وحدات المنصة", "Platform modules")}
            </p>
            <h2 className="mt-1 text-xl font-bold text-navy">
              {t("شبكة قدرات الذكاء الاصطناعي", "AI capability network")}
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((mod, i) => {
            const feat = mod.featureId ? featureMap[mod.featureId] : undefined;
            const meta = feat ? statusMeta(feat.status, t) : null;
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={mod.href}
                  className="group flex h-full flex-col rounded-2xl border border-navy/8 bg-gradient-to-br from-white to-[#faf8f4] p-4 transition-all hover:border-primary/30 hover:shadow-[0_16px_40px_-28px_rgba(15,118,84,0.45)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-omani-gold shadow-sm transition-transform group-hover:scale-105">
                      <Icon className="h-4 w-4" />
                    </span>
                    {meta && (
                      <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold", meta.bg, meta.text)}>
                        {meta.label}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-bold text-navy">{t(mod.ar, mod.en)}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-navy/50">
                    {t(mod.desc_ar, mod.desc_en)}
                  </p>
                  <span className="mt-3 text-[11px] font-semibold text-primary">
                    {t("فتح", "Open")} →
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Usage + Performance */}
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-sm lg:col-span-3 md:p-6">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-navy">{t("استخدام الذكاء الاصطناعي", "AI usage")}</h2>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { label: t("طلبات", "Requests"), value: analytics.requests },
              { label: t("تصاميم", "Designs"), value: analytics.designs },
              { label: t("قياسات", "Measures"), value: analytics.measurements },
              { label: t("مطابقة", "Matches"), value: analytics.matches },
              { label: t("محادثات", "Chats"), value: analytics.conversations },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-navy/8 bg-[#f7f4ee]/70 p-3 text-center">
                <p className="text-xl font-bold text-navy">{m.value.toLocaleString()}</p>
                <p className="text-[10px] text-navy/45">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="feature" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-navy/45">
            {t("أكثر ميزة", "Top feature")}:{" "}
            <span className="font-semibold text-primary">
              {t(analytics.topFeature_ar, analytics.topFeature_en)}
            </span>
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-navy/10 bg-navy p-5 text-white shadow-sm lg:col-span-2 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-omani-gold" />
              <h2 className="text-lg font-bold">{t("أداء AI", "AI performance")}</h2>
            </div>
            {!performance.hasData && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/70">
                {t("لا سجلات بعد", "No logs yet")}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {[
              {
                icon: CheckCircle2,
                label: t("معدل النجاح", "Success rate"),
                value: `${performance.successRate}%`,
              },
              {
                icon: Zap,
                label: t("متوسط الاستجابة", "Avg response"),
                value: `${performance.avgResponseSec}s`,
              },
              {
                icon: AlertTriangle,
                label: t("Fallback", "Fallback"),
                value: `${performance.fallbackPct}%`,
              },
              {
                icon: Brain,
                label: t("المزود", "Provider"),
                value: performance.providerStatus,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-3"
              >
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <row.icon className="h-4 w-4 text-omani-gold" />
                  {row.label}
                </div>
                <span className="font-bold text-omani-gold">{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Insights + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-sm lg:col-span-2 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-omani-gold" />
            <h2 className="text-lg font-bold text-navy">{t("رؤى جاهزية AI", "AI readiness insights")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(insights.length ? insights : []).slice(0, 4).map((insight, i) => (
              <Link
                key={insight.id}
                href={insight.href}
                className="rounded-2xl border border-navy/8 bg-[#faf8f4] p-4 transition-colors hover:border-primary/25"
              >
                <p className="text-[10px] font-bold text-omani-gold">
                  Insight {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-bold text-navy">{t(insight.title_ar, insight.title_en)}</h3>
                <p className="mt-1 text-xs leading-relaxed text-navy/55">
                  {t(insight.message_ar, insight.message_en)}
                </p>
              </Link>
            ))}
            {insights.length === 0 && (
              <p className="text-sm text-navy/45 sm:col-span-2">
                {t("لا رؤى بعد — استخدم المنصة لتوليد سجلات AI.", "No insights yet — use the platform to generate AI logs.")}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-navy/10 bg-[#f7f4ee] p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-lg font-bold text-navy">{t("إجراءات سريعة", "Quick actions")}</h2>
          <div className="space-y-2">
            {[
              { href: "/customer/innovation", ar: "تجربة ابتكار 3D", en: "Try Innovate 3D", icon: Wand2 },
              { href: "/admin/settings", ar: "إعداد المفاتيح", en: "Configure keys", icon: Settings },
              { href: "/admin/analytics", ar: "التحليلات", en: "Analytics", icon: BarChart3 },
              { href: "/admin/national-intelligence", ar: "الذكاء الوطني", en: "National intel", icon: Network },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-xl border border-navy/10 bg-white px-3.5 py-3 text-sm font-medium text-navy transition-colors hover:border-primary/30"
              >
                <a.icon className="h-4 w-4 text-primary" />
                {t(a.ar, a.en)}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[11px] text-amber-900">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t(
              "لا نعرض مقاييس نجاح وهمية. الأرقام هنا من السجلات والفحص الحي فقط.",
              "We never show fake success metrics. Numbers here come from logs and live checks only."
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
