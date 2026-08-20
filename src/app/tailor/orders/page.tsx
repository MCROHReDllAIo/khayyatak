"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types";
import { formatOMR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_FLOW: OrderStatus[] = [
  "received",
  "measurements_confirmed",
  "cutting",
  "sewing",
  "embroidery",
  "ready",
  "delivered",
];

export default function TailorOrdersPage() {
  const { t } = useLocale();
  const { orders, updateOrder } = useAppState();

  const tailorOrders = useMemo(
    () => orders.filter((o) => o.tailor_id === "t1").sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [orders]
  );

  const advanceStatus = (orderId: string, current: OrderStatus) => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx < STATUS_FLOW.length - 1) {
      updateOrder(orderId, { status: STATUS_FLOW[idx + 1] });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="editorial-title">{t("الطلبات", "Orders")}</h1>
      {tailorOrders.length === 0 ? (
        <p className="text-muted-foreground">{t("لا توجد طلبات بعد", "No orders yet")}</p>
      ) : (
        <div className="space-y-3">
          {tailorOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-border/50 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{order.customer_name ?? t("عميل", "Customer")} — {order.design.color}</p>
                <p className="text-sm text-muted-foreground">{ORDER_STATUS_LABELS[order.status].ar}</p>
                <Link href={`/customer/orders/${order.id}`} className="text-xs text-primary hover:underline">
                  #{order.id.slice(-6)}
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-primary">{formatOMR(order.total_price)}</p>
                {order.status !== "delivered" && (
                  <Button size="sm" variant="outline" onClick={() => advanceStatus(order.id, order.status)} className="gap-1">
                    {t("التالي", "Next")} <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
