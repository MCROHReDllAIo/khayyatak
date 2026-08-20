"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, Clock, BadgeCheck, ShoppingBag, Heart } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { matchTailors } from "@/lib/ai/matching";
import { TailorMatchScore } from "@/components/tailor/TailorMatchScore";
import { formatOMR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Tailor } from "@/types";

export default function TailorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useLocale();
  const { setSelectedTailorId, favoriteTailorIds, toggleFavoriteTailor } = useAppState();
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [reviews, setReviews] = useState<Array<{ rating: number; comment_ar: string; comment_en: string; customer_name: string }>>([]);

  useEffect(() => {
    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((json) => {
        const found = (json.tailors as Tailor[] | undefined)?.find((t_) => t_.id === id) ?? null;
        setTailor(found);
      });
    fetch(`/api/public/tailors/${id}/reviews`)
      .then((r) => r.json())
      .then((json) => setReviews(json.reviews ?? []))
      .catch(() => setReviews([]));
  }, [id]);

  if (!tailor) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("جاري التحميل...", "Loading...")}</div>;
  }

  const match = getBestMatchFromList([tailor], { budget: 25 }) ?? { tailor, score: 0, reasons_ar: [], reasons_en: [] };
  const isFavorite = favoriteTailorIds.includes(tailor.id);

  function getBestMatchFromList(tailors: Tailor[], criteria: { budget?: number }) {
    return matchTailors(tailors, criteria)[0] ?? null;
  }

  const orderNow = () => setSelectedTailorId(tailor.id);

  return (
    <div className="min-h-screen bg-omani-cream/30">
      <div className="h-48 bg-gradient-to-br from-navy to-primary" />
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10 pb-12">
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-navy">{locale === "ar" ? tailor.name_ar : tailor.name_en}</h1>
                {tailor.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
                <button type="button" onClick={() => toggleFavoriteTailor(tailor.id)} aria-label="favorite">
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
              </div>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" /> {tailor.city}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Star className="h-4 w-4 fill-omani-gold text-omani-gold" />
                <span className="font-medium">{tailor.rating}</span>
                <span className="text-sm text-muted-foreground">({tailor.review_count})</span>
              </div>
            </div>
            <TailorMatchScore score={match.score} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{locale === "ar" ? tailor.description_ar : tailor.description_en}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={orderNow} className="gap-2"><ShoppingBag className="h-4 w-4" />{t("اطلب الآن", "Order Now")}</Button>
            <Link href="/customer/designer"><Button variant="outline">{t("صمّم ثوبك", "Design")}</Button></Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t text-center">
            <div><p className="text-lg font-bold text-primary">{formatOMR(tailor.starting_price)}</p><p className="text-xs text-muted-foreground">{t("يبدأ من", "Starting")}</p></div>
            <div><p className="text-lg font-bold text-primary flex items-center justify-center gap-1"><Clock className="h-4 w-4" />{tailor.delivery_days}</p><p className="text-xs text-muted-foreground">{t("أيام", "days")}</p></div>
            <div><p className="text-lg font-bold text-primary">{tailor.review_count}</p><p className="text-xs text-muted-foreground">{t("تقييم", "reviews")}</p></div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="font-bold text-navy mb-4">{t("التقييمات", "Reviews")}</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("لا توجد تقييمات بعد", "No reviews yet")}</p>
          ) : (
            reviews.map((r, i) => (
              <div key={i} className="border-b py-3 last:border-0">
                <div className="flex gap-1 mb-1">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-3 w-3 fill-omani-gold text-omani-gold" />)}</div>
                <p className="text-sm">{locale === "ar" ? r.comment_ar : r.comment_en}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.customer_name}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
