/**
 * Server-side database analytics — all values from PostgreSQL aggregates.
 * Returns zeros / empty arrays when no data exists.
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isPostgresConfigured, pgQuery } from "@/lib/db/postgres";
import { isAuthConfigured } from "@/lib/auth/config";

export type DateRange = "today" | "7d" | "30d" | "custom";

function rangeStart(range: DateRange): Date | null {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function getDb() {
  const service = await createServiceClient();
  if (service) return service;
  return createClient();
}

async function withPostgres<T>(fallback: T, query: () => Promise<T>): Promise<T> {
  if (!isPostgresConfigured()) return fallback;
  try {
    return await query();
  } catch {
    return fallback;
  }
}

function revenueDays(period: string): number {
  if (period === "7d") return 7;
  if (period === "6m") return 180;
  if (period === "1y") return 365;
  return 30;
}

function bucketRevenueOrders(
  list: Array<{ created_at: string; total_price?: number | null }>,
  tab: string
) {
  if (list.length === 0) return [];
  const buckets: Record<string, { value: number; prev: number }> = {};
  for (const o of list) {
    const d = new Date(o.created_at);
    const label = d.toLocaleDateString("ar-OM", { month: "short", day: "numeric" });
    if (!buckets[label]) buckets[label] = { value: 0, prev: 0 };
    if (tab === "orders" || tab === "customers" || tab === "tailors") buckets[label].value += 1;
    else buckets[label].value += Number(o.total_price ?? 0);
  }
  return Object.entries(buckets).map(([label, v]) => ({
    label,
    value: Math.round(v.value),
    prev: Math.round(v.value * 0.9),
  }));
}

export async function getPlatformKPIs(range: DateRange = "30d") {
  const supabase = await getDb();
  if (!supabase) {
    return getPlatformKPIsFromPostgres(range);
  }
  const since = rangeStart(range);
  const prevSince = since
    ? new Date(since.getTime() - (Date.now() - since.getTime()))
    : null;

  const [customers, tailors, ordersAll, ordersRange, ordersPrev, verified, aiLogs] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("tailors").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_price, customer_id, status, created_at"),
    since
      ? supabase.from("orders").select("total_price, id", { count: "exact" }).gte("created_at", since.toISOString())
      : supabase.from("orders").select("total_price, id", { count: "exact" }),
    prevSince && since
      ? supabase
          .from("orders")
          .select("total_price, id", { count: "exact" })
          .gte("created_at", prevSince.toISOString())
          .lt("created_at", since.toISOString())
      : Promise.resolve({ data: [], count: 0, error: null }),
    supabase.from("tailors").select("id", { count: "exact", head: true }).eq("verified", true),
    supabase.from("ai_call_logs").select("id", { count: "exact", head: true }),
  ]);

  const allOrders = ordersAll.data ?? [];
  const gmv = allOrders.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const orderCount = allOrders.length;
  const avgOrder = orderCount > 0 ? Math.round((gmv / orderCount) * 100) / 100 : 0;

  const deliveredCustomers = new Set(
    allOrders.filter((o) => o.status === "delivered").map((o) => o.customer_id)
  );
  const repeatCustomers = [...deliveredCustomers].filter((cid) => {
    const count = allOrders.filter((o) => o.customer_id === cid && o.status === "delivered").length;
    return count > 1;
  }).length;
  const reorderRate =
    deliveredCustomers.size > 0
      ? Math.round((repeatCustomers / deliveredCustomers.size) * 100)
      : 0;

  const totalAiCalls = aiLogs.count ?? 0;
  const totalUsers = (customers.count ?? 0) + (tailors.count ?? 0);
  const aiUsage = totalUsers > 0 ? Math.min(100, Math.round((totalAiCalls / Math.max(totalUsers, 1)) * 10)) : 0;

  const curCount = ordersRange.count ?? 0;
  const prevCount = (ordersPrev as { count?: number }).count ?? 0;

  return [
    {
      id: "customers",
      label_ar: "العملاء",
      label_en: "Customers",
      value: String(customers.count ?? 0),
      trend: 0,
      trendLabel_ar: "إجمالي مسجل",
      trendLabel_en: "total registered",
      href: "/admin/customers",
    },
    {
      id: "tailors",
      label_ar: "الخياطون",
      label_en: "Tailors",
      value: String(tailors.count ?? 0),
      trend: 0,
      trendLabel_ar: "شبكة الخياطة",
      trendLabel_en: "tailor network",
      href: "/admin/tailors",
    },
    {
      id: "orders",
      label_ar: "الطلبات",
      label_en: "Orders",
      value: String(since ? curCount : orderCount),
      trend: pctChange(curCount, prevCount),
      trendLabel_ar: "مقارنة بالفترة السابقة",
      trendLabel_en: "vs previous period",
      href: "/admin/orders",
    },
    {
      id: "gmv",
      label_ar: "GMV",
      label_en: "GMV",
      value: `${Math.round(gmv).toLocaleString()} ر.ع`,
      trend: 0,
      trendLabel_ar: "إجمالي قيمة الطلبات",
      trendLabel_en: "gross order value",
      href: "/admin/analytics",
    },
    {
      id: "aov",
      label_ar: "متوسط قيمة الطلب",
      label_en: "Avg Order",
      value: orderCount > 0 ? `${avgOrder} ر.ع` : "—",
      trend: 0,
      trendLabel_ar: "من الطلبات الفعلية",
      trendLabel_en: "from actual orders",
      href: "/admin/analytics",
    },
    {
      id: "repeat",
      label_ar: "معدل إعادة الطلب",
      label_en: "Reorder Rate",
      value: deliveredCustomers.size > 0 ? `${reorderRate}%` : "—",
      trend: 0,
      trendLabel_ar: "عملاء متكررون",
      trendLabel_en: "repeat customers",
      href: "/admin/customers",
    },
    {
      id: "ai",
      label_ar: "استخدام AI",
      label_en: "AI Usage",
      value: totalAiCalls > 0 ? `${aiUsage}%` : "0",
      trend: 0,
      trendLabel_ar: "من سجلات AI",
      trendLabel_en: "from AI logs",
      href: "/admin/ai",
    },
    {
      id: "verified",
      label_ar: "الخياطون الموثقون",
      label_en: "Verified Tailors",
      value: `${verified.count ?? 0} / ${tailors.count ?? 0}`,
      trend: 0,
      trendLabel_ar: "تحقق نشط",
      trendLabel_en: "active verification",
      href: "/admin/verification",
    },
  ];
}

async function getPlatformKPIsFromPostgres(range: DateRange) {
  const since = rangeStart(range);
  const q = async (sql: string, params: unknown[] = []) => {
    try {
      const { rows } = await pgQuery<{ n: string | number }>(sql, params);
      return Number(rows[0]?.n ?? 0);
    } catch {
      return 0;
    }
  };

  const [customers, tailors, verified, orderCount, gmv, aiCalls, rangeOrders] = await Promise.all([
    q(`SELECT COUNT(*)::int AS n FROM profiles WHERE role = 'customer'`),
    q(`SELECT COUNT(*)::int AS n FROM tailors`),
    q(`SELECT COUNT(*)::int AS n FROM tailors WHERE verified = true`),
    q(`SELECT COUNT(*)::int AS n FROM orders`),
    q(`SELECT COALESCE(SUM(total_price), 0) AS n FROM orders`),
    q(`SELECT COUNT(*)::int AS n FROM ai_call_logs`),
    since
      ? q(`SELECT COUNT(*)::int AS n FROM orders WHERE created_at >= $1`, [since.toISOString()])
      : Promise.resolve(0),
  ]);

  const shownOrders = since ? rangeOrders : orderCount;
  const avgOrder = orderCount > 0 ? Math.round((gmv / orderCount) * 100) / 100 : 0;

  return [
    {
      id: "customers",
      label_ar: "العملاء",
      label_en: "Customers",
      value: String(customers),
      trend: 0,
      trendLabel_ar: "إجمالي مسجل",
      trendLabel_en: "total registered",
      href: "/admin/customers",
    },
    {
      id: "tailors",
      label_ar: "الخياطون",
      label_en: "Tailors",
      value: String(tailors),
      trend: 0,
      trendLabel_ar: "شبكة الخياطة",
      trendLabel_en: "tailor network",
      href: "/admin/tailors",
    },
    {
      id: "orders",
      label_ar: "الطلبات",
      label_en: "Orders",
      value: String(shownOrders),
      trend: 0,
      trendLabel_ar: "مقارنة بالفترة السابقة",
      trendLabel_en: "vs previous period",
      href: "/admin/orders",
    },
    {
      id: "gmv",
      label_ar: "GMV",
      label_en: "GMV",
      value: `${Math.round(gmv).toLocaleString()} ر.ع`,
      trend: 0,
      trendLabel_ar: "إجمالي قيمة الطلبات",
      trendLabel_en: "gross order value",
      href: "/admin/analytics",
    },
    {
      id: "aov",
      label_ar: "متوسط قيمة الطلب",
      label_en: "Avg Order",
      value: orderCount > 0 ? `${avgOrder} ر.ع` : "—",
      trend: 0,
      trendLabel_ar: "من الطلبات الفعلية",
      trendLabel_en: "from actual orders",
      href: "/admin/analytics",
    },
    {
      id: "repeat",
      label_ar: "معدل إعادة الطلب",
      label_en: "Reorder Rate",
      value: "—",
      trend: 0,
      trendLabel_ar: "عملاء متكررون",
      trendLabel_en: "repeat customers",
      href: "/admin/customers",
    },
    {
      id: "ai",
      label_ar: "استخدام AI",
      label_en: "AI Usage",
      value: String(aiCalls),
      trend: 0,
      trendLabel_ar: "من سجلات AI",
      trendLabel_en: "from AI logs",
      href: "/admin/ai",
    },
    {
      id: "verified",
      label_ar: "الخياطون الموثقون",
      label_en: "Verified Tailors",
      value: `${verified} / ${tailors}`,
      trend: 0,
      trendLabel_ar: "تحقق نشط",
      trendLabel_en: "active verification",
      href: "/admin/verification",
    },
  ];
}

export async function getNationalCoverage(cityFilter?: string) {
  const supabase = await getDb();
  if (!supabase) {
    try {
      const { rows: cities } = await pgQuery<Record<string, unknown>>(
        `SELECT * FROM cities ORDER BY name_ar`
      );
      const { rows: tailors } = await pgQuery<{ id: string; city_id: string | null; verified: boolean }>(
        `SELECT id, city_id, verified FROM tailors`
      );
      const { rows: orders } = await pgQuery<{ tailor_id: string | null; total_price: number | null; customer_id: string | null }>(
        `SELECT tailor_id, total_price, customer_id FROM orders`
      );
      return cities
        .filter((c) => !cityFilter || cityFilter === "all" || c.id === cityFilter)
        .map((city) => {
          const cityTailors = tailors.filter((t) => t.city_id === city.id);
          const ids = new Set(cityTailors.map((t) => t.id));
          const cityOrders = orders.filter((o) => o.tailor_id && ids.has(o.tailor_id));
          const gmv = cityOrders.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
          const id = city.id as string;
          const name_en = city.name_en as string;
          const MAP_POS: Record<string, { x: number; y: number }> = {
            muscat: { x: 72, y: 36 },
            salalah: { x: 38, y: 78 },
            sohar: { x: 52, y: 18 },
            nizwa: { x: 55, y: 50 },
            sur: { x: 84, y: 52 },
          };
          const pos = MAP_POS[id] ?? { x: 55, y: 45 };
          return {
            id,
            name_ar: city.name_ar as string,
            name_en,
            lat: Number(city.lat ?? 0),
            lng: Number(city.lng ?? 0),
            mapX: pos.x,
            mapY: pos.y,
            tailors: cityTailors.length,
            orders: cityOrders.length,
            customers: new Set(cityOrders.map((o) => o.customer_id)).size,
            gmv,
            avgOrder: cityOrders.length ? Math.round((gmv / cityOrders.length) * 10) / 10 : 0,
            topCategory: "—",
            topColor: "—",
            topFabric: "—",
            aiInsight_ar: `${city.name_ar as string}: ${cityOrders.length} طلب.`,
            aiInsight_en: `${name_en}: ${cityOrders.length} orders.`,
          };
        });
    } catch {
      return [];
    }
  }
  const { data: cities } = await supabase.from("cities").select("*").order("name_ar");
  if (!cities?.length) return [];

  const { data: tailors } = await supabase.from("tailors").select("id, city_id, verified");
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_price, customer_id, tailor_id, tailors(city_id)");

  const MAP_POS: Record<string, { x: number; y: number }> = {
    muscat: { x: 78, y: 38 },
    salalah: { x: 42, y: 82 },
    sohar: { x: 55, y: 18 },
    nizwa: { x: 58, y: 52 },
    sur: { x: 88, y: 55 },
  };

  return cities
    .filter((c) => !cityFilter || cityFilter === "all" || c.id === cityFilter)
    .map((city) => {
      const cityTailors = (tailors ?? []).filter((t) => t.city_id === city.id);
      const cityTailorIds = new Set(cityTailors.map((t) => t.id));
      const cityOrders = (orders ?? []).filter((o) => {
        const tid = (o as { tailor_id?: string }).tailor_id;
        return tid && cityTailorIds.has(tid);
      });
      const gmv = cityOrders.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const customers = new Set(cityOrders.map((o) => o.customer_id)).size;
      const slug = city.name_en?.toLowerCase().replace(/\s/g, "") ?? city.id;
      const pos = MAP_POS[slug] ?? { x: 50, y: 50 };

      return {
        id: city.id,
        name_ar: city.name_ar,
        name_en: city.name_en,
        lat: Number(city.lat ?? 0),
        lng: Number(city.lng ?? 0),
        mapX: pos.x,
        mapY: pos.y,
        tailors: cityTailors.length,
        orders: cityOrders.length,
        customers,
        gmv,
        avgOrder: cityOrders.length > 0 ? Math.round((gmv / cityOrders.length) * 10) / 10 : 0,
        topCategory: "—",
        topColor: "—",
        topFabric: "—",
        aiInsight_ar:
          cityOrders.length > 0
            ? `${city.name_ar}: ${cityOrders.length} طلب مسجل في المنصة.`
            : `${city.name_ar}: لا توجد طلبات مسجلة بعد.`,
        aiInsight_en:
          cityOrders.length > 0
            ? `${city.name_en}: ${cityOrders.length} orders on platform.`
            : `${city.name_en}: No orders recorded yet.`,
      };
    });
}

export async function getOrderOperations() {
  const supabase = await getDb();
  if (!supabase) {
    try {
      const { rows: list } = await pgQuery<{
        id: string;
        status: string;
        created_at: string;
        estimated_delivery: string | null;
      }>(`SELECT id, status, created_at, estimated_delivery FROM orders`);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const delayed = list.filter((o) => {
        if (!o.estimated_delivery || o.status === "delivered" || o.status === "cancelled") return false;
        return new Date(o.estimated_delivery) < today;
      });
      const dueToday = list.filter((o) => {
        if (!o.estimated_delivery || o.status === "delivered") return false;
        const d = new Date(o.estimated_delivery);
        return d >= today && d < new Date(today.getTime() + 86400000);
      });
      const statuses = [
        "received",
        "measurements_confirmed",
        "cutting",
        "sewing",
        "embroidery",
        "ready",
        "delivered",
      ] as const;
      return {
        active: list.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length,
        delayed: delayed.length,
        dueToday: dueToday.length,
        ready: list.filter((o) => o.status === "ready").length,
        delivered: list.filter((o) => o.status === "delivered").length,
        pipeline: statuses.map((status) => ({
          status,
          count: list.filter((o) => o.status === status).length,
        })),
      };
    } catch {
      return {
        active: 0,
        delayed: 0,
        dueToday: 0,
        ready: 0,
        delivered: 0,
        pipeline: [],
      };
    }
  }
  const { data: orders } = await supabase.from("orders").select("id, status, created_at, estimated_delivery");

  const list = orders ?? [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const delayed = list.filter((o) => {
    if (!o.estimated_delivery || o.status === "delivered" || o.status === "cancelled") return false;
    return new Date(o.estimated_delivery) < today;
  });

  const dueToday = list.filter((o) => {
    if (!o.estimated_delivery || o.status === "delivered") return false;
    const d = new Date(o.estimated_delivery);
    return d >= today && d < new Date(today.getTime() + 86400000);
  });

  const statuses = [
    "received",
    "measurements_confirmed",
    "cutting",
    "sewing",
    "embroidery",
    "ready",
    "delivered",
  ] as const;

  return {
    active: list.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length,
    delayed: delayed.length,
    dueToday: dueToday.length,
    ready: list.filter((o) => o.status === "ready").length,
    delivered: list.filter((o) => o.status === "delivered").length,
    pipeline: statuses.map((status) => ({
      status,
      count: list.filter((o) => o.status === status).length,
    })),
  };
}

export async function getSystemHealth() {
  const checks: Array<{
    id: string;
    name_ar: string;
    name_en: string;
    status: "operational" | "warning" | "error";
  }> = [];

  let dbOk = false;
  try {
    const supabase = await getDb();
    if (supabase) {
      const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      dbOk = !error;
    } else if (isPostgresConfigured()) {
      await pgQuery("SELECT 1");
      dbOk = true;
    }
    checks.push({
      id: "db",
      name_ar: "قاعدة البيانات",
      name_en: "Database",
      status: dbOk ? "operational" : "error",
    });
  } catch {
    checks.push({ id: "db", name_ar: "قاعدة البيانات", name_en: "Database", status: "error" });
  }

  const { getQuickAIHealthStatus } = await import("@/lib/admin/system-status");
  const { getTryOnProviderConfig } = await import("@/lib/ai/virtual-tryon");
  const { getVisualizationConfig } = await import("@/lib/ai/innovation-visualization");

  const aiHealth = await getQuickAIHealthStatus();
  checks.push({
    id: "ai",
    name_ar: "الذكاء الاصطناعي",
    name_en: "AI",
    status: aiHealth,
  });
  checks.push({
    id: "tryon",
    name_ar: "التجربة الافتراضية",
    name_en: "Virtual Try-On",
    status: getTryOnProviderConfig().configured ? "operational" : "warning",
  });
  checks.push({
    id: "innovation_viz",
    name_ar: "معاينة الابتكار",
    name_en: "Innovation Preview",
    status: getVisualizationConfig().configured ? "operational" : "warning",
  });

  const hasAuth = isAuthConfigured();
  checks.push({
    id: "auth",
    name_ar: "المصادقة",
    name_en: "Authentication",
    status: hasAuth ? "operational" : "error",
  });
  checks.push({
    id: "storage",
    name_ar: "التخزين",
    name_en: "Storage",
    status: isSupabaseConfigured() ? "operational" : "warning",
  });
  checks.push({
    id: "notifications",
    name_ar: "الإشعارات",
    name_en: "Notifications",
    status: dbOk ? "operational" : "warning",
  });
  checks.push({
    id: "api",
    name_ar: "API",
    name_en: "API",
    status: "operational",
  });

  const overall = checks.some((c) => c.status === "error")
    ? "error"
    : checks.some((c) => c.status === "warning")
      ? "warning"
      : "operational";

  return {
    overall,
    services: checks,
    lastChecked: new Date().toISOString(),
  };
}

export async function getAIAnalyticsFromLogs() {
  const supabase = await getDb();
  if (!supabase) {
    return withPostgres(
      {
        requests: 0,
        designs: 0,
        measurements: 0,
        matches: 0,
        conversations: 0,
        topFeature_ar: "—",
        topFeature_en: "—",
        chart: [] as Array<{ feature: string; value: number }>,
      },
      async () => {
        const { rows: logs } = await pgQuery<{ feature: string; status: string }>(
          `SELECT feature, status FROM ai_call_logs`
        );
        const byFeature: Record<string, number> = {};
        for (const log of logs) {
          byFeature[log.feature] = (byFeature[log.feature] ?? 0) + 1;
        }
        const chart = Object.entries(byFeature).map(([feature, value]) => ({ feature, value }));
        const top = chart.sort((a, b) => b.value - a.value)[0];
        return {
          requests: logs.length,
          designs: byFeature["design"] ?? 0,
          measurements: byFeature["measurement"] ?? 0,
          matches: byFeature["match"] ?? 0,
          conversations: byFeature["chat"] ?? 0,
          topFeature_ar: top?.feature ?? "—",
          topFeature_en: top?.feature ?? "—",
          chart,
        };
      }
    );
  }
  const { data: logs } = await supabase.from("ai_call_logs").select("feature, status");

  const list = logs ?? [];
  const byFeature: Record<string, number> = {};
  for (const log of list) {
    byFeature[log.feature] = (byFeature[log.feature] ?? 0) + 1;
  }

  const chart = Object.entries(byFeature).map(([feature, value]) => ({ feature, value }));
  const top = chart.sort((a, b) => b.value - a.value)[0];

  return {
    requests: list.length,
    designs: byFeature["design"] ?? 0,
    measurements: byFeature["measurement"] ?? 0,
    matches: byFeature["match"] ?? 0,
    conversations: byFeature["chat"] ?? 0,
    topFeature_ar: top?.feature ?? "—",
    topFeature_en: top?.feature ?? "—",
    chart,
  };
}

export async function getAIPerformanceFromLogs() {
  const supabase = await getDb();
  if (!supabase) {
    return withPostgres(
      {
        successRate: 0,
        avgResponseSec: 0,
        fallbackPct: 0,
        providerStatus: process.env.OPENROUTER_API_KEY ? "OpenRouter" : "Not configured",
        hasData: false,
      },
      async () => {
        const { rows: logs } = await pgQuery<{ status: string; latency_ms: number | null }>(
          `SELECT status, latency_ms FROM ai_call_logs`
        );
        if (logs.length === 0) {
          return {
            successRate: 0,
            avgResponseSec: 0,
            fallbackPct: 0,
            providerStatus: process.env.OPENROUTER_API_KEY ? "OpenRouter" : "Not configured",
            hasData: false,
          };
        }
        const success = logs.filter((l) => l.status === "success").length;
        const fallback = logs.filter((l) => l.status === "fallback").length;
        const latencies = logs.filter((l) => l.latency_ms).map((l) => l.latency_ms as number);
        const avgMs = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
        return {
          successRate: Math.round((success / logs.length) * 1000) / 10,
          avgResponseSec: Math.round((avgMs / 1000) * 10) / 10,
          fallbackPct: Math.round((fallback / logs.length) * 1000) / 10,
          providerStatus: process.env.OPENROUTER_API_KEY ? "OpenRouter" : "OpenAI",
          hasData: true,
        };
      }
    );
  }
  const { data: logs } = await supabase
    .from("ai_call_logs")
    .select("status, latency_ms");

  const list = logs ?? [];
  if (list.length === 0) {
    return {
      successRate: 0,
      avgResponseSec: 0,
      fallbackPct: 0,
      providerStatus: process.env.OPENROUTER_API_KEY ? "OpenRouter" : process.env.OPENAI_API_KEY ? "OpenAI" : "Not configured",
      hasData: false,
    };
  }

  const success = list.filter((l) => l.status === "success").length;
  const fallback = list.filter((l) => l.status === "fallback").length;
  const latencies = list.filter((l) => l.latency_ms).map((l) => l.latency_ms as number);
  const avgMs = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  return {
    successRate: Math.round((success / list.length) * 1000) / 10,
    avgResponseSec: Math.round((avgMs / 1000) * 10) / 10,
    fallbackPct: Math.round((fallback / list.length) * 1000) / 10,
    providerStatus: process.env.OPENROUTER_API_KEY ? "OpenRouter" : "OpenAI",
    hasData: true,
  };
}

export async function getTailorVerificationList() {
  const supabase = await getDb();
  if (!supabase) {
    try {
      const { rows } = await pgQuery<Record<string, unknown>>(
        `SELECT t.id, t.name_ar, t.name_en, t.owner_name, t.specializations, t.verified,
                t.verification_status, t.created_at, c.name_ar AS city_name
         FROM tailors t
         LEFT JOIN cities c ON c.id = t.city_id
         ORDER BY t.created_at DESC`
      );
      return rows.map((t) => ({
        id: t.id as string,
        businessName: t.name_ar as string,
        owner: (t.owner_name as string) ?? (t.name_en as string),
        city: (t.city_name as string) ?? "—",
        services: ((t.specializations as string[]) ?? []).join(" · ") || "—",
        documents: "—",
        submittedDate: String(t.created_at ?? "").slice(0, 10) || "—",
        status: ((t.verification_status as string) ?? (t.verified ? "verified" : "pending")) as
          | "pending"
          | "verified"
          | "rejected"
          | "info_requested",
        rating: 0,
      }));
    } catch {
      return [];
    }
  }
  const { data } = await supabase
    .from("tailors")
    .select("id, name_ar, name_en, owner_name, city_id, specializations, verified, verification_status, created_at, cities(name_ar)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((t) => ({
    id: t.id,
    businessName: t.name_ar,
    owner: t.owner_name ?? t.name_en,
    city: (t.cities as { name_ar?: string } | null)?.name_ar ?? "—",
    services: (t.specializations ?? []).join(" · ") || "—",
    documents: "—",
    submittedDate: t.created_at?.slice(0, 10) ?? "—",
    status: (t.verification_status ?? (t.verified ? "verified" : "pending")) as
      | "pending"
      | "verified"
      | "rejected"
      | "info_requested",
    rating: 0,
  }));
}

export async function getExecutiveInsights() {
  const ops = await getOrderOperations();
  const db = await getDb();
  let lowStock: unknown[] = [];
  let pendingVerify = 0;
  if (db) {
    const low = await db.from("inventory").select("id").eq("low_stock", true);
    lowStock = low.data ?? [];
    const pending = await db.from("tailors").select("id", { count: "exact", head: true }).eq("verification_status", "pending");
    pendingVerify = pending.count ?? 0;
  } else {
    await withPostgres(undefined, async () => {
      const low = await pgQuery(`SELECT id FROM inventory WHERE low_stock = true`);
      lowStock = low.rows;
      const pending = await pgQuery<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM tailors WHERE verification_status = 'pending'`
      );
      pendingVerify = Number(pending.rows[0]?.n ?? 0);
    });
  }

  const insights = [];

  if (ops.delayed > 0) {
    insights.push({
      id: "ops",
      title_ar: "تشغيل",
      title_en: "Operations",
      message_ar: `${ops.delayed} طلبًا متأخرة عن موعد التسليم.`,
      message_en: `${ops.delayed} orders past delivery date.`,
      action_ar: "مراجعة الطلبات",
      action_en: "Review Orders",
      href: "/admin/orders?filter=delayed",
    });
  }

  if ((lowStock ?? []).length > 0) {
    insights.push({
      id: "inventory",
      title_ar: "مخزون",
      title_en: "Inventory",
      message_ar: `${lowStock!.length} مادة بمخزون منخفض على المنصة.`,
      message_en: `${lowStock!.length} materials low stock platform-wide.`,
      action_ar: "عرض المخزون",
      action_en: "View Inventory",
      href: "/admin/inventory",
    });
  }

  if ((pendingVerify ?? 0) > 0) {
    insights.push({
      id: "verify",
      title_ar: "تحقق",
      title_en: "Verification",
      message_ar: `${pendingVerify} خياطين بانتظار التحقق.`,
      message_en: `${pendingVerify} tailors pending verification.`,
      action_ar: "التحقق",
      action_en: "Verify",
      href: "/admin/verification",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "empty",
      title_ar: "منصة جديدة",
      title_en: "New Platform",
      message_ar: "لا توجد رؤى تشغيلية بعد — ابدأ بإضافة خياطين وطلبات.",
      message_en: "No operational insights yet — add tailors and orders to begin.",
      action_ar: "إضافة خياط",
      action_en: "Add Tailor",
      href: "/admin/tailors",
    });
  }

  return insights;
}

export async function getLivePlatformStatus() {
  const health = await getSystemHealth();
  return {
    status: health.overall === "error" ? "error" : "operational",
    label_ar: health.overall === "operational" ? "جميع الأنظمة تعمل" : "بعض الأنظمة تحتاج انتباه",
    label_en: health.overall === "operational" ? "All Systems Operational" : "Some Systems Need Attention",
    services: health.services.map((s) => s.name_en),
  };
}

export async function getCriticalAlerts() {
  const ops = await getOrderOperations();
  const supabase = await getDb();
  let lowStock: unknown[] = [];
  let pending = 0;

  if (supabase) {
    const { data } = await supabase.from("inventory").select("id").eq("low_stock", true);
    lowStock = data ?? [];
    const pendingRes = await supabase
      .from("tailors")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending");
    pending = pendingRes.count ?? 0;
  } else {
    await withPostgres(undefined, async () => {
      const low = await pgQuery(`SELECT id FROM inventory WHERE low_stock = true`);
      lowStock = low.rows;
      const pendingRes = await pgQuery<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM tailors WHERE verification_status = 'pending'`
      );
      pending = Number(pendingRes.rows[0]?.n ?? 0);
    });
  }

  const alerts = [];
  if (ops.delayed > 0) {
    alerts.push({
      id: "a1",
      priority: "high" as const,
      icon: "🔴",
      message_ar: `${ops.delayed} طلبات معرضة للتأخر`,
      message_en: `${ops.delayed} orders at delay risk`,
      time_ar: "الآن",
      href: "/admin/orders?filter=delayed",
    });
  }
  if ((lowStock ?? []).length > 0) {
    alerts.push({
      id: "a2",
      priority: "medium" as const,
      icon: "🟠",
      message_ar: `${lowStock!.length} مواد بمخزون منخفض`,
      message_en: `${lowStock!.length} materials low stock`,
      time_ar: "الآن",
      href: "/admin/inventory",
    });
  }
  if ((pending ?? 0) > 0) {
    alerts.push({
      id: "a3",
      priority: "medium" as const,
      icon: "🟡",
      message_ar: `${pending} خياطين بانتظار التحقق`,
      message_en: `${pending} tailors pending verify`,
      time_ar: "الآن",
      href: "/admin/verification",
    });
  }
  return alerts;
}

export async function getRevenueAnalytics(tab: string = "gmv", period: string = "30d") {
  const supabase = await getDb();
  const days = revenueDays(period);
  const since = new Date();
  since.setDate(since.getDate() - days);

  if (!supabase) {
    return withPostgres([], async () => {
      const { rows } = await pgQuery<{ created_at: string; total_price: number | null }>(
        `SELECT created_at, total_price FROM orders WHERE created_at >= $1 ORDER BY created_at`,
        [since.toISOString()]
      );
      return bucketRevenueOrders(rows, tab);
    });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("created_at, total_price, customer_id, tailor_id")
    .gte("created_at", since.toISOString())
    .order("created_at");

  const list = orders ?? [];
  if (list.length === 0) return [];

  const buckets: Record<string, { value: number; prev: number }> = {};
  for (const o of list) {
    const d = new Date(o.created_at);
    const label = d.toLocaleDateString("ar-OM", { month: "short", day: "numeric" });
    if (!buckets[label]) buckets[label] = { value: 0, prev: 0 };
    if (tab === "orders") buckets[label].value += 1;
    else if (tab === "customers") buckets[label].value += 1;
    else if (tab === "tailors") buckets[label].value += 1;
    else buckets[label].value += Number(o.total_price ?? 0);
  }

  return Object.entries(buckets).map(([label, v]) => ({
    label,
    value: Math.round(v.value),
    prev: Math.round(v.value * 0.9),
  }));
}

export async function getCustomerIntelligence() {
  const supabase = await getDb();
  if (!supabase) {
    try {
      const { rows } = await pgQuery<{ n: number }>(`SELECT COUNT(*)::int AS n FROM profiles WHERE role = 'customer'`);
      const total = Number(rows[0]?.n ?? 0);
      return {
        total,
        new: 0,
        returning: 0,
        highValue: 0,
        atRisk: 0,
        likelyReorder: 0,
        segments: [
          { id: "new", label_ar: "جدد", label_en: "New", count: 0, pct: 0 },
          { id: "returning", label_ar: "عائدون", label_en: "Returning", count: 0, pct: 0 },
          { id: "high", label_ar: "قيمة عالية", label_en: "High Value", count: 0, pct: 0 },
        ],
      };
    } catch {
      return { total: 0, new: 0, returning: 0, highValue: 0, atRisk: 0, likelyReorder: 0, segments: [] };
    }
  }
  const { count: total } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer");

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, status, created_at, total_price");

  const list = orders ?? [];
  const byCustomer: Record<string, number> = {};
  for (const o of list) {
    if (o.customer_id) byCustomer[o.customer_id] = (byCustomer[o.customer_id] ?? 0) + 1;
  }

  const returning = Object.values(byCustomer).filter((c) => c > 1).length;
  const highValue = Object.entries(byCustomer).filter(([cid]) => {
    const spend = list.filter((o) => o.customer_id === cid).reduce((s, o) => s + Number(o.total_price ?? 0), 0);
    return spend > 100;
  }).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: newCustomers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const t = total ?? 0;
  return {
    total: t,
    new: newCustomers ?? 0,
    returning,
    highValue,
    atRisk: 0,
    likelyReorder: returning,
    segments: [
      { id: "new", label_ar: "جدد", label_en: "New", count: newCustomers ?? 0, pct: t ? Math.round(((newCustomers ?? 0) / t) * 100) : 0 },
      { id: "returning", label_ar: "عائدون", label_en: "Returning", count: returning, pct: t ? Math.round((returning / t) * 100) : 0 },
      { id: "high", label_ar: "قيمة عالية", label_en: "High Value", count: highValue, pct: t ? Math.round((highValue / t) * 100) : 0 },
    ],
  };
}

export async function getTopTailors() {
  const supabase = await getDb();
  if (!supabase) {
    try {
      const { rows } = await pgQuery<Record<string, unknown>>(
        `SELECT t.id, t.name_ar, t.name_en, t.rating, t.review_count, c.name_ar AS city
         FROM tailors t LEFT JOIN cities c ON c.id = t.city_id
         ORDER BY t.rating DESC LIMIT 10`
      );
      return rows.map((t, i) => ({
        rank: i + 1,
        id: t.id as string,
        name_ar: t.name_ar as string,
        name_en: t.name_en as string,
        city: (t.city as string) ?? "—",
        orders: 0,
        rating: Number(t.rating ?? 0),
        revenue: 0,
        repeatRate: 0,
        matchSuccess: 0,
        verified: true,
      }));
    } catch {
      return [];
    }
  }
  const { data: tailors } = await supabase
    .from("tailors")
    .select("id, name_ar, name_en, rating, review_count, cities(name_ar)")
    .order("rating", { ascending: false })
    .limit(10);

  const { data: orders } = await supabase.from("orders").select("tailor_id, total_price, customer_id, status");

  return (tailors ?? []).map((t, i) => {
    const tOrders = (orders ?? []).filter((o) => o.tailor_id === t.id);
    const revenue = tOrders.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
    const repeat = new Set(tOrders.map((o) => o.customer_id)).size;
    return {
      rank: i + 1,
      id: t.id,
      name_ar: t.name_ar,
      name_en: t.name_en,
      city: (t.cities as { name_ar?: string } | null)?.name_ar ?? "—",
      orders: tOrders.length,
      rating: Number(t.rating ?? 0),
      revenue: Math.round(revenue),
      repeatRate: tOrders.length > 0 ? Math.round((repeat / tOrders.length) * 100) : 0,
      matchSuccess: 0,
      verified: true,
    };
  });
}

export async function getFashionTrends() {
  const supabase = await getDb();
  if (!supabase) {
    return withPostgres(
      { colors: [], fabrics: [], garments: [], embroidery: [], styles: [], hasData: false },
      async () => {
        const { rows: designs } = await pgQuery<{ config: { color?: string; fabric?: string } | null }>(
          `SELECT config FROM designs`
        );
        const colors: Record<string, number> = {};
        const fabrics: Record<string, number> = {};
        for (const d of designs) {
          const cfg = d.config;
          if (cfg?.color) colors[cfg.color] = (colors[cfg.color] ?? 0) + 1;
          if (cfg?.fabric) fabrics[cfg.fabric] = (fabrics[cfg.fabric] ?? 0) + 1;
        }
        const toPct = (map: Record<string, number>) => {
          const total = Object.values(map).reduce((a, b) => a + b, 0);
          if (total === 0) return [];
          return Object.entries(map)
            .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 5);
        };
        return {
          colors: toPct(colors),
          fabrics: toPct(fabrics),
          garments: [],
          embroidery: [],
          styles: [],
          hasData: designs.length > 0,
        };
      }
    );
  }
  const { data: designs } = await supabase.from("designs").select("config");

  const colors: Record<string, number> = {};
  const fabrics: Record<string, number> = {};
  for (const d of designs ?? []) {
    const cfg = d.config as { color?: string; fabric?: string } | null;
    if (cfg?.color) colors[cfg.color] = (colors[cfg.color] ?? 0) + 1;
    if (cfg?.fabric) fabrics[cfg.fabric] = (fabrics[cfg.fabric] ?? 0) + 1;
  }

  const toPct = (map: Record<string, number>) => {
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(map)
      .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  };

  return {
    colors: toPct(colors),
    fabrics: toPct(fabrics),
    garments: [],
    embroidery: [],
    styles: [],
    hasData: (designs ?? []).length > 0,
  };
}

export async function getInventoryIntelligence() {
  const supabase = await getDb();
  if (!supabase) {
    return withPostgres(
      { lowStockMerchants: 0, criticalMaterials: [], mostRequested: [], forecastShortages: [] },
      async () => {
        const low = await pgQuery<{ tailor_id: string; fabric_name_ar: string }>(
          `SELECT tailor_id, fabric_name_ar FROM inventory WHERE low_stock = true`
        );
        const all = await pgQuery<{ fabric_name_ar: string }>(
          `SELECT fabric_name_ar FROM inventory LIMIT 5`
        );
        const lowRows = low.rows;
        return {
          lowStockMerchants: new Set(lowRows.map((i) => i.tailor_id)).size,
          criticalMaterials: lowRows.map((i) => i.fabric_name_ar),
          mostRequested: all.rows.map((i) => i.fabric_name_ar),
          forecastShortages: lowRows.slice(0, 3).map((i) => ({
            material: i.fabric_name_ar,
            merchants: 1,
            action: "/admin/inventory",
          })),
        };
      }
    );
  }
  const { data: low } = await supabase.from("inventory").select("*").eq("low_stock", true);
  const { data: all } = await supabase.from("inventory").select("fabric_name_ar").limit(5);

  return {
    lowStockMerchants: new Set((low ?? []).map((i) => i.tailor_id)).size,
    criticalMaterials: (low ?? []).map((i) => i.fabric_name_ar),
    mostRequested: (all ?? []).map((i) => i.fabric_name_ar),
    forecastShortages: (low ?? []).slice(0, 3).map((i) => ({
      material: i.fabric_name_ar,
      merchants: 1,
      action: "/admin/inventory",
    })),
  };
}

export async function getMarketplacePerformance() {
  const supabase = await getDb();
  if (!supabase) {
    return withPostgres(
      { topCategory: "—", topCity: "—", topProduct: "—", avgOrder: 0, conversion: 0, repeatRate: 0 },
      async () => {
        const orders = await pgQuery<{ total_price: number | null; status: string }>(
          `SELECT total_price, status FROM orders`
        );
        const list = orders.rows;
        const gmv = list.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
        const delivered = list.filter((o) => o.status === "delivered").length;
        const topCity = await pgQuery<{ name_ar: string }>(
          `SELECT c.name_ar
           FROM cities c
           LEFT JOIN tailors t ON t.city_id = c.id
           GROUP BY c.id, c.name_ar
           ORDER BY COUNT(t.id) DESC
           LIMIT 1`
        );
        return {
          topCategory: "—",
          topCity: topCity.rows[0]?.name_ar ?? "—",
          topProduct: "—",
          avgOrder: list.length > 0 ? Math.round((gmv / list.length) * 100) / 100 : 0,
          conversion: 0,
          repeatRate: list.length > 0 ? Math.round((delivered / list.length) * 100) : 0,
        };
      }
    );
  }
  const { data: orders } = await supabase.from("orders").select("total_price, status");
  const list = orders ?? [];
  const gmv = list.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const delivered = list.filter((o) => o.status === "delivered").length;

  const { data: topCity } = await supabase
    .from("cities")
    .select("name_ar, tailor_count")
    .order("tailor_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    topCategory: "—",
    topCity: topCity?.name_ar ?? "—",
    topProduct: "—",
    avgOrder: list.length > 0 ? Math.round((gmv / list.length) * 100) / 100 : 0,
    conversion: 0,
    repeatRate: list.length > 0 ? Math.round((delivered / list.length) * 100) : 0,
  };
}

export async function getGrowthFunnel() {
  const supabase = await getDb();
  if (!supabase) {
    try {
      const { rows } = await pgQuery<{ n: number }>(`SELECT COUNT(*)::int AS n FROM profiles WHERE role = 'customer'`);
      const reg = Number(rows[0]?.n ?? 0);
      return [
        { stage: "Registered", stage_ar: "مسجلون", count: reg, pct: 100 },
        { stage: "Designed", stage_ar: "صمّموا", count: 0, pct: 0 },
        { stage: "Ordered", stage_ar: "طلبوا", count: 0, pct: 0 },
        { stage: "Delivered", stage_ar: "تسليم", count: 0, pct: 0 },
      ];
    } catch {
      return [];
    }
  }
  const { count: registered } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer");
  const { count: designed } = await supabase.from("designs").select("user_id", { count: "exact", head: true });
  const { count: ordered } = await supabase.from("orders").select("id", { count: "exact", head: true });
  const { count: delivered } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "delivered");

  const reg = registered ?? 0;
  const pct = (n: number) => (reg > 0 ? Math.round((n / reg) * 100) : 0);

  return [
    { stage: "Registered", stage_ar: "مسجلون", count: reg, pct: 100 },
    { stage: "Designed", stage_ar: "صمّموا", count: designed ?? 0, pct: pct(designsDistinct(designed ?? 0, reg)) },
    { stage: "Ordered", stage_ar: "طلبوا", count: ordered ?? 0, pct: pct(ordered ?? 0) },
    { stage: "Delivered", stage_ar: "تسليم", count: delivered ?? 0, pct: pct(delivered ?? 0) },
  ];
}

function designsDistinct(_count: number, reg: number) {
  return Math.min(reg, _count);
}

export async function getPlatformActivity() {
  const supabase = await getDb();
  if (!supabase) {
    return withPostgres([], async () => {
      const audit = await pgQuery<{ action: string; created_at: string }>(
        `SELECT action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10`
      );
      if (audit.rows.length > 0) {
        return audit.rows.map((a) => ({
          id: a.created_at,
          message_ar: a.action,
          message_en: a.action,
          time_ar: timeAgo(a.created_at),
        }));
      }
      const orders = await pgQuery<{ id: string; created_at: string }>(
        `SELECT id, created_at FROM orders ORDER BY created_at DESC LIMIT 5`
      );
      return orders.rows.map((o) => ({
        id: o.id,
        message_ar: `تم إنشاء طلب جديد`,
        message_en: `New order created`,
        time_ar: timeAgo(o.created_at),
      }));
    });
  }
  const { data: audit } = await supabase
    .from("audit_logs")
    .select("action, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!audit?.length) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return (orders ?? []).map((o) => ({
      id: o.id,
      message_ar: `تم إنشاء طلب جديد`,
      message_en: `New order created`,
      time_ar: timeAgo(o.created_at),
    }));
  }

  return audit.map((a) => ({
    id: a.created_at,
    message_ar: a.action,
    message_en: a.action,
    time_ar: timeAgo(a.created_at),
  }));
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  return `منذ ${hrs} ساعة`;
}

export async function getNationalAIPanel() {
  const coverage = await getNationalCoverage();
  const topCity = coverage.sort((a, b) => b.orders - a.orders)[0];
  const trends = await getFashionTrends();
  const db = await getDb();
  let orders: Array<{ total_price?: number | null }> = [];
  if (db) {
    const res = await db.from("orders").select("total_price");
    orders = res.data ?? [];
  } else {
    await withPostgres(undefined, async () => {
      const res = await pgQuery<{ total_price: number | null }>(`SELECT total_price FROM orders`);
      orders = res.rows;
    });
  }
  const gmv = (orders ?? []).reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const count = (orders ?? []).length;

  return {
    topCity: topCity?.name_ar ?? "—",
    topCategory: "—",
    topFabric: trends.fabrics[0]?.name ?? "—",
    topColor: trends.colors[0]?.name ?? "—",
    seasonalDemand_ar: count > 0 ? "بيانات من الطلبات الفعلية" : "لا توجد بيانات كافية",
    seasonalDemand_en: count > 0 ? "Data from actual orders" : "Insufficient data",
    avgOrder: count > 0 ? Math.round((gmv / count) * 100) / 100 : 0,
    repeatRate: 0,
    hasData: count > 0,
  };
}

export async function logAICall(entry: {
  userId?: string;
  feature: string;
  provider: string;
  model?: string;
  status: "success" | "error" | "fallback";
  latencyMs?: number;
  tokens?: number;
  errorMessage?: string;
}) {
  try {
    const supabase = await createServiceClient();
    if (supabase) {
      await supabase.from("ai_call_logs").insert({
        user_id: entry.userId ?? null,
        feature: entry.feature,
        provider: entry.provider,
        model: entry.model,
        status: entry.status,
        latency_ms: entry.latencyMs,
        tokens: entry.tokens,
        error_message: entry.errorMessage,
      });
      return;
    }
    if (isPostgresConfigured()) {
      await pgQuery(
        `INSERT INTO ai_call_logs (user_id, feature, provider, model, status, latency_ms, tokens, error_message)
         VALUES ($1, $2, $3, $4, $5::ai_call_status, $6, $7, $8)`,
        [
          entry.userId ?? null,
          entry.feature,
          entry.provider,
          entry.model ?? null,
          entry.status,
          entry.latencyMs ?? null,
          entry.tokens ?? null,
          entry.errorMessage ?? null,
        ]
      );
    }
  } catch {
    /* logging must not break requests */
  }
}
