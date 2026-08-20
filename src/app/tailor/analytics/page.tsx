"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { aggregatePlatformStats } from "@/lib/analytics/platform-stats";
import { forecastDemand } from "@/lib/ai/forecasting";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { Card, CardContent } from "@/components/ui/card";

const COLORS = ["#16825B", "#C9A227", "#0B132B", "#6B7280", "#F7F3EA"];

export default function AnalyticsPage() {
  const { t } = useLocale();
  const { orders } = useAppState();
  const tailorOrders = orders.filter((o) => o.tailor_id === "t1");
  const stats = aggregatePlatformStats(tailorOrders.length ? tailorOrders : orders);
  const forecast = forecastDemand(tailorOrders.length ? tailorOrders : orders);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("التحليلات", "Analytics")}</h1>
        <p className="text-xs text-muted-foreground">{t("بيانات من قاعدة البيانات", "Data from the database")}</p>
      </div>

      <AIInsightCard title={t("توقع AI", "AI Forecast")} message={forecast.insight_ar} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">{t("الألوان الشائعة", "Popular Colors")}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.popularColors} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {stats.popularColors.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">{t("الطلبات الشهرية", "Monthly Orders")}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.ordersByCity.map((c) => ({ month: c.city, orders: c.orders }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#16825B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
