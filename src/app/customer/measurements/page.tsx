"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Ruler, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { MeasurementScanner } from "@/components/ai/MeasurementScanner";
import { FeatureTutorial } from "@/components/onboarding/FeatureTutorial";
import type { Measurements } from "@/types";

export default function MeasurementsPage() {
  const { t } = useLocale();
  const { setMeasurements } = useAppState();
  const router = useRouter();
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const handleComplete = async (m: Measurements) => {
    setMeasurements({ ...m, id: "m-" + Date.now(), created_at: new Date().toISOString() });

    try {
      const res = await fetch("/api/customer/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m),
      });
      if (!res.ok) {
        setSavedNote(
          t(
            "حُفظت محليًا — تعذر المزامنة مع الخادم الآن.",
            "Saved locally — cloud sync failed for now."
          )
        );
      } else {
        setSavedNote(t("تم حفظ مقاساتك.", "Your measurements were saved."));
      }
    } catch {
      setSavedNote(
        t("حُفظت محليًا — تحقق من الاتصال لاحقًا.", "Saved locally — check connection later.")
      );
    }

    window.setTimeout(() => router.push("/customer"), 1400);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <FeatureTutorial
        featureId="measurements"
        titleAr="كيف تحفظ مقاساتك؟"
        titleEn="How do you save measurements?"
        bodyAr="أدخل طولك الحقيقي أولاً (مرجع الدقة)، ثم صوّر أو أدخل يدويًا. التقديرات تُراجع مع الخياط قبل القص."
        bodyEn="Enter your real height first (accuracy scale), then capture or enter manually. Estimates are confirmed with the tailor before cutting."
      />

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#1a3558] bg-[#071A33] p-5 text-white shadow-lg"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-omani-gold text-navy">
            <Ruler className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
              {t("خذ مقاساتك بدقة", "Measure with precision")}
              <Sparkles className="h-4 w-4 text-omani-gold" />
            </h1>
            <p className="mt-1.5 text-sm text-[#9aa6b5] leading-relaxed">
              {t(
                "مثل تطبيقات القياس الحديثة: طولك الحقيقي = مقياس الدقة، ثم نقدّر بقية المقاسات للتفصيل.",
                "Like modern measure apps: your real height is the scale, then we estimate the rest for tailoring."
              )}
            </p>
          </div>
        </div>
      </motion.header>

      {savedNote && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          {savedNote}
        </p>
      )}

      <MeasurementScanner onComplete={handleComplete} />
    </div>
  );
}
