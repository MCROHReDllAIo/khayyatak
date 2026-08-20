"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { BRAND } from "@/lib/constants/brand";
import { useLocale } from "@/lib/context/locale-context";

interface TourWelcomeProps {
  open: boolean;
  onStart: () => void;
  onExplore: () => void;
}

export function TourWelcome({ open, onStart, onExplore }: TourWelcomeProps) {
  const { t } = useLocale();
  const reduced = Boolean(useReducedMotion());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050d18] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.35 }}
        >
          <GeometricPattern className="text-white opacity-[0.12]" />

          {!reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute h-64 w-64 rounded-full bg-omani-gold/15 blur-3xl"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.35, 0.55, 0.35],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-md w-full text-center space-y-6"
          >
            <div>
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="text-[11px] uppercase tracking-[0.28em] text-omani-gold mb-3"
              >
                {t("دع خياطك يريك كيف يعمل", "Let Khayyatak show you around")}
              </motion.p>
              <motion.h1
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.4 }}
                className="text-4xl md:text-5xl font-bold text-white font-arabic tracking-tight"
              >
                {t("أهلًا بك في", "Welcome to")} {BRAND.nameAr}
              </motion.h1>
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="mt-4 text-white/60 text-base leading-relaxed"
              >
                {t(
                  "اكتشف طريقة جديدة لتصميم وتفصيل ملابسك — مع متاجر حقيقية وذكاء يفهمك.",
                  "Discover a new way to design and tailor your clothes — with real stores and AI that gets you."
                )}
              </motion.p>
            </div>
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <motion.button
                type="button"
                onClick={onStart}
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="h-12 px-6 rounded-xl bg-omani-gold text-navy font-semibold hover:bg-omani-gold/90 shadow-[0_12px_32px_-10px_rgba(200,164,93,0.55)]"
              >
                {t("ابدأ الجولة ✨", "Start the tour ✨")}
              </motion.button>
              <motion.button
                type="button"
                onClick={onExplore}
                whileHover={reduced ? undefined : { scale: 1.02 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                className="h-12 px-6 rounded-xl border border-white/20 text-white/80 hover:bg-white/5"
              >
                {t("استكشف بنفسي", "Explore on my own")}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
