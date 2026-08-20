"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { OrderTimeline } from "@/components/customer/OrderTimeline";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { getOrderTimeline, formatOMR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();
  const { orders } = useAppState();
  const order = orders.find((o) => o.id === id) ?? orders[0];

  if (!order) {
    return <p>{t("الطلب غير موجود", "Order not found")}</p>;
  }

  const timeline = getOrderTimeline(order.status, order.created_at);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/customer/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t("العودة للطلبات", "Back to orders")}
      </Link>

      <h1 className="text-2xl font-bold text-navy">{t("تتبع الطلب", "Track Order")} #{order.id.slice(-6)}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <OrderTimeline steps={timeline} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 flex flex-col items-center">
              <GarmentPreview design={order.design} size="sm" />
              <div className="mt-4 text-center w-full">
                <p className="font-bold">{order.design.color} • {order.design.fabric}</p>
                <p className="text-sm text-muted-foreground">{order.tailor?.name_ar}</p>
                <p className="text-lg font-bold text-primary mt-2">{formatOMR(order.total_price)}</p>
              </div>
            </CardContent>
          </Card>

          {order.status === "delivered" && (
            <Link href="/customer/orders">
              <Button className="w-full">{t("إعادة الطلب", "Reorder")}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
