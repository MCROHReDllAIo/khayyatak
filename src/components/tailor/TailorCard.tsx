"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, BadgeCheck } from "lucide-react";
import Link from "next/link";
import type { TailorMatch } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TailorMatchScore } from "./TailorMatchScore";

interface TailorCardProps {
  match: TailorMatch;
  showMatch?: boolean;
}

export function TailorCard({ match, showMatch = true }: TailorCardProps) {
  const { tailor, score, reasons_ar, reasons_en } = match;
  const { t, locale } = useLocale();
  const reasons = locale === "ar" ? reasons_ar : reasons_en;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-premium transition-shadow">
        <div className="h-24 bg-gradient-to-br from-navy to-primary/80 relative">
          {tailor.verified && (
            <div className="absolute top-3 start-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-primary">
              <BadgeCheck className="h-3 w-3" />
              {t("موثّق", "Verified")}
            </div>
          )}
          {showMatch && (
            <div className="absolute top-3 end-3">
              <TailorMatchScore score={score} size="sm" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-navy">{locale === "ar" ? tailor.name_ar : tailor.name_en}</h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {tailor.city}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-omani-gold text-omani-gold" />
              {tailor.rating}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-sm font-semibold text-primary">
                {t("ابتداءً من", "From")} {formatOMR(tailor.starting_price, locale === "ar" ? "ar" : "en")}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {t(`التسليم خلال ${tailor.delivery_days} أيام`, `${tailor.delivery_days} days delivery`)}
              </p>
            </div>
          </div>
          {showMatch && reasons.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
              {reasons[0]}
            </p>
          )}
          <Link href={`/tailors/${tailor.id}`}>
            <Button className="w-full mt-4" size="sm">
              {t("عرض الملف", "View Profile")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
