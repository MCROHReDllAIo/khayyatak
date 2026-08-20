"use client";

import { motion } from "framer-motion";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { specToDesignConfig } from "@/lib/innovation/types";
import type { InnovationDesignSpec } from "@/lib/innovation/types";
import {
  GARMENT_PARTS,
  garmentPartLabel,
  type GarmentPart,
} from "@/lib/innovation/garment-parts";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

type ViewAngle = "front" | "back" | "side";

interface InnovationDesignCanvasProps {
  spec: InnovationDesignSpec;
  viewAngle?: ViewAngle;
  onViewChange?: (angle: ViewAngle) => void;
  aiVisualizationUrl?: string;
  className?: string;
  /** Waiting silhouette before first collaboration turn */
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
  const design = specToDesignConfig(spec);
  const angles: ViewAngle[] = ["front", "side", "back"];

  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-navy/10 bg-white/80 shadow-[0_16px_48px_-28px_rgba(7,26,51,0.35)] overflow-hidden backdrop-blur-md",
        className
      )}
    >
      <div className="border-b border-navy/8 px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("معاينة تفاعلية", "Interactive preview")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t(
              "تصميم توضيحي — ليست نموذج 3D حقيقي",
              "Design preview — not a real 3D model"
            )}
          </p>
        </div>
        {onViewChange && !waiting && (
          <div className="flex gap-1 shrink-0">
            {angles.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onViewChange(a)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-full border transition-colors",
                  viewAngle === a ? "bg-navy text-white border-navy" : "border-muted"
                )}
              >
                {a === "front" ? "أمام" : a === "back" ? "خلف" : "جانب"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative bg-gradient-to-b from-[#f7f4ee] to-white p-6 min-h-[340px] flex flex-col items-center justify-center">
        {waiting ? (
          <div className="text-center space-y-4 max-w-xs">
            <div className="mx-auto opacity-40 grayscale">
              <GarmentPreview design={design} size="md" showConceptLabel={false} />
            </div>
            <p className="text-sm font-medium text-navy leading-relaxed">
              {t(
                "هناك مجسم ينتظرك لاستكمال مشروعك.",
                "A silhouette is waiting for you to continue your project."
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "اختاري نوع القطعة وابدئي الوصف — أو ارفعي صورة مرجعية.",
                "Choose a garment type and describe your idea — or upload a reference."
              )}
            </p>
          </div>
        ) : (
          <>
            <motion.div
              key={viewAngle + spec.colorKey + spec.fabricKey}
              initial={{ opacity: 0, rotateY: viewAngle === "side" ? -15 : 0 }}
              animate={{
                opacity: 1,
                rotateY: viewAngle === "side" ? -20 : viewAngle === "back" ? 180 : 0,
                scale: viewAngle === "back" ? 0.95 : 1,
              }}
              transition={{ duration: 0.4 }}
              style={{ perspective: 800 }}
              className="relative"
            >
              <GarmentPreview design={design} size="lg" />

              {/* Part hotspots — SVG overlay aligned to garment viewBox */}
              {onFocusPart && viewAngle === "front" && (
                <svg
                  viewBox="0 0 200 320"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden={false}
                >
                  {GARMENT_PARTS.map((p) => {
                    const active = focusPart === p.id;
                    return (
                      <g key={p.id} className="pointer-events-auto">
                        <circle
                          cx={p.cx}
                          cy={p.cy}
                          r={active ? 16 : 12}
                          fill={active ? "rgba(200,164,93,0.35)" : "rgba(7,26,51,0.12)"}
                          stroke={active ? "#c8a45d" : "rgba(7,26,51,0.35)"}
                          strokeWidth={active ? 2 : 1}
                          className="cursor-pointer transition-all"
                          onClick={() => onFocusPart(active ? null : p.id)}
                        >
                          <title>{garmentPartLabel(p.id, locale === "ar" ? "ar" : "en")}</title>
                        </circle>
                        <text
                          x={p.cx}
                          y={p.cy + 28}
                          textAnchor="middle"
                          className="fill-navy/70 text-[9px] font-medium pointer-events-none"
                        >
                          {locale === "ar" ? p.ar : p.en}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </motion.div>

            {focusPart && onFocusPart && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-omani-gold/35 bg-omani-gold/10 px-3 py-1.5 text-xs text-navy">
                <span>
                  {t("تعديل الجزء:", "Editing:")}{" "}
                  <strong>{garmentPartLabel(focusPart, locale === "ar" ? "ar" : "en")}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onFocusPart(null)}
                  className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] hover:bg-navy/15"
                >
                  {t("إلغاء", "Clear")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {aiVisualizationUrl && (
        <div className="border-t border-navy/8 p-4 space-y-2">
          <p className="text-xs font-medium text-primary">
            {t("معاينة مولدة بالذكاء الاصطناعي", "AI-generated visualization")}
          </p>
          <p className="text-[10px] text-amber-700">
            AI Generated — {t("ليس منتج سوق ولا ضمان تصنيع", "not a marketplace product or manufacturing guarantee")}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={aiVisualizationUrl}
            alt="AI visualization"
            className="w-full rounded-xl object-cover max-h-48"
          />
        </div>
      )}
    </div>
  );
}
