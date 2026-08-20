"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { BRAND } from "@/lib/constants/brand";
import { Search, Sparkles, Heart, ArrowUpDown } from "lucide-react";
import { MARKETPLACE_CATEGORIES } from "@/lib/knowledge/fashion";
import { filterTailors } from "@/lib/ai/matching";
import { useMarketplaceData } from "@/hooks/useMarketplace";
import { TailorCard } from "@/components/tailor/TailorCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";

type SortKey = "score" | "price" | "rating" | "delivery";

export default function MarketplacePage() {
  const { t, locale } = useLocale();
  const { favoriteTailorIds, toggleFavoriteTailor } = useAppState();
  const { tailors, cities, loading: marketLoading } = useMarketplaceData();
  const [category, setCategory] = useState<"men" | "women" | "children">("men");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const matches = useMemo(() => {
    let m = filterTailors(tailors, { city_id: city || undefined, minRating: 0, maxPrice });
    if (search) {
      m = m.filter(
        (x) =>
          x.tailor.name_ar.includes(search) ||
          x.tailor.name_en.toLowerCase().includes(search.toLowerCase()) ||
          x.tailor.specializations_ar.some((s) => s.includes(search))
      );
    }
    if (favoritesOnly) {
      m = m.filter((x) => favoriteTailorIds.includes(x.tailor.id));
    }
    m = [...m].sort((a, b) => {
      if (sort === "price") return a.tailor.starting_price - b.tailor.starting_price;
      if (sort === "rating") return b.tailor.rating - a.tailor.rating;
      if (sort === "delivery") return a.tailor.delivery_days - b.tailor.delivery_days;
      return b.score - a.score;
    });
    return m;
  }, [city, search, sort, favoritesOnly, maxPrice, favoriteTailorIds, tailors]);

  return (
    <div className="min-h-screen bg-omani-cream/30">
      <header className="sticky top-[29px] z-40 glass border-b px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex-1 max-w-md relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("ابحث: دشداشة، خياط، صلالة...", "Search tailors...")}
              className="ps-9"
            />
          </div>
          <Link href="/login"><Button size="sm">{t("دخول", "Login")}</Button></Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            {t(BRAND.marketplaceAr, BRAND.marketplaceEn)}
          </h1>
          <p className="text-muted-foreground mt-1">{t("اكتشف أفضل الخياطين في عُمان", "Discover Oman's best tailors")}</p>
        </div>

        <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <TabsList>
            {(Object.keys(MARKETPLACE_CATEGORIES) as Array<keyof typeof MARKETPLACE_CATEGORIES>).map((key) => (
              <TabsTrigger key={key} value={key}>
                {locale === "ar" ? MARKETPLACE_CATEGORIES[key].ar : MARKETPLACE_CATEGORIES[key].en}
              </TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(MARKETPLACE_CATEGORIES) as Array<keyof typeof MARKETPLACE_CATEGORIES>).map((key) => (
            <TabsContent key={key} value={key}>
              <div className="flex flex-wrap gap-2 mb-4">
                {MARKETPLACE_CATEGORIES[key].items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSearch(item)}
                    className="text-xs px-3 py-1 rounded-full bg-white border hover:border-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex flex-wrap gap-3 items-center">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">{t("كل المدن", "All cities")}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_en}</option>
            ))}
          </select>
          <select value={maxPrice ?? ""} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">{t("كل الأسعار", "All prices")}</option>
            <option value="15">{t("حتى 15 ر.ع", "Up to 15")}</option>
            <option value="20">{t("حتى 20 ر.ع", "Up to 20")}</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="score">{t("أفضل تطابق", "Best match")}</option>
            <option value="price">{t("السعر", "Price")}</option>
            <option value="rating">{t("التقييم", "Rating")}</option>
            <option value="delivery">{t("التسليم", "Delivery")}</option>
          </select>
          <Button
            variant={favoritesOnly ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Heart className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
            {t("المفضلة", "Favorites")}
          </Button>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> {matches.length} {t("نتيجة", "results")}
          </span>
        </div>

        {marketLoading ? (
          <p className="text-center text-muted-foreground py-16">{t("جاري التحميل...", "Loading...")}</p>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed">
            <p className="text-muted-foreground">{t("لم نجد تطابقًا مناسبًا.", "No matching tailors found.")}</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCity(""); setFavoritesOnly(false); }}>
              {t("مسح الفلاتر", "Clear filters")}
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((m) => (
              <div key={m.tailor.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggleFavoriteTailor(m.tailor.id)}
                  className="absolute top-28 end-4 z-10 p-2 rounded-full bg-white shadow"
                  aria-label="favorite"
                >
                  <Heart className={`h-4 w-4 ${favoriteTailorIds.includes(m.tailor.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </button>
                <TailorCard match={m} />
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">{tailors.length} {t("خياط مسجّل", "registered tailors")}</p>
      </main>
    </div>
  );
}
