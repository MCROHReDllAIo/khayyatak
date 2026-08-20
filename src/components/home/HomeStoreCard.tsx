"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin, Star, Store } from "lucide-react";
import type { Tailor } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR, cn } from "@/lib/utils";
import { resolveProductImageUrl } from "@/lib/images/product-image";

interface HomeStoreCardProps {
  tailor: Tailor;
  badges: string[];
  highlighted?: boolean;
  selected?: boolean;
  onSelect?: (tailor: Tailor) => void;
}

export function HomeStoreCard({
  tailor,
  badges,
  highlighted,
  selected,
  onSelect,
}: HomeStoreCardProps) {
  const { t, locale } = useLocale();
  const cover =
    resolveProductImageUrl(tailor.cover_image) ||
    resolveProductImageUrl(tailor.gallery?.[0]);
  const specialty =
    (locale === "ar" ? tailor.specializations_ar[0] : tailor.specializations[0]) ||
    t("خياطة عمانية", "Omani tailoring");
  const blurb =
    (locale === "ar" ? tailor.description_ar : tailor.description_en)?.trim() ||
    t("تفصيل فاخر بأسلوب عماني", "Premium Omani craftsmanship");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "group overflow-hidden rounded-[1.35rem] border transition-shadow duration-300",
        "bg-white/55 backdrop-blur-md shadow-[0_10px_36px_-24px_rgba(7,26,51,0.45)]",
        highlighted || selected
          ? "border-primary/35 ring-1 ring-primary/15 shadow-[0_16px_40px_-20px_rgba(15,118,84,0.35)]"
          : "border-white/60 hover:border-navy/10 hover:shadow-[0_18px_44px_-22px_rgba(7,26,51,0.4)]"
      )}
    >
      <button type="button" className="w-full text-start" onClick={() => onSelect?.(tailor)}>
        <div className="relative aspect-[16/10] bg-gradient-to-br from-navy via-navy-light to-primary/70 overflow-hidden">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="h-10 w-10 text-white/25" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/10 to-transparent" />
          {tailor.verified && (
            <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t("موثق", "Verified")}
            </span>
          )}
          {highlighted && (
            <span className="absolute top-3 end-3 rounded-full bg-omani-gold/95 px-2.5 py-1 text-[10px] font-bold text-navy shadow-sm">
              {t("مناسب لطلبك", "Matches your ask")}
            </span>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <div>
            <h3 className="font-bold text-navy text-[15px] leading-snug tracking-tight">
              {locale === "ar" ? tailor.name_ar : tailor.name_en}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-navy/45">
              <MapPin className="h-3 w-3 shrink-0" />
              {specialty} · {tailor.city}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-navy">
              <Star className="h-3.5 w-3.5 fill-omani-gold text-omani-gold" />
              {tailor.rating > 0 ? tailor.rating.toFixed(1) : "—"}
            </span>
            <span className="text-navy/40">
              {tailor.review_count} {t("تقييم", "reviews")}
            </span>
            {tailor.starting_price > 0 && (
              <span className="ms-auto text-primary font-semibold">
                {t("من", "From")} {formatOMR(tailor.starting_price, locale === "ar" ? "ar" : "en")}
              </span>
            )}
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[10px] font-medium text-navy/70"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-navy/40 line-clamp-2 leading-relaxed">«{blurb}»</p>
        </div>
      </button>

      <div className="px-4 pb-4">
        <Link
          href={`/tailors/${tailor.id}`}
          className="flex h-10 w-full items-center justify-center rounded-xl bg-navy/95 text-sm font-medium text-white transition-colors hover:bg-navy"
        >
          {t("زيارة المتجر", "Visit store")}
        </Link>
      </div>
    </motion.article>
  );
}
