"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HomeHeader } from "./HomeHeader";
import { HomeAIPanel } from "./HomeAIPanel";
import { HomeMarketplacePanel } from "./HomeMarketplacePanel";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { useMarketplaceData } from "@/hooks/useMarketplace";
import { useLocale } from "@/lib/context/locale-context";
import { BRAND } from "@/lib/constants/brand";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import type { ProductSearchIntent } from "@/lib/ai/product-intent";
import type { Tailor } from "@/types";
import type { StoreFilter } from "@/lib/home/filter-stores";
import { extractCityFromMessage } from "@/lib/home/filter-stores";
import { cn } from "@/lib/utils";

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
  const [mobileTab, setMobileTab] = useState<"ai" | "stores">("ai");
  const [filter, setFilter] = useState<StoreFilter>(INITIAL_FILTER);
  const [resultsLabel, setResultsLabel] = useState<string | null>(null);

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
        setMobileTab("stores");
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
    setMobileTab("ai");
  }, []);

  return (
    <OnboardingProvider onMobileTab={setMobileTab}>
      <div id="home-experience" className="min-h-screen bg-[#050d18] text-white">
        <HomeHeader mobileTab={mobileTab} onMobileTab={setMobileTab} />

        <div className="relative mx-auto max-w-[1600px] px-3 md:px-5 lg:px-6 pb-6">
          <div className="relative overflow-hidden rounded-b-3xl pt-6 pb-5 md:pt-8 md:pb-6">
            <GeometricPattern className="text-white opacity-[0.07]" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative text-center md:text-start max-w-3xl mx-auto md:mx-0"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-arabic text-white">
                {BRAND.nameAr}
              </h1>
              <p className="mt-2 text-lg md:text-xl text-white/60 max-w-xl">
                {t("أنت تتخيّل. نحن نساعدك على تفصيله.", "You imagine it. We help tailor it.")}
              </p>
              <p className="mt-3 text-sm text-white/40 max-w-lg">
                {t(
                  "تصفّح المتاجر يمينًا، أو أخبر الذكاء ماذا تريد يسارًا.",
                  "Browse stores on the right, or tell AI what you want on the left."
                )}
              </p>
            </motion.div>
          </div>

          <div
            data-tour="home-split"
            className="mt-2 grid lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] gap-3 md:gap-4 min-h-[calc(100vh-11rem)]"
          >
            <div
              className={cn(
                "rounded-3xl border border-border/40 bg-[#f7f4ee] text-navy p-4 md:p-5 min-h-[70vh] lg:min-h-0 flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
                mobileTab === "stores" ? "flex" : "hidden lg:flex"
              )}
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
            </div>

            <div
              className={cn(
                "relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0b1f3a] to-[#071526] p-4 md:p-5 min-h-[70vh] lg:min-h-0 flex flex-col overflow-hidden",
                mobileTab === "ai" ? "flex" : "hidden lg:flex"
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-30">
                <div className="absolute -top-24 -end-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-0 start-0 h-40 w-40 rounded-full bg-omani-gold/10 blur-3xl" />
              </div>
              <div className="relative flex min-h-0 flex-1 flex-col">
                <HomeAIPanel
                  selectedStore={selectedStore}
                  onIntentChange={onIntentChange}
                  onClearStore={() => onFilterChange({ selectedTailorId: null })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingProvider>
  );
}
