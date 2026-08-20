"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HomeHeader } from "./HomeHeader";
import { HomeMarketplacePanel } from "./HomeMarketplacePanel";
import { HomeAIConcierge } from "./HomeAIConcierge";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { useMarketplaceData } from "@/hooks/useMarketplace";
import { useLocale } from "@/lib/context/locale-context";
import { BRAND } from "@/lib/constants/brand";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
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
      <div id="home-experience" className="min-h-screen min-h-[100dvh] bg-[#050d18] text-white overflow-x-hidden">
        <HomeHeader onOpenAi={() => setAiOpen(true)} />

        <div className="relative mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8 pb-[7.5rem] sm:pb-28 md:pb-24">
          <div className="relative overflow-hidden pt-6 pb-6 sm:pt-8 sm:pb-8 md:pt-10 md:pb-10">
            <GeometricPattern className="text-white opacity-[0.06]" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-2xl pe-1"
              data-tour="home-split"
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-omani-gold/90 mb-3">
                {BRAND.nameEn}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight font-arabic text-white leading-[1.15] break-words">
                {BRAND.nameAr}
              </h1>
              <p className="mt-3 text-base sm:text-lg md:text-xl text-white/55 max-w-xl leading-relaxed">
                {t("أنت تتخيّل. نحن نساعدك على تفصيله.", "You imagine it. We help tailor it.")}
              </p>
              <p className="mt-3 text-sm text-white/35 max-w-lg leading-relaxed">
                {t(
                  "تصفّح المتاجر الحقيقية، واستعن بمستشارك الذكي متى احتجت.",
                  "Browse real stores, and open your AI concierge whenever you need it."
                )}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl sm:rounded-[1.75rem] border border-white/10 bg-[#f7f4ee] text-navy p-4 sm:p-5 md:p-7 lg:p-8 min-h-[60vh] sm:min-h-[70vh] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)] overflow-hidden"
          >
            <HomeMarketplacePanel
              tailors={tailors}
              cities={cities}
              loading={loading}
              filter={filter}
              onFilterChange={onFilterChange}
              onSelectStore={onSelectStore}
              resultsLabel={resultsLabel}
            />
          </motion.div>
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
