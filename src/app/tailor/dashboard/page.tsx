"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, AlertTriangle, Package, TrendingUp, Users } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { BRAND } from "@/lib/constants/brand";
import { useAppState } from "@/lib/context/app-context";
import {
  generateBusinessInsightsFromData,
  getDashboardActions,
  computeBusinessHealthScore,
} from "@/lib/ai/business-insights";
import { runInventoryAgent, runOrderAgent } from "@/lib/ai/agentic";
import { computeOverdueOrders, computeMonthlyRevenue } from "@/lib/analytics/platform-stats";
import { AnimatedScore } from "@/components/ui/AnimatedScore";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { formatOMR } from "@/lib/utils";

const ICONS = {
  late: AlertTriangle,
  inventory: Package,
  pricing: TrendingUp,
  repeat: Users,
};

export default function TailorDashboard() {
  const { t } = useLocale();
  const { orders, inventory } = useAppState();

  const insights = useMemo(
    () => generateBusinessInsightsFromData(orders, inventory),
    [orders, inventory]
  );
  const actions = useMemo(() => getDashboardActions(orders, inventory), [orders, inventory]);
  const healthScore = useMemo(
    () => computeBusinessHealthScore(orders, inventory),
    [orders, inventory]
  );
  const overdueCount = useMemo(() => computeOverdueOrders(orders, "t1").length, [orders]);
  const lowStock = inventory.find((i) => i.low_stock) ?? inventory[0];
  const orderAlert = runOrderAgent(overdueCount || 1);
  const inventoryAgent = runInventoryAgent(lowStock?.ai_forecast_days ?? 6, lowStock?.fabric_name_ar ?? "القماش");
  const revenue = computeMonthlyRevenue(orders.filter((o) => o.tailor_id === "t1"));

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-navy text-white p-8 md:p-12">
        <GeometricPattern className="text-white opacity-20" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-omani-gold mb-3">
              AI Business Command Center
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t(BRAND.aiAssistantAr, BRAND.aiAssistantEn)}</h1>
            <p className="text-white/60">{t("خياط الأصالة — صلالة", "Al Asala — Salalah")}</p>
            <p className="mt-6 text-white/80 text-lg max-w-md leading-relaxed">
              {insights[0]?.message_ar ?? t("تحليل مباشر من بيانات الطلبات.", "Live analysis from order data.")}
            </p>
            <p className="text-xs text-white/40 mt-2">{t("بيانات فعلية من التخزين المحلي", "Live localStorage data")}</p>
          </div>
          <div className="flex flex-col items-center">
            <AnimatedScore
              value={healthScore}
              size="lg"
              inverted
              label={t("AI BUSINESS HEALTH", "AI BUSINESS HEALTH")}
              sublabel={t("صحة الأعمال", "Business health")}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">
              {t("إجراءات موصى بها", "Recommended actions")}
            </p>
            <h2 className="text-2xl font-bold text-navy">{t("ماذا يحتاج انتباهك الآن؟", "What needs your attention?")}</h2>
          </div>
          <Link href="/tailor/ai" className="text-sm text-primary hover:underline flex items-center gap-1">
            {t("مساعد AI", "AI Brain")}
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="space-y-3">
          {actions.map((action, i) => {
            const Icon = ICONS[action.id as keyof typeof ICONS] ?? Package;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={action.href}
                  className="group flex items-center gap-4 p-5 rounded-2xl border border-border/50 hover:border-primary/30 hover:bg-omani-cream/30 transition-all"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.priority === "high" ? "bg-red-50 text-red-600" : "bg-primary/10 text-primary"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy group-hover:text-primary transition-colors">
                      {t(action.ar, action.en)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">
                      {action.priority === "high" ? t("أولوية عالية", "High priority") : t("متوسطة", "Medium")}
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary rtl:rotate-180 shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="fashion-divider pt-12">
        <div className="flex items-start gap-3 mb-6">
          <Sparkles className="h-5 w-5 text-omani-gold shrink-0 mt-1" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Insights</p>
            <p className="text-lg font-medium text-navy mt-1">{orderAlert.message_ar}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {insights.slice(1, 3).map((insight) => (
            <div key={insight.id} className="p-5 rounded-2xl bg-omani-cream/50 border border-border/30">
              <p className="text-sm leading-relaxed text-navy/90">{insight.message_ar}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Agentic AI</p>
        <p className="font-medium text-navy mb-4">{inventoryAgent.suggestedAction.message_ar}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{formatOMR(revenue)} {t("إيرادات — من الطلبات", "revenue — from orders")}</span>
          <Link href="/tailor/ai" className="text-sm font-medium text-primary hover:underline">
            {t("موافقة →", "Approve →")}
          </Link>
        </div>
      </section>
    </div>
  );
}
