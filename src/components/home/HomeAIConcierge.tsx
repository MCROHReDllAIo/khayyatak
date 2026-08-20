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
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[60] bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-[max(1.25rem,env(safe-area-inset-right))] md:bottom-8 md:end-8 max-w-[calc(100vw-2rem)]"
            data-tour="home-ai-fab"
          >
            <motion.button
              type="button"
              onClick={() => onOpenChange(true)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative flex items-center gap-3 rounded-full pe-5 sm:pe-6 ps-3.5 h-[3.35rem] sm:h-16 max-w-full",
                "border border-white/20 bg-white/[0.1] text-white backdrop-blur-xl",
                "shadow-[0_16px_48px_-12px_rgba(5,13,24,0.65),0_0_0_1px_rgba(200,164,93,0.18)]",
                "hover:border-omani-gold/40 hover:bg-white/[0.14]",
                "transition-[border-color,background-color,box-shadow] duration-300"
              )}
              aria-label={t("فتح مستشارك الذكي", "Open AI concierge")}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-2 rounded-full bg-omani-gold/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-l from-omani-gold/15 via-transparent to-white/5"
              />
              <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-omani-gold to-[#b8923f] text-navy shadow-[0_6px_20px_-4px_rgba(200,164,93,0.65)] ring-2 ring-white/25">
                <Sparkles className="h-[1.1rem] w-[1.1rem] sm:h-5 sm:w-5" />
              </span>
              <span className="relative text-start pe-1 min-w-0">
                <span className="block text-sm sm:text-[15px] font-semibold leading-tight truncate">
                  {t("مستشارك الذكي", "AI Concierge")}
                </span>
                <span className="block text-[11px] sm:text-xs text-white/55 truncate">
                  {t("قل ماذا تريد", "Tell us what you want")}
                </span>
              </span>
              <MessageCircle className="relative h-4 w-4 text-omani-gold/85 hidden sm:block" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label={t("إغلاق", "Close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="fixed inset-0 z-[70] bg-[#050d18]/50 backdrop-blur-[6px]"
              onClick={() => onOpenChange(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t("مستشارك الذكي", "AI Concierge")}
              initial={{ opacity: 0, y: 40, scale: 0.86, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 28, scale: 0.92, filter: "blur(3px)" }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "fixed z-[75] flex flex-col overflow-hidden",
                "inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] top-[max(4.5rem,env(safe-area-inset-top)+3.5rem)]",
                "sm:inset-x-auto sm:end-[max(1.25rem,env(safe-area-inset-right))] sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:top-auto",
                "sm:w-[min(440px,calc(100vw-2.5rem))] sm:h-[min(720px,calc(100dvh-5.5rem))] sm:max-h-[calc(100dvh-5.5rem)]",
                "max-h-[calc(100dvh-5rem)]",
                "rounded-[1.5rem] sm:rounded-[1.75rem] border border-white/18",
                "bg-[#0a1a32]/78 backdrop-blur-2xl",
                "shadow-[0_28px_90px_-24px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]",
                "ring-1 ring-omani-gold/20"
              )}
              data-tour="home-ai"
            >
              <motion.div
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.2] }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-omani-gold/30"
              />
              <div className="pointer-events-none absolute -top-24 -end-20 h-52 w-52 rounded-full bg-omani-gold/15 blur-3xl" />
              <div className="pointer-events-none absolute bottom-8 -start-12 h-36 w-36 rounded-full bg-sky-400/10 blur-3xl" />

              <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 shrink-0 bg-white/[0.03]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-omani-gold/25 to-omani-gold/5 text-omani-gold ring-1 ring-omani-gold/30 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {t("مستشارك الذكي", "AI Concierge")}
                    </p>
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
                  onRequestClose={() => onOpenChange(false)}
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
