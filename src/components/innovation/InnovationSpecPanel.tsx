"use client";

import type { InnovationDesignSpec, CustomDesignVersion } from "@/lib/innovation/types";
import type { MaterialCheckResult } from "@/lib/innovation/types";

interface InnovationSpecPanelProps {
  spec: InnovationDesignSpec;
  version?: CustomDesignVersion;
  materialResults?: MaterialCheckResult[];
  onSpecChange?: (field: keyof InnovationDesignSpec, value: string) => void;
}

const FIELDS: Array<{ key: keyof InnovationDesignSpec; label: string; abayaOnly?: boolean }> = [
  { key: "color", label: "اللون" },
  { key: "fabric", label: "القماش" },
  { key: "opening", label: "الفتحة / الياقة" },
  { key: "fit", label: "القصة" },
  { key: "sleeves", label: "الأكمام" },
  { key: "length", label: "الطول" },
  { key: "embroidery", label: "التطريز" },
  { key: "occasion", label: "المناسبة" },
];

export function InnovationSpecPanel({ spec, version, materialResults, onSpecChange }: InnovationSpecPanelProps) {
  const categoryLabel = spec.category === "dishdasha" ? "دشداشة" : "عباية";

  return (
    <div className="rounded-2xl border bg-white shadow-card p-4 space-y-4 h-full overflow-y-auto">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">مواصفات التصميم</p>
        <p className="text-[11px] text-navy/70 mt-1 font-medium">{categoryLabel}</p>
        {version && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            النسخة {version.version_number} · {version.change_summary_ar}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {FIELDS.map(({ key, label }) => {
          const fieldLabel =
            key === "opening"
              ? spec.category === "dishdasha"
                ? "الياقة"
                : "الفتحة"
              : label;
          const val = spec[key];
          if (!val || typeof val !== "string") return null;
          return (
            <div key={key} className="flex items-center justify-between text-sm border-b border-dashed pb-2">
              <span className="text-muted-foreground text-xs">{fieldLabel}</span>
              {onSpecChange ? (
                <input
                  className="text-end text-xs font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 max-w-[120px]"
                  value={val}
                  onChange={(e) => onSpecChange(key, e.target.value)}
                />
              ) : (
                <span className="font-medium text-navy text-xs">{val}</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
        تصميم مقترح بالذكاء الاصطناعي — الخياط يحدد إمكانية التنفيذ والسعر النهائي.
      </p>

      {materialResults && materialResults.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-semibold text-navy">توفر المواد (حقيقي من المخزون)</p>
          <p className="text-[10px] text-muted-foreground">مطابقة اللون تقريبية.</p>
          {materialResults.map((r) => (
            <div key={r.tailor_id} className="text-xs rounded-lg bg-muted/40 p-2 space-y-0.5">
              <p className="font-medium">{r.tailor_name_ar}</p>
              <p>{r.material_name}</p>
              <p className={
                r.availability === "available" ? "text-emerald-700" :
                r.availability === "close_match" ? "text-amber-700" :
                r.availability === "unknown" ? "text-muted-foreground" : "text-red-600"
              }>
                {r.availability === "available" && "✓ متوفر"}
                {r.availability === "close_match" && "⚠ قريب من اللون"}
                {r.availability === "unavailable" && "✕ غير متوفر"}
                {r.availability === "unknown" && "? التوفر غير معروف"}
                {r.quantity != null && r.quantity > 0 && ` · ${r.quantity}`}
              </p>
              {r.notes && <p className="text-[10px] text-muted-foreground">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
