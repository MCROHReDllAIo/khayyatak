"use client";

import { Search } from "lucide-react";
import type { City, Tailor } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import { HomeStoreCard } from "./HomeStoreCard";
import {
  STORE_CATEGORIES,
  citiesWithStores,
  filterAndRankStores,
  type StoreFilter,
} from "@/lib/home/filter-stores";
import { cn } from "@/lib/utils";

interface HomeMarketplacePanelProps {
  tailors: Tailor[];
  cities: City[];
  loading: boolean;
  filter: StoreFilter;
  onFilterChange: (patch: Partial<StoreFilter>) => void;
  onSelectStore: (tailor: Tailor) => void;
  resultsLabel?: string | null;
  showcase?: boolean;
}

export function HomeMarketplacePanel({
  tailors,
  cities,
  loading,
  filter,
  onFilterChange,
  onSelectStore,
  resultsLabel,
  showcase,
}: HomeMarketplacePanelProps) {
  const { t, locale } = useLocale();
  const ranked = filterAndRankStores(tailors, cities, filter);
  const cityOptions = citiesWithStores(cities, tailors);
  const hasIntentResults = Boolean(filter.intent) && ranked.some((r) => r.highlighted);

  return (
    <section className="flex h-full min-h-0 flex-col" data-tour="home-stores">
      <header className="shrink-0 space-y-4 pb-5 border-b border-navy/8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-omani-gold">
            {showcase
              ? t("عرض تجريبي للمظهر", "Showcase for appearance")
              : t("سوق حقيقي", "Real marketplace")}
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-bold text-navy tracking-tight">
            {t("المتاجر", "Stores")}
          </h2>
          <p className="mt-1.5 text-sm text-navy/45 max-w-lg">
            {showcase
              ? t(
                  "متاجر تجريبية كثيرة لتتخيل شكل السوق — ليست حجوزات حقيقية.",
                  "Many demo stores so you can see how the market looks — not real bookings."
                )
              : t("اكتشف خياطين ومتاجر موثوقة من حولك.", "Discover trusted tailors and stores near you.")}
          </p>
        </div>

        {(resultsLabel || hasIntentResults) && (
          <div className="rounded-2xl border border-primary/20 bg-[#e8f5ef] px-3.5 py-2.5 text-xs font-medium text-primary">
            {resultsLabel ?? t("أفضل الخيارات لطلبك", "Best matches for your request")}
          </div>
        )}

        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
          <input
            value={filter.query}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder={t("ابحث: خياط، دشداشة، صلالة...", "Search: tailor, dishdasha, Salalah...")}
            className="h-12 w-full rounded-2xl border border-[#ddd5c8] bg-white ps-11 pe-4 text-sm outline-none shadow-sm focus:border-navy/25 focus:ring-2 focus:ring-navy/10 transition-[box-shadow,border-color]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 scrollbar-none overscroll-x-contain">
          {STORE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onFilterChange({ category: c.id })}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                filter.category === c.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white border border-[#ddd5c8] text-navy/70 hover:border-navy/25 hover:bg-[#faf8f4]"
              )}
            >
              {locale === "ar" ? c.ar : c.en}
            </button>
          ))}
        </div>

        {cityOptions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => onFilterChange({ cityId: "all" })}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                filter.cityId === "all" ? "bg-primary/12 text-primary" : "text-navy/40 hover:bg-navy/5"
              )}
            >
              {t("كل المدن", "All cities")}
            </button>
            {cityOptions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onFilterChange({ cityId: c.id })}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  filter.cityId === c.id ? "bg-primary/12 text-primary" : "text-navy/40 hover:bg-navy/5"
                )}
              >
                {locale === "ar" ? c.name_ar : c.name_en}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pt-5 pe-1">
        {loading ? (
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-[1.35rem] bg-navy/[0.06]" />
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <div
            data-tour="home-store-card"
            className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#ddd5c8] bg-white px-6 text-center"
          >
            <p className="text-base font-semibold text-navy">
              {t("لا نتائج لهذا البحث", "No results for this search")}
            </p>
            <p className="mt-2 text-sm text-navy/45 max-w-md">
              {t("جرّب فئة أخرى أو امسح البحث.", "Try another category or clear the search.")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3 pb-8">
            {ranked.map(({ tailor, badges, highlighted }, idx) => (
              <div key={tailor.id} {...(idx === 0 ? { "data-tour": "home-store-card" } : {})}>
                <HomeStoreCard
                  tailor={tailor}
                  badges={badges}
                  highlighted={highlighted}
                  selected={filter.selectedTailorId === tailor.id}
                  onSelect={onSelectStore}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
