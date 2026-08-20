"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/context/app-context";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR } from "@/lib/utils";
import { computeOverdueOrders, computeNearDueOrders } from "@/lib/analytics/platform-stats";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminOrdersPage() {
  const { t } = useLocale();
  const { orders } = useAppState();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const status = searchParams.get("status") as OrderStatus | null;

  const filtered = useMemo(() => {
    if (status) return orders.filter((o) => o.status === status);
    if (filter === "delayed") return computeOverdueOrders(orders);
    if (filter === "due") return computeNearDueOrders(orders, undefined, 1);
    if (filter === "ready") return orders.filter((o) => o.status === "ready");
    if (filter === "delivered") return orders.filter((o) => o.status === "delivered");
    return orders;
  }, [orders, filter, status]);

  const title = status
    ? t(ORDER_STATUS_LABELS[status].ar, ORDER_STATUS_LABELS[status].en)
    : filter === "delayed"
      ? t("طلبات متأخرة", "Delayed Orders")
      : filter === "due"
        ? t("مستحقة اليوم", "Due Today")
        : t("جميع الطلبات", "All Orders");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} {t("طلب", "orders")}</p>
      </div>
      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{t("لا توجد طلبات بعد", "No orders yet")}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4 flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium">{order.customer_name ?? order.customer_id}</span>
                  <span className="text-muted-foreground"> → {order.tailor?.name_ar ?? order.tailor_id}</span>
                  <span className={cn("ms-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary")}>
                    {t(ORDER_STATUS_LABELS[order.status].ar, ORDER_STATUS_LABELS[order.status].en)}
                  </span>
                </div>
                <span className="font-bold">{formatOMR(order.total_price)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
