"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
} from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { BRAND } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, ar: "لوحة التحكم", en: "Dashboard" },
  { href: "/admin/national-intelligence", icon: Globe2, ar: "النظرة الوطنية", en: "National View" },
  { href: "/admin/ai", icon: Sparkles, ar: "الذكاء الوطني", en: "National AI" },
  { href: "/admin/tailors", icon: Scissors, ar: "الخياطون", en: "Tailors" },
  { href: "/admin/verification", icon: ShieldCheck, ar: "التحقق", en: "Verification" },
  { href: "/admin/customers", icon: Users, ar: "العملاء", en: "Customers" },
  { href: "/admin/orders", icon: ShoppingBag, ar: "الطلبات", en: "Orders" },
  { href: "/admin/designs", icon: Palette, ar: "التصاميم", en: "Designs" },
  { href: "/admin/products", icon: Package, ar: "الأقمشة والمنتجات", en: "Products" },
  { href: "/admin/inventory", icon: Warehouse, ar: "المخزون", en: "Inventory" },
  { href: "/admin/analytics", icon: BarChart3, ar: "التحليلات", en: "Analytics" },
  { href: "/admin/ai-center", icon: Brain, ar: "الذكاء الاصطناعي", en: "AI Center" },
  { href: "/admin/notifications", icon: Bell, ar: "الإشعارات", en: "Notifications" },
  { href: "/admin/settings", icon: Settings, ar: "الإعدادات", en: "Settings" },
];

export function AdminSidebar({
  mobile,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { logout, user } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col bg-navy text-white h-full",
        mobile ? "w-full" : "w-64 shrink-0 hidden lg:flex"
      )}
    >
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="block" onClick={onNavigate}>
          <p className="text-lg font-bold tracking-tight font-arabic">{t(BRAND.nameAr, BRAND.nameEn)}</p>
          <p className="text-sm text-omani-gold font-arabic">{t(BRAND.taglineAr, BRAND.taglineEn)}</p>
          <p className="text-[10px] text-white/40 mt-2 uppercase tracking-widest">National Command</p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "bg-primary text-white font-medium shadow-lg shadow-primary/20"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.ar, item.en)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-omani-gold/20 flex items-center justify-center text-omani-gold font-bold">
            {user?.full_name_ar?.[0] ?? "م"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{t("مدير المنصة", "Platform Admin")}</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white py-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("تسجيل الخروج", "Logout")}
        </button>
      </div>
    </aside>
  );
}
