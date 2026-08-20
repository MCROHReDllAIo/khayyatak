"use client";

import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

interface HomeHeaderProps {
  mobileTab: "ai" | "stores";
  onMobileTab: (tab: "ai" | "stores") => void;
}

export function HomeHeader({ mobileTab, onMobileTab }: HomeHeaderProps) {
  const { t } = useLocale();
  const { isAuthenticated, authLoading, role } = useAuth();
  const dashboardHref =
    role === "admin" ? "/admin" : role === "tailor" ? "/tailor/dashboard" : "/customer";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071A33]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-white font-arabic tracking-tight">{BRAND.nameAr}</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-omani-gold/90">
            {BRAND.nameEn}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm text-white/55">
          <a href="#home-experience" className="hover:text-white transition-colors">
            {t("الرئيسية", "Home")}
          </a>
          <span className="text-white/80">{t("المتاجر", "Stores")}</span>
          <Link href="/customer/innovation" className="hover:text-white transition-colors">
            {t("ابتكار", "Innovate")}
          </Link>
          <Link href="/marketplace" className="hover:text-white transition-colors">
            {t("السوق", "Market")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex lg:hidden rounded-full bg-white/10 p-0.5">
            <button
              type="button"
              onClick={() => onMobileTab("ai")}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                mobileTab === "ai" ? "bg-white text-navy" : "text-white/70"
              )}
            >
              {t("الذكاء", "AI")}
            </button>
            <button
              type="button"
              onClick={() => onMobileTab("stores")}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                mobileTab === "stores" ? "bg-white text-navy" : "text-white/70"
              )}
            >
              {t("المتاجر", "Stores")}
            </button>
          </div>
          <LanguageSwitcher className="text-white/70 [&_button]:text-white/55 [&_button.text-primary]:text-omani-gold" />
          {authLoading ? (
            <div className="h-8 w-20 rounded-md bg-white/10 animate-pulse" />
          ) : isAuthenticated ? (
            <Link href={dashboardHref}>
              <Button size="sm" className="bg-omani-gold text-navy hover:bg-omani-gold/90 h-8">
                {t("لوحتي", "Dashboard")}
              </Button>
            </Link>
          ) : (
            <Link href="/login?signup=1">
              <Button size="sm" variant="outline" className="border-white/25 text-white hover:bg-white/10 h-8">
                {t("دخول", "Login")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
