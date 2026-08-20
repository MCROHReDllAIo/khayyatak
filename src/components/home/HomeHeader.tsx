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
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#050d18]/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 md:px-8 lg:px-10 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 shrink rounded-xl border border-white/10 bg-white/[0.06] p-1 pe-2.5 backdrop-blur-md"
          aria-label={BRAND.nameAr}
        >
          <BrandLogo href={false} size={34} priority />
          <span className="sr-only">{BRAND.nameAr}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm text-white/50">
          <a
            href="#home-experience"
            className="rounded-full px-3.5 py-1.5 text-white/80 hover:bg-white/8 hover:text-white transition-colors"
          >
            {t("المتاجر", "Stores")}
          </a>
          <Link
            href="/customer/innovation"
            className="rounded-full px-3.5 py-1.5 hover:bg-white/8 hover:text-white transition-colors"
          >
            {t("ابتكار", "Innovate")}
          </Link>
          <Link
            href="/marketplace"
            className="rounded-full px-3.5 py-1.5 hover:bg-white/8 hover:text-white transition-colors"
          >
            {t("السوق", "Market")}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAi}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 rounded-full border border-white/15 bg-white/[0.07] px-3 text-xs font-medium text-omani-gold backdrop-blur-md hover:bg-white/[0.12] hover:border-omani-gold/35 transition-colors"
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
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/[0.04] text-white hover:bg-white/10 h-8 backdrop-blur-md"
              >
                {t("دخول", "Login")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
