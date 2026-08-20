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
      <header className="shrink-0 space-y-3 border-b border-border/40 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-omani-gold">
            {t("سوق حقيقي", "Real marketplace")}
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-bold text-navy tracking-tight">
            {t("المتاجر", "Stores")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("اكتشف خياطين ومتاجر موثوقة من حولك.", "Discover trusted tailors and stores near you.")}
          </p>
        </div>

        {(resultsLabel || hasIntentResults) && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
            {resultsLabel ?? t("أفضل الخيارات لطلبك", "Best matches for your request")}
          </div>
        )}

        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter.query}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder={t("ابحث: خياط، دشداشة، صلالة...", "Search: tailor, dishdasha, Salalah...")}
            className="h-11 w-full rounded-xl border border-border/60 bg-white ps-10 pe-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none overscroll-x-contain">
          {STORE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onFilterChange({ category: c.id })}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter.category === c.id
                  ? "bg-navy text-white"
                  : "bg-white border border-border/60 text-navy/70 hover:border-navy/30"
              )}
            >
              {locale === "ar" ? c.ar : c.en}
            </button>
          ))}
        </div>

        {cityOptions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onFilterChange({ cityId: "all" })}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium",
                filter.cityId === "all" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
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
                  "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium",
                  filter.cityId === c.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {locale === "ar" ? c.name_ar : c.name_en}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pt-4 pe-1">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <div
            data-tour="home-store-card"
            className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white/70 px-6 text-center"
          >
            <p className="text-base font-semibold text-navy">
              {t("ستظهر المتاجر هنا عند انضمامها إلى خياطك.", "Stores will appear here as they join Khayyatak.")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              {t(
                "لا نعرض متاجر وهمية. كن أول من يكتشف المنصة.",
                "We never invent stores. Be among the first to explore."
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-8">
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
