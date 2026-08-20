"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HomeHeader } from "./HomeHeader";
import { HomeMarketplacePanel } from "./HomeMarketplacePanel";
import { HomeAIConcierge } from "./HomeAIConcierge";
import { HomeAtmosphere } from "./HomeAtmosphere";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { useMarketplaceData } from "@/hooks/useMarketplace";
import { useLocale } from "@/lib/context/locale-context";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { ProductSearchIntent } from "@/lib/ai/product-intent";
import type { Tailor } from "@/types";
import type { StoreFilter } from "@/lib/home/filter-stores";
import { extractCityFromMessage } from "@/lib/home/filter-stores";

const INITIAL_FILTER: StoreFilter = {
  category: "all",
  cityId: "all",
  query: "",
  intent: null,
  selectedTailorId: null,
  highlightTailorIds: [],
};

export function HomeExperience() {
  const { t } = useLocale();
  const { tailors, cities, loading } = useMarketplaceData();
  const [filter, setFilter] = useState<StoreFilter>(INITIAL_FILTER);
  const [resultsLabel, setResultsLabel] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const selectedStore = useMemo(
    () => tailors.find((x) => x.id === filter.selectedTailorId) ?? null,
    [tailors, filter.selectedTailorId]
  );

  const onFilterChange = useCallback((patch: Partial<StoreFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
  }, []);

  const onIntentChange = useCallback(
    (intent: ProductSearchIntent | null, highlightTailorIds: string[]) => {
      const city = intent ? extractCityFromMessage(intent.rawMessage, cities) : null;
      setFilter((f) => ({
        ...f,
        intent,
        highlightTailorIds,
        cityId: city?.id ?? f.cityId,
        category:
          intent?.category === "abaya"
            ? "abaya"
            : intent?.category === "dishdasha"
              ? "dishdasha"
              : f.category,
      }));
      if (intent) {
        setResultsLabel(t("نتائج مناسبة لطلبك", "Results for your request"));
      } else {
        setResultsLabel(null);
      }
    },
    [cities, t]
  );

  const onSelectStore = useCallback((tailor: Tailor) => {
    setFilter((f) => ({
      ...f,
      selectedTailorId: f.selectedTailorId === tailor.id ? null : tailor.id,
    }));
    setAiOpen(true);
  }, []);

  return (
    <OnboardingProvider onOpenAi={() => setAiOpen(true)} onCloseAi={() => setAiOpen(false)}>
      <div
        id="home-experience"
        className="relative min-h-screen min-h-[100dvh] text-white overflow-x-hidden"
      >
        <HomeAtmosphere />

        <div className="relative z-10">
          <HomeHeader onOpenAi={() => setAiOpen(true)} />

          <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 md:px-8 lg:px-10 pb-[7.5rem] sm:pb-28 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-start gap-4 pt-7 pb-6 sm:pt-9 sm:pb-8 md:flex-row md:items-center md:gap-6"
              data-tour="home-split"
            >
              <div className="shrink-0 rounded-2xl bg-[#f3efe6] p-2.5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)]">
                <BrandLogo href={false} size={80} priority />
              </div>
              <div className="min-w-0 max-w-xl">
                <p className="text-base sm:text-lg md:text-xl text-[#e8e2d6] leading-relaxed">
                  {t("أنت تتخيّل. نحن نساعدك على تفصيله.", "You imagine it. We help tailor it.")}
                </p>
                <p className="mt-2 text-sm text-[#9aa6b5] leading-relaxed max-w-md">
                  {t(
                    "تصفّح المتاجر الحقيقية، واستعن بمستشارك الذكي متى احتجت.",
                    "Browse real stores, and open your AI concierge whenever you need it."
                  )}
                </p>
              </div>
            </motion.div>

            {/* Solid cream surface — opaque, brand-aligned */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-h-[62vh] sm:min-h-[70vh] overflow-hidden rounded-[1.5rem] sm:rounded-[1.85rem] border border-[#e4ddd0] bg-[#f7f4ee] text-navy shadow-[0_28px_70px_-36px_rgba(0,0,0,0.55)]"
            >
              <div className="relative p-4 sm:p-6 md:p-8 lg:p-9">
                <HomeMarketplacePanel
                  tailors={tailors}
                  cities={cities}
                  loading={loading}
                  filter={filter}
                  onFilterChange={onFilterChange}
                  onSelectStore={onSelectStore}
                  resultsLabel={resultsLabel}
                />
              </div>
            </motion.div>
          </div>
        </div>

        <HomeAIConcierge
          open={aiOpen}
          onOpenChange={setAiOpen}
          selectedStore={selectedStore}
          onIntentChange={onIntentChange}
          onClearStore={() => onFilterChange({ selectedTailorId: null })}
        />
      </div>
    </OnboardingProvider>
  );
}
