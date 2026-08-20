"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RotateCcw, ShoppingBag, ChevronLeft } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth, useAppState } from "@/lib/context/app-context";
import { ORDER_STATUS_LABELS } from "@/types";
import { formatOMR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { orders, reorderFromOrder } = useAppState();
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const myOrders = orders.filter((o) => o.customer_id === user?.id);
  const deliveredOrders = myOrders.filter((o) => o.status === "delivered");
  const activeOrders = myOrders.filter((o) => o.status !== "delivered");
  const lastDelivered = deliveredOrders[0];

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    const newOrder = await reorderFromOrder(orderId);
    setReorderingId(null);
    if (newOrder) router.push(`/customer/orders/${newOrder.id}`);
  };

  return (
    <div className="space-y-8">
      <h1 className="editorial-title">{t("طلباتي", "My Orders")}</h1>

      {lastDelivered && (
        <div className="rounded-2xl border border-omani-gold/30 bg-omani-gold/5 p-5">
          <h3 className="font-bold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-omani-gold" />
            {t("إعادة الطلب", "One-Tap Reorder")}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {reorderingId
              ? t("تم تجهيز طلبك السابق...", "Preparing your previous order...")
              : t("استعادة: التصميم + المقاسات + الخياط", "Restore: design + measurements + tailor")}
          </p>
          <Button
            className="mt-4 gap-2"
            variant="gold"
            disabled={!!reorderingId}
            onClick={() => handleReorder(lastDelivered.id)}
          >
            <RotateCcw className={`h-4 w-4 ${reorderingId ? "animate-spin" : ""}`} />
            {t("إعادة الطلب", "Reorder")}
          </Button>
        </div>
      )}

      {activeOrders.length > 0 && (
        <section>
          <h2 className="font-bold text-navy mb-3">{t("الطلبات النشطة", "Active Orders")}</h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Link key={order.id} href={`/customer/orders/${order.id}`} className="block rounded-2xl border p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">#{order.id.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">{order.tailor?.name_ar} · {ORDER_STATUS_LABELS[order.status].ar}</p>
                    </div>
                  </div>
                  <div className="text-end flex items-center gap-2">
                    <p className="font-bold text-primary">{formatOMR(order.total_price)}</p>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-navy mb-3">{t("جميع الطلبات", "All Orders")}</h2>
        {myOrders.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed">
            <p className="text-muted-foreground">{t("ليس لديك طلبات بعد.", "No orders yet.")}</p>
            <Link href="/customer/designer"><Button className="mt-4">{t("ابدأ أول تصميم", "Start first design")}</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map((order) => (
              <Link key={order.id} href={`/customer/orders/${order.id}`}>
                <motion.div whileHover={{ x: -4 }} className="rounded-xl border p-4 flex justify-between">
                  <div>
                    <p className="font-medium">{order.design.color} · {order.design.fabric}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at, locale)} · {ORDER_STATUS_LABELS[order.status].ar}</p>
                  </div>
                  <p className="font-bold">{formatOMR(order.total_price)}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
