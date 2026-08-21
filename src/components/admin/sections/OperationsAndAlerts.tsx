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

export function OperationsCenter({ data }: { data: OrderOpsData }) {
  const { t } = useLocale();

  const stats = [
    { label_ar: "طلبات نشطة", label_en: "Active Orders", value: data.active, href: "/admin/orders" },
    { label_ar: "متأخرة", label_en: "Delayed", value: data.delayed, href: "/admin/orders?filter=delayed", warn: true },
    { label_ar: "مستحقة اليوم", label_en: "Due Today", value: data.dueToday, href: "/admin/orders?filter=due" },
    { label_ar: "جاهزة", label_en: "Ready", value: data.ready, href: "/admin/orders?filter=ready" },
    { label_ar: "مُسلّمة", label_en: "Delivered", value: data.delivered, href: "/admin/orders?filter=delivered" },
  ];

  const pipeline =
    data.pipeline.length > 0
      ? data.pipeline
      : (Object.keys(PIPELINE_SHORT) as OrderStatus[]).map((status) => ({ status, count: 0 }));

  return (
    <section className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-[0_18px_48px_-32px_rgba(7,26,51,0.45)] md:p-8">
      <h2 className="text-2xl font-bold text-navy">{t("مركز العمليات", "Operations Center")}</h2>
      <p className="mb-6 text-sm text-navy/45">{t("متابعة الطلبات في الوقت الفعلي", "Real-time order operations")}</p>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label_en}
            href={s.href}
            className={cn(
              "rounded-2xl border p-4 text-center transition-all hover:shadow-md",
              s.warn ? "border-amber-200 bg-amber-50/50" : "border-navy/8 bg-[#f7f4ee]/60"
            )}
          >
            <p className="text-2xl font-bold text-navy">{s.value}</p>
            <p className="mt-1 text-xs text-navy/45">{t(s.label_ar, s.label_en)}</p>
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-2">
          {pipeline.map((stage) => (
            <Link
              key={stage.status}
              href={`/admin/orders?status=${stage.status}`}
              className="group min-w-[96px] flex-1"
            >
              <div className="h-full rounded-xl border border-navy/8 bg-white p-3 text-center transition-all hover:border-primary hover:shadow-md">
                <p className="text-lg font-bold text-primary">{stage.count}</p>
                <p className="mt-1 text-[10px] leading-tight text-navy/45">
                  {t(PIPELINE_SHORT[stage.status].ar, PIPELINE_SHORT[stage.status].en)}
                </p>
              </div>
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
