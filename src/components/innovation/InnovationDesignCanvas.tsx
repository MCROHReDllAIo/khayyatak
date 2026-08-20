"use client";

import { motion } from "framer-motion";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { specToDesignConfig } from "@/lib/innovation/types";
import type { InnovationDesignSpec } from "@/lib/innovation/types";
import { cn } from "@/lib/utils";

type ViewAngle = "front" | "back" | "side";

interface InnovationDesignCanvasProps {
  spec: InnovationDesignSpec;
  viewAngle?: ViewAngle;
  onViewChange?: (angle: ViewAngle) => void;
  aiVisualizationUrl?: string;
  className?: string;
}

export function InnovationDesignCanvas({
  spec,
  viewAngle = "front",
  onViewChange,
  aiVisualizationUrl,
  className,
}: InnovationDesignCanvasProps) {
  const design = specToDesignConfig(spec);
  const angles: ViewAngle[] = ["front", "side", "back"];

  return (
    <div className={cn("rounded-2xl border bg-white shadow-card overflow-hidden", className)}>
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Design Canvas</p>
          <p className="text-[10px] text-muted-foreground">معاينة structured — ليست نموذج 3D حقيقي</p>
        </div>
        {onViewChange && (
          <div className="flex gap-1">
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

      <div className="relative bg-gradient-to-b from-omani-cream to-white p-6 min-h-[320px] flex items-center justify-center">
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
        >
          <GarmentPreview design={design} size="lg" />
        </motion.div>
      </div>

      {aiVisualizationUrl && (
        <div className="border-t p-4 space-y-2">
          <p className="text-xs font-medium text-primary">AI Visualization</p>
          <p className="text-[10px] text-amber-700">تصور بصرية بالذكاء الاصطناعي — ليس ضمان تصنيع</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aiVisualizationUrl} alt="AI visualization" className="w-full rounded-xl object-cover max-h-48" />
        </div>
      )}
    </div>
  );
}
