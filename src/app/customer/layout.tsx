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
  Wand2,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { CustomerOnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/customer", icon: Home, ar: "الرئيسية", en: "Home", tour: "customer-nav-home" },
  {
    href: "/customer/innovation",
    icon: Wand2,
    ar: "ابتكار",
    en: "Innovate",
    tour: "customer-nav-innovate",
  },
  { href: "/customer/ai", icon: Sparkles, ar: "AI", en: "AI", tour: "customer-nav-ai" },
  {
    href: "/customer/designer",
    icon: Palette,
    ar: "التصميم",
    en: "Design",
    tour: "customer-nav-design",
  },
  {
    href: "/customer/orders",
    icon: ShoppingBag,
    ar: "الطلبات",
    en: "Orders",
    tour: "customer-nav-orders",
  },
  { href: "/customer/profile", icon: User, ar: "حسابي", en: "Profile", tour: "customer-nav-profile" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { logout } = useAuth();
  const isCustomerHome = pathname === "/customer";

  const shell = (
    <div className="min-h-screen bg-omani-cream pb-20 md:pb-0">
      <header className="sticky top-[29px] z-40 bg-omani-cream/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo />
          <nav
            className="hidden md:flex items-center gap-6"
            data-tour="customer-nav"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tour}
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

      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-sm border-t border-border/40"
        data-tour="customer-nav"
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
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
  );

  return (
    <AuthGuard role="customer">
      {isCustomerHome ? (
        <CustomerOnboardingProvider>{shell}</CustomerOnboardingProvider>
      ) : (
        shell
      )}
    </AuthGuard>
  );
}
