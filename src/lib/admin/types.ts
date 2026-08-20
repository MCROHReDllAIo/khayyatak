import type { OrderStatus } from "@/types";

export type DateRange = "today" | "7d" | "30d" | "custom";
export type RevenueTab = "gmv" | "orders" | "customers" | "tailors";

export interface KPIItem {
  id: string;
  label_ar: string;
  label_en: string;
  value: string;
  trend: number;
  trendLabel_ar: string;
  trendLabel_en: string;
  href?: string;
}

export interface ExecutiveInsight {
  id: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  action_ar: string;
  action_en: string;
  href: string;
}

export interface CityCoverage {
  id: string;
  name_ar: string;
  name_en: string;
  tailors: number;
  orders: number;
  customers: number;
  gmv: number;
  avgOrder: number;
  topCategory: string;
  topColor: string;
  topFabric: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  aiInsight_ar: string;
  aiInsight_en: string;
}

export interface CriticalAlert {
  id: string;
  priority: "high" | "medium" | "low";
  icon: string;
  message_ar: string;
  message_en: string;
  time_ar: string;
  href: string;
}

export interface TopTailorRow {
  rank: number;
  id: string;
  name_ar: string;
  name_en: string;
  city: string;
  orders: number;
  rating: number;
  revenue: number;
  repeatRate: number;
  matchSuccess: number;
  verified: boolean;
}

export interface CustomerIntelData {
  total: number;
  new: number;
  returning: number;
  highValue: number;
  atRisk: number;
  likelyReorder: number;
  segments: Array<{ id: string; label_ar: string; label_en: string; count: number; pct: number }>;
}

export interface FashionTrendsData {
  colors: Array<{ name: string; pct: number }>;
  fabrics: Array<{ name: string; pct: number }>;
  garments: Array<{ name: string; pct: number }>;
  embroidery: Array<{ name: string; pct: number }>;
  styles: Array<{ name: string; pct: number }>;
  hasData?: boolean;
}

export interface AIAnalyticsData {
  requests: number;
  designs: number;
  measurements: number;
  matches: number;
  conversations: number;
  topFeature_ar: string;
  topFeature_en: string;
  chart: Array<{ feature: string; value: number }>;
}

export interface AIPerformanceData {
  successRate: number;
  avgResponseSec: number;
  fallbackPct: number;
  providerStatus: string;
  hasData?: boolean;
}

export interface OrderOpsData {
  active: number;
  delayed: number;
  dueToday: number;
  ready: number;
  delivered: number;
  pipeline: Array<{ status: OrderStatus; count: number }>;
}

export interface LiveStatusData {
  status: string;
  label_ar: string;
  label_en: string;
  services: string[];
}

export interface SystemHealthData {
  overall: string;
  services: Array<{ id: string; name_ar: string; name_en: string; status: "operational" | "warning" | "error" }>;
  lastChecked: string;
}

export interface NationalPanelData {
  topCity: string;
  topCategory: string;
  topFabric: string;
  topColor: string;
  seasonalDemand_ar: string;
  seasonalDemand_en: string;
  avgOrder: number;
  repeatRate: number;
  hasData?: boolean;
}

export interface ActivityItem {
  id: string;
  message_ar: string;
  message_en: string;
  time_ar: string;
}

export interface FunnelStage {
  stage: string;
  stage_ar: string;
  count: number;
  pct: number;
}

export interface InventoryIntelData {
  lowStockMerchants: number;
  criticalMaterials: string[];
  mostRequested: string[];
  forecastShortages: Array<{ material: string; merchants: number; action: string }>;
}

export interface MarketplacePerfData {
  topCategory: string;
  topCity: string;
  topProduct: string;
  avgOrder: number;
  conversion: number;
  repeatRate: number;
}
