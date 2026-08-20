"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BadgeCheck, Star, Sparkles, ImageIcon } from "lucide-react";
import type { TailorMatch } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR, cn } from "@/lib/utils";
import { AVAILABILITY_LABELS } from "@/lib/tailors/constants";
import { Button } from "@/components/ui/button";

interface TailorRailCardProps {
  match: TailorMatch;
  isBestMatch?: boolean;
  onViewProfile: () => void;
  onStartOrder: () => void;
  compact?: boolean;
}

function PortfolioStrip({ images, name }: { images: string[]; name: string }) {
  if (!images.length) {
    return (
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-10 flex-1 rounded-lg border border-dashed border-white/15 bg-white/[0.03] flex items-center justify-center"
          >
            <ImageIcon className="h-3.5 w-3.5 text-white/25" />
          </div>
        ))}
      </div>
    );
  }

  const preview = images.slice(0, 3);
  return (
    <div className="flex gap-1.5 mt-2 overflow-hidden">
      {preview.map((src, i) => (
        <div key={`${src}-${i}`} className="relative h-10 flex-1 min-w-0 rounded-lg overflow-hidden border border-white/10">
          <Image
            src={src}
            alt={`${name} ${i + 1}`}
            fill
            sizes="80px"
            className="object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export function TailorRailCard({
  match,
  isBestMatch = false,
  onViewProfile,
  onStartOrder,
  compact = false,
}: TailorRailCardProps) {
  const { tailor, score } = match;
  const { t, locale } = useLocale();
  const availability = tailor.availability_status ?? "accepting_orders";
  const availabilityMeta = AVAILABILITY_LABELS[availability];
  const gallery = tailor.gallery?.length ? tailor.gallery : tailor.cover_image ? [tailor.cover_image] : [];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border bg-white/[0.06] backdrop-blur-sm p-3 transition-shadow duration-200",
        isBestMatch
          ? "border-omani-gold/50 shadow-[0_0_0_1px_rgba(200,164,93,0.15),0_8px_32px_-8px_rgba(200,164,93,0.25)]"
          : "border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/10",
        compact && "min-w-[260px] snap-center"
      )}
    >
      {isBestMatch && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-omani-gold mb-2">
          {t("أفضل تطابق لك", "Best match for you")}
        </p>
      )}

      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-navy-light">
          {tailor.cover_image ? (
            <Image
              src={tailor.cover_image}
              alt={tailor.name_ar}
              fill
              sizes="56px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-navy to-primary/80" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">
                {locale === "ar" ? tailor.name_ar : tailor.name_en}
              </h3>
              <p className="text-xs text-white/50 truncate">{tailor.city}</p>
            </div>
            {tailor.verified && (
              <span className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-medium text-primary bg-white/90 rounded-full px-1.5 py-0.5">
                <BadgeCheck className="h-3 w-3" />
                {t("موثّق", "Verified")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="inline-flex items-center gap-0.5 text-white/80">
              <Star className="h-3 w-3 fill-omani-gold text-omani-gold" />
              {tailor.rating > 0 ? tailor.rating.toFixed(1) : "—"}
            </span>
            <span className="inline-flex items-center gap-1 text-white/60">
              <span className={cn("h-1.5 w-1.5 rounded-full", availabilityMeta.dot)} />
              {t(availabilityMeta.ar, availabilityMeta.en)}
            </span>
          </div>
        </div>
      </div>

      <PortfolioStrip images={gallery} name={tailor.name_ar} />

      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="font-semibold text-white/90">
          {t("من", "From")} {formatOMR(tailor.starting_price, locale === "ar" ? "ar" : "en")}
        </span>
        <span className="text-white/50">
          {tailor.delivery_days} {t("أيام", "days")}
        </span>
      </div>

      {score > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[11px] font-medium text-white">
          <Sparkles className="h-3 w-3 text-omani-gold" />
          {t("AI Match", "AI Match")} {score}%
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onViewProfile}
          className="flex-1 h-9 text-xs border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          {t("عرض الخياط", "View tailor")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onStartOrder}
          disabled={availability === "paused"}
          className="flex-1 h-9 text-xs bg-omani-gold text-navy hover:bg-omani-gold/90 font-semibold"
        >
          {t("ابدأ الطلب", "Start order")}
        </Button>
      </div>
    </motion.article>
  );
}
