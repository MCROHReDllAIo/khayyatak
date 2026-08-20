"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BRAND } from "@/lib/constants/brand";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";

interface HomeHeaderProps {
  onOpenAi?: () => void;
}

export function HomeHeader({ onOpenAi }: HomeHeaderProps) {
  const { t } = useLocale();
  const { isAuthenticated, authLoading, role } = useAuth();
  const dashboardHref =
    role === "admin" ? "/admin" : role === "tailor" ? "/tailor/dashboard" : "/customer";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071A33]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 min-w-0">
        <Link href="/" className="flex items-center gap-2 min-w-0 shrink">
          <BrandLogo href={false} size={36} className="rounded-md bg-[#f3efe6] p-0.5" priority />
          <span className="text-base sm:text-lg font-bold text-white font-arabic tracking-tight truncate">
            {BRAND.nameAr}
          </span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-omani-gold/90">
            {BRAND.shortEn}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <a href="#home-experience" className="text-white/80 hover:text-white transition-colors">
            {t("المتاجر", "Stores")}
          </a>
          <Link href="/customer/innovation" className="hover:text-white transition-colors">
            {t("ابتكار", "Innovate")}
          </Link>
          <Link href="/marketplace" className="hover:text-white transition-colors">
            {t("السوق", "Market")}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAi}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 rounded-full border border-omani-gold/30 bg-omani-gold/10 px-3 text-xs font-medium text-omani-gold hover:bg-omani-gold/20 transition-colors"
            data-tour="home-ai-header"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("الذكاء", "AI")}
          </button>
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
