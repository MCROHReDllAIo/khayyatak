"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Navigation, ArrowLeft } from "lucide-react";
import type { City, DesignConfig, TailorMatch } from "@/types";
import type { FashionIntent } from "@/lib/ai/intent";
import type { StyleDNA } from "@/lib/ai/style-dna";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { useTailorRecommendations } from "@/hooks/useTailorRecommendations";
import { TailorRailCard } from "./TailorRailCard";
import { TailorRailSkeletonList } from "./TailorRailSkeleton";
import { TailorProfileSheet } from "./TailorProfileSheet";
import { cn } from "@/lib/utils";

interface TailorDiscoveryRailProps {
  design: DesignConfig;
  intent: FashionIntent | null;
  styleDNA: StyleDNA;
  initialMatches?: TailorMatch[];
  initialCities?: City[];
  initialCityId?: string | null;
  initialCityName?: string;
  initialContextTitleAr?: string;
  initialContextTitleEn?: string;
  className?: string;
}

export function TailorDiscoveryRail({
  design,
  intent,
  styleDNA,
  initialMatches = [],
  initialCities = [],
  initialCityId = null,
  initialCityName = "صلالة",
  initialContextTitleAr,
  initialContextTitleEn,
  className,
}: TailorDiscoveryRailProps) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { measurements, setSelectedTailorId, favoriteTailorIds } = useAppState();

  const [cityId, setCityId] = useState<string | null>(initialCityId);
  const [cityName, setCityName] = useState(initialCityName);
  const [cityOpen, setCityOpen] = useState(false);
  const [sheetTailorId, setSheetTailorId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const {
    matches,
    cities,
    loading,
    contextTitleAr,
    contextTitleEn,
    contextSubtitleAr,
    contextSubtitleEn,
  } = useTailorRecommendations({
    cityId,
    design,
    intent,
    styleDNA,
    favoriteTailorIds,
    initialMatches,
    initialCities,
    initialContextTitleAr,
    initialContextTitleEn,
  });

  const cityList = cities.length ? cities : initialCities;
  const title = locale === "ar" ? contextTitleAr : contextTitleEn;
  const subtitle = locale === "ar" ? contextSubtitleAr : contextSubtitleEn;

  const marketplaceHref = useMemo(() => {
    const params = new URLSearchParams();
    if (cityId) params.set("city", cityId);
    if (design.garmentType) params.set("garment", design.garmentType);
    if (design.colorKey) params.set("color", design.colorKey);
    if (design.fabricKey) params.set("fabric", design.fabricKey);
    const qs = params.toString();
    return qs ? `/marketplace?${qs}` : "/marketplace";
  }, [cityId, design]);

  const handleCitySelect = (city: City) => {
    setCityId(city.id);
    setCityName(city.name_ar);
    setCityOpen(false);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let nearest: City | null = null;
        let minDist = Infinity;
        for (const c of cityList) {
          if (!c.lat && !c.lng) continue;
          const d = Math.hypot(c.lat - pos.coords.latitude, c.lng - pos.coords.longitude);
          if (d < minDist) {
            minDist = d;
            nearest = c;
          }
        }
        if (nearest) handleCitySelect(nearest);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const startOrder = (tailorId: string) => {
    setSelectedTailorId(tailorId);
    setSheetOpen(false);
    const hasSaved = Boolean(measurements?.chest && measurements?.height);
    router.push(hasSaved ? "/customer/checkout?saved=1" : "/customer/checkout");
  };

  const openSheet = (tailorId: string) => {
    setSheetTailorId(tailorId);
    setSheetOpen(true);
  };

  const hasTailors = matches.length > 0;
  const bestId = matches[0]?.tailor.id;

  return (
    <>
      <aside
        className={cn(
          "flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md",
          className
        )}
        aria-label={t("خياطوك", "Your tailors")}
      >
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>

          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => setCityOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
              aria-expanded={cityOpen}
              aria-haspopup="listbox"
            >
              <MapPin className="h-3.5 w-3.5 text-omani-gold" />
              {cityName}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", cityOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {cityOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  role="listbox"
                  className="absolute z-20 mt-2 min-w-[160px] rounded-xl border border-white/15 bg-navy shadow-xl py-1 overflow-hidden"
                >
                  {cityList.map((city) => (
                    <li key={city.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={city.id === cityId}
                        onClick={() => handleCitySelect(city)}
                        className={cn(
                          "w-full text-start px-4 py-2 text-sm text-white/90 hover:bg-white/10",
                          city.id === cityId && "bg-white/10 font-medium"
                        )}
                      >
                        {locale === "ar" ? city.name_ar : city.name_en}
                      </button>
                    </li>
                  ))}
                  <li className="border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={locating}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-omani-gold hover:bg-white/10 disabled:opacity-50"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      {locating ? t("جاري تحديد الموقع...", "Locating...") : t("استخدم موقعي", "Use my location")}
                    </button>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 p-3 min-h-0">
          {loading && matches.length === 0 ? (
            <TailorRailSkeletonList count={2} />
          ) : !hasTailors ? (
            <div className="rounded-xl border border-dashed border-white/15 p-6 text-center space-y-3">
              <p className="text-sm text-white/70">
                {cityId
                  ? t("لم نجد خياطين قريبين منك بعد.", "No tailors found near you yet.")
                  : t("لم ينضم أي خياط في منطقتك بعد.", "No tailors have joined your area yet.")}
              </p>
              <Link
                href="/marketplace"
                className="inline-block text-sm font-medium text-omani-gold hover:underline"
              >
                {t("استكشف الخياطين في عمان", "Explore tailors in Oman")}
              </Link>
              <button
                type="button"
                onClick={() => setCityOpen(true)}
                className="block w-full text-xs text-white/50 hover:text-white/80"
              >
                {t("غيّر المدينة", "Change city")}
              </button>
            </div>
          ) : (
            <>
              {/* Desktop: vertical stack */}
              <div className="hidden md:flex flex-col gap-3 max-h-[520px] overflow-y-auto scrollbar-thin pe-1">
                {matches.slice(0, 3).map((match, i) => (
                  <TailorRailCard
                    key={match.tailor.id}
                    match={match}
                    isBestMatch={i === 0 && match.score > 0}
                    onViewProfile={() => openSheet(match.tailor.id)}
                    onStartOrder={() => startOrder(match.tailor.id)}
                  />
                ))}
              </div>

              {/* Mobile: horizontal snap rail */}
              <div className="md:hidden relative">
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-none">
                  {matches.map((match) => (
                    <TailorRailCard
                      key={match.tailor.id}
                      match={match}
                      isBestMatch={match.tailor.id === bestId && match.score > 0}
                      compact
                      onViewProfile={() => openSheet(match.tailor.id)}
                      onStartOrder={() => startOrder(match.tailor.id)}
                    />
                  ))}
                </div>
                {matches.length > 1 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {matches.slice(0, Math.min(matches.length, 5)).map((m) => (
                      <span
                        key={m.tailor.id}
                        className={cn(
                          "h-1 rounded-full transition-all",
                          m.tailor.id === bestId ? "w-4 bg-omani-gold" : "w-1 bg-white/25"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <Link
            href={marketplaceHref}
            className="flex items-center justify-center gap-1 text-sm font-medium text-omani-gold hover:text-omani-gold/80 transition-colors"
          >
            {t("عرض جميع الخياطين", "View all tailors")}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </aside>

      <TailorProfileSheet
        tailorId={sheetTailorId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStartOrder={startOrder}
        design={design}
        intent={intent}
        styleDNA={styleDNA}
      />
    </>
  );
}
