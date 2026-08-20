"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/context/locale-context";
import { filterTailors, getBestMatch } from "@/lib/ai/matching";
import { useMarketplaceData } from "@/hooks/useMarketplace";
import { TailorCard } from "@/components/tailor/TailorCard";
import { MatchScoreHero } from "@/components/tailor/MatchScoreHero";

export default function TailorsPage() {
  const { t, locale } = useLocale();
  const { tailors, cities, loading } = useMarketplaceData();
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const bestMatch = useMemo(
    () => getBestMatch(tailors, { budget: maxPrice ?? 20, city_id: city || undefined }),
    [city, maxPrice, tailors]
  );

  const matches = useMemo(
    () => filterTailors(tailors, { city_id: city || undefined, maxPrice, minRating: 0 }),
    [city, maxPrice, tailors]
  );

  return (
    <div className="space-y-10 md:space-y-14">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-2">AI Matching</p>
        <h1 className="editorial-title">{t("الخياط الأنسب لك", "Your perfect tailor")}</h1>
        <p className="editorial-sub mt-3">{t("ذكاء المطابقة يحلل ذوقك وميزانيتك وموقعك", "Match intelligence analyzes your style, budget, and location")}</p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">{t("جاري التحميل...", "Loading...")}</p>
      ) : bestMatch ? (
        <MatchScoreHero
          score={bestMatch.score}
          tailorName={bestMatch.tailor.name_ar}
          reasons={bestMatch.reasons_ar}
          locale={locale}
        />
      ) : (
        <p className="text-muted-foreground">{t("لا يوجد خياطون مسجلون بعد", "No tailors registered yet")}</p>
      )}

      <div className="flex flex-wrap gap-4 items-center py-2">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">{t("كل المدن", "All cities")}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_en}</option>
          ))}
        </select>
        <select
          value={maxPrice ?? ""}
          onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">{t("كل الأسعار", "All prices")}</option>
          <option value="15">{t("حتى 15 ر.ع", "Up to 15 OMR")}</option>
          <option value="20">{t("حتى 20 ر.ع", "Up to 20 OMR")}</option>
        </select>
        <span className="text-sm text-muted-foreground">{matches.length} {t("خياط", "tailors")}</span>
      </div>

      {matches.length === 0 && !loading ? (
        <p className="text-center text-muted-foreground py-12">{t("لا توجد نتائج", "No results")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, i) => (
            <motion.div
              key={match.tailor.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <TailorCard match={match} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
