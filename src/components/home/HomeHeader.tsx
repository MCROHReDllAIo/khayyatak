"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { isAuthenticated, authLoading, role } = useAuth();
  const dashboardHref =
    role === "admin" ? "/admin" : role === "tailor" ? "/tailor/dashboard" : "/customer";

  const openInnovate = () => {
    if (authLoading) return;
    if (isAuthenticated && role && role !== "customer") {
      router.push(role === "tailor" ? "/tailor/innovation" : "/admin");
      return;
    }
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/customer/innovation")}&signup=1`);
      return;
    }
    router.push("/customer/innovation");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#0f2a4a] bg-[#071A33]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 md:px-8 lg:px-10 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 shrink rounded-xl bg-[#f3efe6] p-1"
          aria-label={BRAND.nameAr}
        >
          <BrandLogo href={false} size={34} priority />
          <span className="sr-only">{BRAND.nameAr}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm text-[#9aa6b5]">
          <a
            href="#home-experience"
            className="rounded-full px-3.5 py-1.5 text-[#e8e2d6] hover:bg-[#0c2a4d] hover:text-white transition-colors"
          >
            {t("المتاجر", "Stores")}
          </a>
          <button
            type="button"
            onClick={openInnovate}
            className="rounded-full px-3.5 py-1.5 hover:bg-[#0c2a4d] hover:text-white transition-colors"
          >
            {t("ابتكار", "Innovate")}
          </button>
          <Link
            href="/marketplace"
            className="rounded-full px-3.5 py-1.5 hover:bg-[#0c2a4d] hover:text-white transition-colors"
          >
            {t("السوق", "Market")}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAi}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 rounded-full border border-omani-gold/40 bg-[#0c2a4d] px-3 text-xs font-medium text-omani-gold hover:bg-[#12365c] transition-colors"
            data-tour="home-ai-header"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("الذكاء", "AI")}
          </button>
          <LanguageSwitcher className="text-[#9aa6b5] [&_button]:text-[#9aa6b5] [&_button.text-primary]:text-omani-gold" />
          {authLoading ? (
            <div className="h-8 w-20 rounded-md bg-[#0c2a4d] animate-pulse" />
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
                className="border-[#2a4566] bg-[#0c2a4d] text-[#e8e2d6] hover:bg-[#12365c] h-8"
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
