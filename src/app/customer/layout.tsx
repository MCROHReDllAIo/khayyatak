"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Palette,
  ShoppingBag,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/customer", icon: Home, ar: "الرئيسية", en: "Home" },
  { href: "/customer/ai", icon: Sparkles, ar: "AI", en: "AI" },
  { href: "/customer/designer", icon: Palette, ar: "التصميم", en: "Design" },
  { href: "/customer/orders", icon: ShoppingBag, ar: "الطلبات", en: "Orders" },
  { href: "/customer/profile", icon: User, ar: "حسابي", en: "Profile" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { logout } = useAuth();

  return (
    <AuthGuard role="customer">
    <div className="min-h-screen bg-omani-cream pb-20 md:pb-0">
      <header className="sticky top-[29px] z-40 bg-omani-cream/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm transition-colors",
                  pathname === item.href
                    ? "text-navy font-semibold"
                    : "text-muted-foreground hover:text-navy"
                )}
              >
                {t(item.ar, item.en)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button type="button" onClick={logout} className="p-2 text-muted-foreground hover:text-navy">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-sm border-t border-border/40">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={pathname === item.href ? 2.5 : 2} />
              {t(item.ar, item.en)}
            </Link>
          ))}
        </div>
      </nav>
    </div>
    </AuthGuard>
  );
}
