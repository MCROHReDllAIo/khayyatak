"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  DollarSign,
  Package,
  BarChart3,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/tailor/dashboard", icon: LayoutDashboard, ar: "لوحة التحكم", en: "Dashboard" },
  { href: "/tailor/ai", icon: Sparkles, ar: "مساعد AI", en: "AI Brain" },
  { href: "/tailor/orders", icon: ShoppingBag, ar: "الطلبات", en: "Orders" },
  { href: "/tailor/pricing", icon: DollarSign, ar: "التسعير", en: "Pricing" },
  { href: "/tailor/inventory", icon: Package, ar: "المخزون", en: "Inventory" },
  { href: "/tailor/analytics", icon: BarChart3, ar: "التحليلات", en: "Analytics" },
  { href: "/tailor/quality", icon: Sparkles, ar: "الجودة", en: "Quality" },
  { href: "/tailor/marketing", icon: Sparkles, ar: "التسويق", en: "Marketing" },
  { href: "/tailor/products", icon: Package, ar: "المنتجات", en: "Products" },
];

export default function TailorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { logout } = useAuth();

  return (
    <AuthGuard role="tailor">
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed top-[29px] bottom-0 start-0 w-64 bg-navy text-white hidden lg:block z-30">
        <div className="p-5 border-b border-white/10">
          <Logo variant="light" />
          <p className="text-xs text-white/50 mt-2">{t("لوحة الخياط", "Tailor Dashboard")}</p>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === item.href
                  ? "bg-primary text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.ar, item.en)}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:ms-64">
        <header className="sticky top-[29px] z-40 bg-white border-b px-4 h-14 flex items-center justify-between">
          <div className="lg:hidden"><Logo /></div>
          <div className="flex items-center gap-2 ms-auto">
            <LanguageSwitcher />
            <button onClick={logout} className="p-2 text-muted-foreground"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="p-4 md:p-6 max-w-7xl">{children}</main>
      </div>
    </div>
    </AuthGuard>
  );
}
