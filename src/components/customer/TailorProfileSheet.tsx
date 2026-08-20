"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  X,
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  Sparkles,
  Check,
  ShoppingBag,
  ImageIcon,
} from "lucide-react";
import type { DesignConfig, Review, Tailor, TailorMatch } from "@/types";
import type { FashionIntent } from "@/lib/ai/intent";
import type { StyleDNA } from "@/lib/ai/style-dna";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR, cn } from "@/lib/utils";
import { AVAILABILITY_LABELS } from "@/lib/tailors/constants";
import { Button } from "@/components/ui/button";
import { TailorRailSkeleton } from "./TailorRailSkeleton";

interface TailorProfileSheetProps {
  tailorId: string | null;
  open: boolean;
  onClose: () => void;
  onStartOrder: (tailorId: string) => void;
  design: DesignConfig;
  intent: FashionIntent | null;
  styleDNA: StyleDNA;
}

interface DetailResponse {
  tailor: Tailor;
  reviews: Review[];
  match: TailorMatch;
}

function useIsDesktop() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(min-width: 768px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false
  );
}

export function TailorProfileSheet({
  tailorId,
  open,
  onClose,
  onStartOrder,
  design,
  intent,
  styleDNA,
}: TailorProfileSheetProps) {
  const { t, locale, dir } = useLocale();
  const isDesktop = useIsDesktop();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const fetchDetail = useCallback(async () => {
    if (!tailorId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("design", JSON.stringify(design));
      if (intent) params.set("intent", JSON.stringify(intent));
      params.set("style_dna", JSON.stringify(styleDNA));

      const res = await fetch(`/api/customer/tailors/${tailorId}?${params.toString()}`);
      if (!res.ok) throw new Error("Not found");
      const json = (await res.json()) as DetailResponse;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tailorId, design, intent, styleDNA]);

  useEffect(() => {
    if (open && tailorId) fetchDetail();
    if (!open) setData(null);
  }, [open, tailorId, fetchDetail]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const tailor = data?.tailor;
  const match = data?.match;
  const reviews = data?.reviews ?? [];
  const availability = tailor?.availability_status ?? "accepting_orders";
  const availabilityMeta = AVAILABILITY_LABELS[availability];
  const reasons = locale === "ar" ? match?.reasons_ar ?? [] : match?.reasons_en ?? [];

  const slideFromSide = isDesktop ? (dir === "rtl" ? "-100%" : "100%") : undefined;
  const slideFromBottom = !isDesktop ? "100%" : undefined;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("ملف الخياط", "Tailor profile")}
            initial={{
              x: slideFromSide ?? 0,
              y: slideFromBottom ?? 0,
            }}
            animate={{ x: 0, y: 0 }}
            exit={{
              x: slideFromSide ?? 0,
              y: slideFromBottom ?? 0,
            }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "fixed z-50 bg-omani-cream shadow-2xl overflow-y-auto",
              "inset-x-0 bottom-0 top-[12vh] rounded-t-3xl",
              "md:inset-y-0 md:start-auto md:end-0 md:top-0 md:w-full md:max-w-md md:rounded-none md:rounded-s-3xl"
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-omani-cream/95 backdrop-blur px-4 py-3">
              <h2 className="font-bold text-navy">{t("ملف الخياط", "Tailor profile")}</h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted"
                aria-label={t("إغلاق", "Close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 pb-8 space-y-6">
              {loading && <TailorRailSkeleton className="border-border bg-white" />}

              {!loading && tailor && (
                <>
                  <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-navy to-primary">
                    {tailor.cover_image && (
                      <Image src={tailor.cover_image} alt="" fill className="object-cover opacity-80" sizes="400px" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
                    <div className="absolute bottom-4 start-4 end-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {locale === "ar" ? tailor.name_ar : tailor.name_en}
                        </h3>
                        {tailor.verified && <BadgeCheck className="h-5 w-5 text-primary shrink-0" />}
                      </div>
                      <p className="text-white/70 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" /> {tailor.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star className="h-4 w-4 fill-omani-gold text-omani-gold" />
                      {tailor.rating > 0 ? tailor.rating.toFixed(1) : "—"}
                      <span className="text-muted-foreground">({tailor.review_count})</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <span className={cn("h-2 w-2 rounded-full", availabilityMeta.dot)} />
                      {t(availabilityMeta.ar, availabilityMeta.en)}
                    </span>
                    {match && match.score > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("AI Match", "AI Match")} {match.score}%
                      </span>
                    )}
                  </div>

                  {(tailor.description_ar || tailor.description_en) && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {locale === "ar" ? tailor.description_ar : tailor.description_en}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border bg-white p-3 text-center">
                      <p className="text-lg font-bold text-primary">
                        {formatOMR(tailor.starting_price, locale === "ar" ? "ar" : "en")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("يبدأ من", "Starting")}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-3 text-center">
                      <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" />
                        {tailor.delivery_days}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("أيام التسليم", "Delivery days")}</p>
                    </div>
                  </div>

                  {reasons.length > 0 && (
                    <section>
                      <h4 className="font-bold text-navy mb-3">{t("لماذا هذا الخياط؟", "Why this tailor?")}</h4>
                      <ul className="space-y-2">
                        {reasons.map((reason) => (
                          <li key={reason} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section>
                    <h4 className="font-bold text-navy mb-3">{t("معرض الأعمال", "Portfolio")}</h4>
                    {tailor.gallery.length ? (
                      <div className="grid grid-cols-3 gap-2">
                        {tailor.gallery.map((src, i) => (
                          <div key={`${src}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border">
                            <Image src={src} alt="" fill sizes="120px" className="object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{t("لا توجد صور في المعرض بعد", "No portfolio images yet")}</p>
                      </div>
                    )}
                  </section>

                  {tailor.services && tailor.services.length > 0 && (
                    <section>
                      <h4 className="font-bold text-navy mb-3">{t("الخدمات", "Services")}</h4>
                      <ul className="space-y-2">
                        {tailor.services.map((svc) => (
                          <li
                            key={svc.id}
                            className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm"
                          >
                            <span>{locale === "ar" ? svc.name_ar : svc.name_en ?? svc.name_ar}</span>
                            {svc.starting_price != null && (
                              <span className="font-medium text-primary">
                                {formatOMR(svc.starting_price, locale === "ar" ? "ar" : "en")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {reviews.length > 0 && (
                    <section>
                      <h4 className="font-bold text-navy mb-3">{t("التقييمات", "Reviews")}</h4>
                      <ul className="space-y-3">
                        {reviews.slice(0, 4).map((review) => (
                          <li key={review.id} className="rounded-xl border bg-white p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{review.customer_name}</span>
                              <span className="inline-flex items-center gap-0.5 text-omani-gold">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                {review.rating}
                              </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-3">
                              {locale === "ar" ? review.comment_ar : review.comment_en || review.comment_ar}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <Button
                    className="w-full gap-2 h-12 text-base"
                    disabled={availability === "paused"}
                    onClick={() => onStartOrder(tailor.id)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {t("ابدأ الطلب", "Start order")}
                  </Button>
                </>
              )}

              {!loading && !tailor && (
                <p className="text-center text-muted-foreground py-12">
                  {t("تعذّر تحميل ملف الخياط", "Could not load tailor profile")}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
