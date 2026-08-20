"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Minimize2, Sparkles, X } from "lucide-react";
import { HomeAIPanel } from "./HomeAIPanel";
import { useLocale } from "@/lib/context/locale-context";
import type { ProductSearchIntent } from "@/lib/ai/product-intent";
import type { Tailor } from "@/types";
import { cn } from "@/lib/utils";

interface HomeAIConciergeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStore: Tailor | null;
  onIntentChange: (intent: ProductSearchIntent | null, highlightTailorIds: string[]) => void;
  onClearStore?: () => void;
}

export function HomeAIConcierge({
  open,
  onOpenChange,
  selectedStore,
  onIntentChange,
  onClearStore,
}: HomeAIConciergeProps) {
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    const openHandler = () => onOpenChange(true);
    window.addEventListener("kytk-open-ai", openHandler);
    return () => window.removeEventListener("kytk-open-ai", openHandler);
  }, [onOpenChange]);

  return (
    <>
      {/* Floating launcher — always visible when closed */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[60] bottom-5 end-5 md:bottom-8 md:end-8"
            data-tour="home-ai-fab"
          >
            <button
              type="button"
              onClick={() => onOpenChange(true)}
              className={cn(
                "group relative flex items-center gap-3 rounded-full pe-5 ps-3.5 h-14",
                "bg-gradient-to-l from-navy via-[#0c2440] to-navy text-white",
                "shadow-[0_12px_40px_-8px_rgba(7,26,51,0.55)] ring-1 ring-omani-gold/30",
                "hover:ring-omani-gold/55 hover:shadow-[0_16px_48px_-8px_rgba(200,164,93,0.35)]",
                "transition-shadow duration-300"
              )}
              aria-label={t("فتح مستشارك الذكي", "Open AI concierge")}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-full bg-omani-gold/25 blur-md opacity-60 animate-pulse"
              />
              <span className="absolute inset-0 rounded-full bg-omani-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-omani-gold text-navy shadow-inner ring-2 ring-omani-gold/40">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="relative text-start pe-1">
                <span className="block text-sm font-semibold leading-tight">{t("مستشارك الذكي", "AI Concierge")}</span>
                <span className="block text-[11px] text-white/55">{t("قل ماذا تريد", "Tell us what you want")}</span>
              </span>
              <MessageCircle className="relative h-4 w-4 text-omani-gold/80 hidden sm:block" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label={t("إغلاق", "Close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[70] bg-navy/45 backdrop-blur-[2px]"
              onClick={() => onOpenChange(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t("مستشارك الذكي", "AI Concierge")}
              initial={{ opacity: 0, y: 36, scale: 0.88, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(2px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "fixed z-[75] flex flex-col overflow-hidden",
                "inset-x-3 bottom-3 top-[12vh] sm:inset-x-auto sm:end-6 sm:bottom-6 sm:top-auto",
                "sm:w-[min(440px,calc(100vw-3rem))] sm:h-[min(740px,calc(100vh-5rem))]",
                "rounded-3xl border border-white/12",
                "bg-gradient-to-b from-[#0d2240] via-[#0a1a32] to-[#071526]",
                "shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(200,164,93,0.12)]",
                "ring-1 ring-omani-gold/25"
              )}
              data-tour="home-ai"
            >
              <motion.div
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.25] }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-omani-gold/40 shadow-[0_0_60px_rgba(200,164,93,0.25)]"
              />
              <div className="pointer-events-none absolute -top-20 -end-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute bottom-10 -start-10 h-32 w-32 rounded-full bg-omani-gold/10 blur-3xl" />

              <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-omani-gold/15 text-omani-gold ring-1 ring-omani-gold/25">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t("مستشارك الذكي", "AI Concierge")}</p>
                    <p className="text-[11px] text-white/45 truncate">
                      {t("ابحث في المتاجر الحقيقية", "Search real stores")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={t("تصغير", "Minimize")}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={t("إغلاق", "Close")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col p-3 md:p-4">
                <HomeAIPanel
                  selectedStore={selectedStore}
                  onIntentChange={onIntentChange}
                  onClearStore={onClearStore}
                  embedded
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function openHomeAIConcierge() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("kytk-open-ai"));
  }
}
