import type { Order, InventoryItem } from "@/types";
export interface PlatformStats {
  totalOrders: number;
  avgOrderPrice: number;
  monthlyOrders: number;
  activeTailors: number;
  growthPercent: number;
  ordersByCity: { city: string; orders: number }[];
  popularColors: { name: string; value: number }[];
  popularFabrics: { name: string; value: number }[];
}

export function aggregatePlatformStats(orders: Order[]): PlatformStats {
  const totalOrders = orders.length;
  const avgOrderPrice =
    totalOrders > 0 ? orders.reduce((s, o) => s + o.total_price, 0) / totalOrders : 19.2;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthlyOrders = orders.filter((o) => new Date(o.created_at).getTime() >= thirtyDaysAgo).length;

  const cityMap: Record<string, number> = {};
  orders.forEach((o) => {
    const city = o.tailor?.city ?? "مسقط";
    cityMap[city] = (cityMap[city] ?? 0) + 1;
  });

  const colorMap: Record<string, number> = {};
  const fabricMap: Record<string, number> = {};
  orders.forEach((o) => {
    colorMap[o.design.color] = (colorMap[o.design.color] ?? 0) + 1;
    fabricMap[o.design.fabric] = (fabricMap[o.design.fabric] ?? 0) + 1;
  });

  const ordersByCity = Object.entries(cityMap)
    .map(([city, count]) => ({ city, orders: count }))
    .sort((a, b) => b.orders - a.orders);

  const popularColors = Object.entries(colorMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const popularFabrics = Object.entries(fabricMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const whiteCount = orders.filter((o) => o.design.colorKey === "white").length;
  const growthPercent = totalOrders > 0 ? Math.round((whiteCount / totalOrders) * 100 * 0.23) : 23;

  return {
    totalOrders,
    avgOrderPrice: Math.round(avgOrderPrice * 10) / 10,
    monthlyOrders: monthlyOrders || totalOrders,
    activeTailors: new Set(orders.map((o) => o.tailor_id)).size,
    growthPercent: totalOrders > 0 ? Math.round((whiteCount / totalOrders) * 100) : 0,
    ordersByCity,
    popularColors,
    popularFabrics,  };
}

export function computeOverdueOrders(orders: Order[], tailorId?: string): Order[] {
  const now = Date.now();
  return orders.filter((o) => {
    if (o.status === "delivered") return false;
    if (tailorId && o.tailor_id !== tailorId) return false;
    const due = new Date(o.created_at).getTime() + o.delivery_days * 24 * 60 * 60 * 1000;
    return due < now;
  });
}

export function computeNearDueOrders(orders: Order[], tailorId?: string, withinDays = 2): Order[] {
  const now = Date.now();
  const window = withinDays * 24 * 60 * 60 * 1000;
  return orders.filter((o) => {
    if (o.status === "delivered") return false;
    if (tailorId && o.tailor_id !== tailorId) return false;
    const due = new Date(o.created_at).getTime() + o.delivery_days * 24 * 60 * 60 * 1000;
    return due >= now && due - now <= window;
  });
}

export function computeMonthlyRevenue(orders: Order[], tailorId?: string): number {
  return orders
    .filter((o) => !tailorId || o.tailor_id === tailorId)
    .reduce((s, o) => s + o.total_price, 0);
}

export function getLowStockItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter((i) => i.low_stock || i.ai_forecast_days <= 7);
}
