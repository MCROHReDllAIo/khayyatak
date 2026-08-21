"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { InnovationDesignSpec } from "@/lib/innovation/types";
import {
  garmentPartLabel,
  type GarmentPart,
} from "@/lib/innovation/garment-parts";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

const Garment3DViewer = dynamic(
  () =>
    import("@/components/innovation/Garment3DViewer").then((m) => m.Garment3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl bg-[#eef2f6] text-sm text-navy/50">
        جاري تحميل المجسم ثلاثي الأبعاد...
      </div>
    ),
  }
);

type ViewAngle = "front" | "back" | "side";

interface InnovationDesignCanvasProps {
  spec: InnovationDesignSpec;
  viewAngle?: ViewAngle;
  onViewChange?: (angle: ViewAngle) => void;
  aiVisualizationUrl?: string;
  className?: string;
  waiting?: boolean;
  focusPart?: GarmentPart | null;
  onFocusPart?: (part: GarmentPart | null) => void;
}

export function InnovationDesignCanvas({
  spec,
  viewAngle = "front",
  onViewChange,
  aiVisualizationUrl,
  className,
  waiting,
  focusPart,
  onFocusPart,
}: InnovationDesignCanvasProps) {
  const { t, locale } = useLocale();
  const angles: ViewAngle[] = ["front", "side", "back"];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-navy/10 bg-white shadow-[0_16px_48px_-28px_rgba(7,26,51,0.35)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-navy/8 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("معاينة ثلاثية الأبعاد", "3D interactive preview")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t(
              "مجسم WebGL حقيقي — اسحب للتدوير واضغط على أي جزء",
              "Real WebGL model — drag to rotate, tap any part"
            )}
          </p>
        </div>
        {onViewChange && !waiting && (
          <div className="flex shrink-0 gap-1">
            {angles.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onViewChange(a)}
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] transition-colors",
                  viewAngle === a ? "border-navy bg-navy text-white" : "border-muted"
                )}
              >
                {a === "front" ? "أمام" : a === "back" ? "خلف" : "جانب"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-b from-[#f0f3f7] to-white p-4">
        {waiting ? (
          <div className="space-y-3 text-center">
            <Garment3DViewer spec={spec} viewAngle="front" dimmed />
            <p className="text-sm font-medium text-navy">
              {t(
                "المجسم جاهز — اكتب فكرتك أو أرفق صورة مرجعية للبدء.",
                "The 3D model is ready — describe your idea or attach a reference photo."
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-navy px-3 py-1 text-[11px] font-medium text-white">
                {spec.category === "abaya"
                  ? t("عباية", "Abaya")
                  : t("دشداشة عمانية", "Omani Dishdasha")}
              </span>
              <span className="rounded-full bg-[#e8e2d6] px-3 py-1 text-[11px] font-medium text-navy">
                {spec.fabric}
              </span>
            </div>

            <Garment3DViewer
              spec={spec}
              viewAngle={viewAngle}
              focusPart={focusPart}
              onFocusPart={onFocusPart}
            />

            {focusPart && onFocusPart && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 inline-flex w-full items-center justify-center gap-2"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-omani-gold/40 bg-omani-gold/15 px-3 py-1.5 text-xs text-navy">
                  <span>
                    {t("تعديل الجزء:", "Edit part:")}{" "}
                    <strong>{garmentPartLabel(focusPart, locale === "ar" ? "ar" : "en")}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onFocusPart(null)}
                    className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] hover:bg-navy/15"
                  >
                    {t("إلغاء", "Cancel")}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {aiVisualizationUrl && (
        <div className="space-y-2 border-t border-navy/8 p-4">
          <p className="text-xs font-medium text-primary">
            {t("تصور فوتوغرافي بالذكاء الاصطناعي", "AI photographic concept")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t(
              "صورة مولّدة بالـ AI من مواصفات تصميمك — ليست صورة منتج جاهز للبيع",
              "AI image from your design specs — not a finished marketplace product photo"
            )}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={aiVisualizationUrl}
            alt="AI visualization"
            className="max-h-56 w-full rounded-xl object-cover"
          />
        </div>
      )}
    </div>
  );
}
