"use client";

import { useState } from "react";
import { X, MapPin } from "lucide-react";
import type { CityCoverage } from "@/lib/admin/types";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NationalCoverageSection({ cities }: { cities: CityCoverage[] }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<CityCoverage | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border bg-white shadow-card overflow-hidden">
      <div className="p-6 md:p-8 border-b border-border/40">
        <h2 className="text-2xl font-bold text-navy">{t("التغطية الوطنية", "National Coverage")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("خريطة تفاعلية لتغطية شبكة الخياطين في سلطنة عُمان", "Interactive map of tailor network across Oman")}</p>
      </div>

      <div className="relative grid lg:grid-cols-5 gap-0">
        <div className="lg:col-span-3 relative bg-gradient-to-br from-omani-cream/50 to-white p-6 min-h-[360px]">
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[340px]" aria-label="Oman map">
            <defs>
              <linearGradient id="omanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F7654" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#071A33" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <path
              d="M55 8 L72 12 L85 28 L88 45 L82 62 L75 78 L58 88 L42 85 L28 72 L22 55 L25 38 L35 22 L48 12 Z"
              fill="url(#omanGrad)"
              stroke="#0F7654"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
            {cities.map((city) => (
              <g key={city.id}>
                <circle
                  cx={city.mapX}
                  cy={city.mapY}
                  r={hovered === city.id || selected?.id === city.id ? 4 : 3}
                  fill="#0F7654"
                  stroke="#C8A45D"
                  strokeWidth="0.8"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHovered(city.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(city)}
                />
                {(hovered === city.id || selected?.id === city.id) && (
                  <text x={city.mapX} y={city.mapY - 5} textAnchor="middle" fontSize="3.5" fill="#071A33" fontWeight="bold">
                    {city.name_ar}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {hovered && !selected && (
            <div className="absolute bottom-4 start-4 bg-navy text-white text-xs rounded-xl px-4 py-3 shadow-lg max-w-xs pointer-events-none">
              {(() => {
                const c = cities.find((x) => x.id === hovered);
                if (!c) return null;
                return (
                  <>
                    <p className="font-bold">{c.name_ar}</p>
                    <p>{c.tailors} {t("خياط", "tailors")} · {c.orders.toLocaleString()} {t("طلب", "orders")}</p>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 p-4 space-y-2 border-s border-border/30 bg-omani-cream/20 max-h-[420px] overflow-y-auto">
          {cities.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => setSelected(city)}
              className={cn(
                "w-full text-start rounded-xl p-4 border transition-all",
                selected?.id === city.id ? "border-primary bg-white shadow-md" : "border-transparent bg-white/60 hover:bg-white"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-bold text-navy">{city.name_ar}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{city.tailors} {t("خياط", "Tailors")}</span>
                <span>{city.orders.toLocaleString()} {t("طلب", "Orders")}</span>
                <span>{city.customers.toLocaleString()} {t("عميل", "Customers")}</span>
                <span>{formatOMR(city.gmv)} GMV</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-end">
            <div className="sticky top-0 bg-navy text-white p-6 flex items-start justify-between">
              <div>
                <p className="text-omani-gold text-xs uppercase tracking-wider">City Detail · Demo</p>
                <h3 className="text-2xl font-bold mt-1">{selected.name_ar}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                [t("الخياطون", "Tailors"), selected.tailors],
                [t("الطلبات", "Orders"), selected.orders.toLocaleString()],
                [t("العملاء", "Customers"), selected.customers.toLocaleString()],
                ["GMV", formatOMR(selected.gmv)],
                [t("أعلى فئة", "Top Category"), selected.topCategory],
                [t("أعلى لون", "Top Color"), selected.topColor],
                [t("أعلى قماش", "Top Fabric"), selected.topFabric],
                [t("متوسط الطلب", "Avg Order"), `${selected.avgOrder} ر.ع`],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground text-sm">{label}</span>
                  <span className="font-semibold text-navy">{val}</span>
                </div>
              ))}
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 mt-4">
                <p className="text-xs text-primary font-semibold mb-1">AI Insight</p>
                <p className="text-sm text-navy">{t(selected.aiInsight_ar, selected.aiInsight_en)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
