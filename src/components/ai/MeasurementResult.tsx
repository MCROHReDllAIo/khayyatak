"use client";

import { motion } from "framer-motion";
import { Save, Info } from "lucide-react";
import type { Measurements } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MeasurementResultProps {
  measurements: Measurements;
  onSave?: () => void;
  editable?: boolean;
  onChange?: (m: Measurements) => void;
}

const FIELDS = [
  { key: "height" as const, ar: "الطول", en: "Height" },
  { key: "chest" as const, ar: "الصدر", en: "Chest" },
  { key: "waist" as const, ar: "الخصر", en: "Waist" },
  { key: "shoulder" as const, ar: "الكتف", en: "Shoulder" },
  { key: "sleeve" as const, ar: "الكم", en: "Sleeve" },
  { key: "dishdasha_length" as const, ar: "الثوب", en: "Length" },
];

export function MeasurementResult({ measurements, onSave, editable, onChange }: MeasurementResultProps) {
  const { t, locale } = useLocale();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 p-5">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
          {measurements.is_ai_estimate ? t("AI Estimate", "AI Estimate") : t("Manual", "Manual")}
        </span>
        <p className="text-sm text-muted-foreground mt-2">{t("الثقة", "Confidence")}: {measurements.confidence}%</p>
        <Progress value={measurements.confidence} className="my-3" />
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((field, i) => (
            <motion.div key={field.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-omani-cream/50 p-3">
              <p className="text-xs text-muted-foreground">{locale === "ar" ? field.ar : field.en}</p>
              {editable && onChange ? (
                <Input type="number" value={measurements[field.key]} onChange={(e) => onChange({ ...measurements, [field.key]: Number(e.target.value) })} className="mt-1 h-8" />
              ) : (
                <p className="text-lg font-bold text-navy">{measurements[field.key]} cm</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>{t("تقديرات AI — يُرجى تأكيدها مع الخياط", "AI estimates — confirm with tailor")}</p>
      </div>
      {onSave && (
        <Button size="lg" className="w-full gap-2" onClick={onSave}><Save className="h-4 w-4" />{t("حفظ المقاسات", "Save")}</Button>
      )}
    </div>
  );
}
