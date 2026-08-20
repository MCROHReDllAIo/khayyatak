import type { BusinessInsight, Order, InventoryItem } from "@/types";
import {
  aggregatePlatformStats,
  computeOverdueOrders,
  computeNearDueOrders,
  computeMonthlyRevenue,
  getLowStockItems,
} from "@/lib/analytics/platform-stats";

const TAILOR_ID = "t1";

export function generateBusinessInsightsFromData(
  orders: Order[],
  inventory: InventoryItem[],
  tailorId = TAILOR_ID
): BusinessInsight[] {
  const tailorOrders = orders.filter((o) => o.tailor_id === tailorId);
  const active = tailorOrders.filter((o) => o.status !== "delivered");
  const overdue = computeOverdueOrders(orders, tailorId);
  const nearDue = computeNearDueOrders(orders, tailorId);
  const lowStock = getLowStockItems(inventory);
  const stats = aggregatePlatformStats(orders);
  const revenue = computeMonthlyRevenue(tailorOrders, tailorId);

  const insights: BusinessInsight[] = [
    {
      id: "bi-weekly",
      message_ar: `لديك ${active.length} طلبًا نشطًا هذا الأسبوع.`,
      message_en: `You have ${active.length} active orders this week.`,
      type: "general",
      priority: active.length > 5 ? "high" : "medium",
    },
  ];

  const whiteOrders = tailorOrders.filter((o) => o.design.colorKey === "white").length;
  if (whiteOrders > 0) {
    const pct = Math.round((whiteOrders / Math.max(tailorOrders.length, 1)) * 100);
    insights.push({
      id: "bi-demand",
      message_ar: `الطلب على الثياب البيضاء يمثل ${pct}% من طلباتك.`,
      message_en: `White garments represent ${pct}% of your orders.`,
      type: "demand",
      priority: pct >= 30 ? "high" : "medium",
    });
  }

  if (lowStock.length > 0) {
    const item = lowStock[0];
    insights.push({
      id: "bi-inventory",
      message_ar: `مخزون ${item.fabric_name_ar} — ${item.ai_forecast_days} أيام متبقية. ${item.ai_recommendation_ar}`,
      message_en: `${item.fabric_name_en} stock — ${item.ai_forecast_days} days left.`,
      type: "inventory",
      priority: "high",
    });
  }

  if (nearDue.length > 0) {
    insights.push({
      id: "bi-customer",
      message_ar: `${nearDue.length} طلبات تسليمها خلال 48 ساعة.`,
      message_en: `${nearDue.length} orders due within 48 hours.`,
      type: "customer",
      priority: "high",
    });
  }

  const repeatCustomers = new Set(
    tailorOrders.map((o) => o.customer_id).filter((id) => tailorOrders.filter((x) => x.customer_id === id).length > 1)
  );
  if (repeatCustomers.size > 0) {
    insights.push({
      id: "bi-repeat",
      message_ar: `${repeatCustomers.size} عميلًا مرجّحًا لإعادة الطلب.`,
      message_en: `${repeatCustomers.size} customers likely to reorder.`,
      type: "customer",
      priority: "medium",
    });
  }

  insights.push({
    id: "bi-revenue",
    message_ar: `إيراداتك التجريبية: ${revenue.toFixed(1)} ر.ع — متوسط السوق ${stats.avgOrderPrice} ر.ع.`,
    message_en: `Revenue: ${revenue.toFixed(1)} OMR — market avg ${stats.avgOrderPrice} OMR.`,
    type: "pricing",
    priority: "medium",
  });

  if (overdue.length > 0) {
    insights.unshift({
      id: "bi-overdue",
      message_ar: `${overdue.length} طلبات معرضة للتأخر — أعد ترتيب الأولويات.`,
      message_en: `${overdue.length} orders at risk of delay — reprioritize.`,
      type: "general",
      priority: "high",
    });
  }

  return insights;
}

export function getDashboardActions(
  orders: Order[],
  inventory: InventoryItem[],
  tailorId = TAILOR_ID
) {
  const overdue = computeOverdueOrders(orders, tailorId);
  const lowStock = getLowStockItems(inventory);
  const stats = aggregatePlatformStats(orders.filter((o) => o.tailor_id === tailorId));

  const actions = [];

  if (overdue.length > 0) {
    actions.push({
      id: "late",
      priority: "high" as const,
      ar: `${overdue.length} طلبات معرضة للتأخر — أعد ترتيب الأولويات`,
      en: `${overdue.length} orders at risk — reprioritize`,
      href: "/tailor/orders",
    });
  }

  if (lowStock.length > 0) {
    const item = lowStock[0];
    actions.push({
      id: "inventory",
      priority: "high" as const,
      ar: `مخزون ${item.fabric_name_ar} — ${item.ai_forecast_days} أيام متبقية`,
      en: `${item.fabric_name_en} — ${item.ai_forecast_days} days left`,
      href: "/tailor/inventory",
    });
  }

  const linenDemand = stats.popularFabrics.find((f) => f.name.includes("كتان"));
  if (linenDemand) {
    actions.push({
      id: "pricing",
      priority: "medium" as const,
      ar: `فرصة تسعير — طلب مرتفع على ${linenDemand.name}`,
      en: `Pricing opportunity — ${linenDemand.name} demand up`,
      href: "/tailor/pricing",
    });
  }

  const repeatCount = new Set(orders.filter((o) => o.tailor_id === tailorId).map((o) => o.customer_id)).size;
  actions.push({
    id: "repeat",
    priority: "medium" as const,
    ar: `${repeatCount} عميلًا نشطًا — فرصة إعادة طلب`,
    en: `${repeatCount} active customers — reorder opportunity`,
    href: "/tailor/analytics",
  });

  return actions.slice(0, 4);
}

export function computeBusinessHealthScore(orders: Order[], inventory: InventoryItem[], tailorId = TAILOR_ID): number {
  let score = 75;
  const overdue = computeOverdueOrders(orders, tailorId).length;
  const lowStock = getLowStockItems(inventory).length;
  const active = orders.filter((o) => o.tailor_id === tailorId && o.status !== "delivered").length;

  score -= overdue * 5;
  score -= lowStock * 3;
  score += Math.min(active * 2, 15);
  return Math.max(40, Math.min(99, score));
}
