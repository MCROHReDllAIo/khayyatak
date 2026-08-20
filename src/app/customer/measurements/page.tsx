"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { MeasurementScanner } from "@/components/ai/MeasurementScanner";
import type { Measurements } from "@/types";

export default function MeasurementsPage() {
  const { t } = useLocale();
  const { setMeasurements } = useAppState();
  const router = useRouter();

  const handleComplete = (m: Measurements) => {
    setMeasurements({ ...m, id: "m-" + Date.now(), created_at: new Date().toISOString() });
    setTimeout(() => router.push("/customer"), 1500);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {t("خذ مقاساتك بالذكاء الاصطناعي", "AI Body Measurements")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("قياساتك محفوظة، ووقتك أهم", "Your measurements saved, your time matters")}
        </p>
      </motion.div>

      <MeasurementScanner onComplete={handleComplete} />
    </div>
  );
}
