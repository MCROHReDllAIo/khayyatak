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
}

export function HomeMarketplacePanel({
  tailors,
  cities,
  loading,
  filter,
  onFilterChange,
  onSelectStore,
  resultsLabel,
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
            {t("سوق حقيقي", "Real marketplace")}
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-bold text-navy tracking-tight">
            {t("المتاجر", "Stores")}
          </h2>
          <p className="mt-1.5 text-sm text-navy/45 max-w-lg">
            {t("اكتشف خياطين ومتاجر موثوقة من حولك.", "Discover trusted tailors and stores near you.")}
          </p>
        </div>

        {(resultsLabel || hasIntentResults) && (
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] px-3.5 py-2.5 text-xs font-medium text-primary backdrop-blur-sm">
            {resultsLabel ?? t("أفضل الخيارات لطلبك", "Best matches for your request")}
          </div>
        )}

        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
          <input
            value={filter.query}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder={t("ابحث: خياط، دشداشة، صلالة...", "Search: tailor, dishdasha, Salalah...")}
            className="h-12 w-full rounded-2xl border border-navy/8 bg-white/70 ps-11 pe-4 text-sm outline-none shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-md focus:border-navy/20 focus:ring-2 focus:ring-navy/8 transition-[box-shadow,border-color]"
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
                  : "bg-white/55 border border-navy/8 text-navy/65 hover:border-navy/20 hover:bg-white/80 backdrop-blur-sm"
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
            className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-navy/15 bg-white/45 px-6 text-center backdrop-blur-sm"
          >
            <p className="text-base font-semibold text-navy">
              {t("ستظهر المتاجر هنا عند انضمامها إلى خياطك.", "Stores will appear here as they join Khayyatak.")}
            </p>
            <p className="mt-2 text-sm text-navy/45 max-w-md">
              {t(
                "لا نعرض متاجر وهمية. كن أول من يكتشف المنصة.",
                "We never invent stores. Be among the first to explore."
              )}
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
