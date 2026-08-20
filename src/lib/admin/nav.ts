import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Globe2,
  Sparkles,
  Scissors,
  ShieldCheck,
  Users,
  ShoppingBag,
  Palette,
  Package,
  Warehouse,
  BarChart3,
  Brain,
  Bell,
  Settings,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  ar: string;
  en: string;
  group: "main" | "operations" | "intelligence" | "system";
  keywords?: string[];
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", icon: LayoutDashboard, ar: "لوحة التحكم", en: "Dashboard", group: "main", keywords: ["dashboard", "home"] },
  { href: "/admin/national-intelligence", icon: Globe2, ar: "النظرة الوطنية", en: "National View", group: "main", keywords: ["national", "coverage", "map"] },
  { href: "/admin/ai", icon: Sparkles, ar: "الذكاء الوطني", en: "National AI", group: "main", keywords: ["ai", "national"] },
  { href: "/admin/tailors", icon: Scissors, ar: "الخياطون", en: "Tailors", group: "operations", keywords: ["tailor", "خياط"] },
  { href: "/admin/verification", icon: ShieldCheck, ar: "التحقق", en: "Verification", group: "operations", keywords: ["verify", "approval"] },
  { href: "/admin/customers", icon: Users, ar: "العملاء", en: "Customers", group: "operations", keywords: ["customer", "client", "عميل"] },
  { href: "/admin/orders", icon: ShoppingBag, ar: "الطلبات", en: "Orders", group: "operations", keywords: ["order", "طلب"] },
  { href: "/admin/designs", icon: Palette, ar: "التصاميم", en: "Designs", group: "operations", keywords: ["design", "تصميم"] },
  { href: "/admin/products", icon: Package, ar: "الأقمشة والمنتجات", en: "Products", group: "operations", keywords: ["product", "fabric", "قماش"] },
  { href: "/admin/inventory", icon: Warehouse, ar: "المخزون", en: "Inventory", group: "operations", keywords: ["inventory", "stock", "مخزون"] },
  { href: "/admin/analytics", icon: BarChart3, ar: "التحليلات", en: "Analytics", group: "intelligence", keywords: ["analytics", "stats", "تحليل"] },
  { href: "/admin/ai-center", icon: Brain, ar: "الذكاء الاصطناعي", en: "AI Center", group: "intelligence", keywords: ["ai", "command", "openrouter"] },
  { href: "/admin/notifications", icon: Bell, ar: "الإشعارات", en: "Notifications", group: "intelligence", keywords: ["notification", "alert"] },
  { href: "/admin/settings", icon: Settings, ar: "الإعدادات", en: "Settings", group: "system", keywords: ["settings", "config", "env"] },
];

export const ADMIN_NAV_GROUPS: Array<{ id: AdminNavItem["group"]; ar: string; en: string }> = [
  { id: "main", ar: "الرئيسية", en: "Main" },
  { id: "operations", ar: "العمليات", en: "Operations" },
  { id: "intelligence", ar: "الذكاء والتحليل", en: "Intelligence" },
  { id: "system", ar: "النظام", en: "System" },
];

/** Longest-prefix match so /admin/ai-center does not also highlight /admin/ai */
export function getAdminActiveHref(pathname: string): string {
  let best = "";
  for (const item of ADMIN_NAV) {
    const matches =
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
    if (matches && item.href.length > best.length) best = item.href;
  }
  return best;
}

export function searchAdminNav(query: string, locale: "ar" | "en"): AdminNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ADMIN_NAV.filter((item) => {
    const label = (locale === "ar" ? item.ar : item.en).toLowerCase();
    const keywords = item.keywords?.join(" ") ?? "";
    return label.includes(q) || item.href.toLowerCase().includes(q) || keywords.includes(q);
  }).slice(0, 6);
}
