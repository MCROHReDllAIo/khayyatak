"use client";

import { motion } from "framer-motion";
import { Save, Info, Ruler } from "lucide-react";
import type { Measurements } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MeasurementResultProps {
  measurements: Measurements;
  onSave?: () => void;
  editable?: boolean;
  onChange?: (m: Measurements) => void;
  saving?: boolean;
  methodLabel?: string;
}

const FIELDS = [
  { key: "height" as const, ar: "الطول", en: "Height", primary: true },
  { key: "chest" as const, ar: "الصدر", en: "Chest", primary: true },
  { key: "waist" as const, ar: "الخصر", en: "Waist", primary: true },
  { key: "shoulder" as const, ar: "الكتف", en: "Shoulder", primary: false },
  { key: "sleeve" as const, ar: "الكم", en: "Sleeve", primary: false },
  { key: "dishdasha_length" as const, ar: "طول الثوب", en: "Garment length", primary: false },
];

export function MeasurementResult({
  measurements,
  onSave,
  editable,
  onChange,
  saving,
  methodLabel,
}: MeasurementResultProps) {
  const { t, locale } = useLocale();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1a3558] bg-[#0a1f3a] p-5 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-omani-gold text-navy">
              <Ruler className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {measurements.is_ai_estimate
                  ? t("تقدير معاير", "Calibrated estimate")
                  : t("إدخال يدوي", "Manual entry")}
              </p>
              <p className="text-[11px] text-[#9aa6b5]">
                {methodLabel ??
                  t(`ثقة ${measurements.confidence}%`, `${measurements.confidence}% confidence`)}
              </p>
            </div>
          </div>
          <div className="rounded-full bg-[#12365c] px-3 py-1 text-xs font-medium text-omani-gold">
            {measurements.confidence}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {FIELDS.map((field, i) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "rounded-xl border border-[#1a3558] bg-[#071A33] p-3",
                field.primary && "col-span-1"
              )}
            >
              <p className="text-[10px] uppercase tracking-wide text-[#9aa6b5]">
                {locale === "ar" ? field.ar : field.en}
              </p>
              {editable && onChange ? (
                <div className="mt-1 flex items-baseline gap-1">
                  <Input
                    type="number"
                    value={measurements[field.key]}
                    onChange={(e) =>
                      onChange({ ...measurements, [field.key]: Number(e.target.value) })
                    }
                    className="h-9 border-[#1a3558] bg-[#0a1f3a] text-lg font-bold text-white"
                  />
                  <span className="text-xs text-[#9aa6b5]">cm</span>
                </div>
              ) : (
                <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {measurements[field.key]}
                  <span className="ms-1 text-xs font-medium text-[#9aa6b5]">cm</span>
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          {t(
            "المقاسات تقديرية ومعايرة بطولك. أكّدها مع الخياط قبل القص.",
            "Estimates are calibrated to your height. Confirm with your tailor before cutting."
          )}
        </p>
      </div>

      {onSave && (
        <Button
          size="lg"
          className="w-full gap-2 bg-omani-gold text-navy hover:bg-omani-gold/90"
          onClick={onSave}
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? t("جاري الحفظ...", "Saving...") : t("حفظ المقاسات", "Save measurements")}
        </Button>
      )}
    </div>
  );
}
