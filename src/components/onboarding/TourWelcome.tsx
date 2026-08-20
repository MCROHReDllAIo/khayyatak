"use client";

import { motion } from "framer-motion";
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050d18] px-4">
      <GeometricPattern className="text-white opacity-[0.12]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-md w-full text-center space-y-6"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-omani-gold mb-3">
            {t("دع خياطك يريك كيف يعمل", "Let Khayyatak show you around")}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-arabic tracking-tight">
            {t("أهلًا بك في", "Welcome to")} {BRAND.nameAr}
          </h1>
          <p className="mt-4 text-white/60 text-base leading-relaxed">
            {t(
              "اكتشف طريقة جديدة لتصميم وتفصيل ملابسك — مع متاجر حقيقية وذكاء يفهمك.",
              "Discover a new way to design and tailor your clothes — with real stores and AI that gets you."
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onStart}
            className="h-12 px-6 rounded-xl bg-omani-gold text-navy font-semibold hover:bg-omani-gold/90"
          >
            {t("ابدأ الجولة ✨", "Start the tour ✨")}
          </button>
          <button
            type="button"
            onClick={onExplore}
            className="h-12 px-6 rounded-xl border border-white/20 text-white/80 hover:bg-white/5"
          >
            {t("استكشف بنفسي", "Explore on my own")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
