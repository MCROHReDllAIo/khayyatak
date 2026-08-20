"use client";

import Link from "next/link";
import type { OrderStatus } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import type { CriticalAlert, OrderOpsData } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
const PIPELINE_SHORT: Record<OrderStatus, { ar: string; en: string }> = {
  received: { ar: "جديد", en: "New" },
  measurements_confirmed: { ar: "مؤكد", en: "Confirmed" },
  cutting: { ar: "قص", en: "Cutting" },
  sewing: { ar: "تفصيل", en: "Sewing" },
  embroidery: { ar: "تطريز", en: "Embroidery" },
  ready: { ar: "جاهز", en: "Ready" },
  delivered: { ar: "مُسلّم", en: "Delivered" },
};

export function OperationsCenter({ data }: { data: OrderOpsData }) {  const { t } = useLocale();

  const stats = [
    { label_ar: "طلبات نشطة", label_en: "Active Orders", value: data.active, href: "/admin/orders" },
    { label_ar: "متأخرة", label_en: "Delayed", value: data.delayed, href: "/admin/orders?filter=delayed", warn: true },
    { label_ar: "مستحقة اليوم", label_en: "Due Today", value: data.dueToday, href: "/admin/orders?filter=due" },
    { label_ar: "جاهزة", label_en: "Ready", value: data.ready, href: "/admin/orders?filter=ready" },
    { label_ar: "مُسلّمة", label_en: "Delivered", value: data.delivered, href: "/admin/orders?filter=delivered" },
  ];

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <h2 className="text-2xl font-bold text-navy mb-1">{t("مركز العمليات", "Operations Center")}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t("متابعة الطلبات في الوقت الفعلي", "Real-time order operations")}</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label_en}
            href={s.href}
            className={cn(
              "rounded-2xl p-4 border text-center hover:shadow-md transition-all",
              s.warn ? "border-amber-200 bg-amber-50/50" : "border-border/50 bg-omani-cream/30"
            )}
          >
            <p className="text-2xl font-bold text-navy">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{t(s.label_ar, s.label_en)}</p>
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-stretch gap-1 min-w-max">
          {data.pipeline.map((stage, i) => (
            <Link
              key={stage.status}
              href={`/admin/orders?status=${stage.status}`}
              className="group flex-1 min-w-[90px]"
            >
              <div className="rounded-xl border border-border/50 bg-white p-3 text-center hover:border-primary hover:shadow-md transition-all h-full">
                <p className="text-lg font-bold text-primary">{stage.count}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  {t(PIPELINE_SHORT[stage.status].ar, PIPELINE_SHORT[stage.status].en)}
                </p>
              </div>
              {i < data.pipeline.length - 1 && (
                <div className="hidden md:block absolute" aria-hidden />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AlertsPanel({ alerts }: { alerts: CriticalAlert[] }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-white p-6 shadow-card">
      <h2 className="text-xl font-bold text-navy mb-4">{t("تنبيهات تحتاج انتباهك", "Alerts Needing Attention")}</h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white border p-4">
            <span className="text-xl">{alert.icon}</span>
            <div className="flex-1 min-w-[200px]">
              <p className="font-medium text-navy text-sm">{t(alert.message_ar, alert.message_en)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.time_ar}</p>
            </div>
            <Link
              href={alert.href}
              className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors"
            >
              {t("مراجعة", "Review")}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
