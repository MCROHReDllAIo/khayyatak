"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { CityCoverage } from "@/lib/admin/types";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR } from "@/lib/utils";

export function OmanMapIntel({ cities }: { cities: CityCoverage[] }) {
  const { t, locale } = useLocale();
  const [selected, setSelected] = useState<string>(cities[0]?.id ?? "");
  const city = cities.find((c) => c.id === selected) ?? cities[0];

  if (!city) {
    return (
      <div className="relative rounded-3xl border border-border/50 bg-omani-cream overflow-hidden min-h-[320px] flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm text-center">
          {t("لا توجد بيانات جغرافية بعد — ستظهر بعد تسجيل الطلبات.", "No geographic data yet — appears after orders are recorded.")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-border/50 bg-omani-cream overflow-hidden min-h-[420px]">
      <GeometricPattern className="text-navy opacity-40" />
      <div className="relative p-6 md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 mb-1">
          {t("ذكاء السوق الوطني", "National Market Intelligence")}
        </p>
        <h3 className="text-xl font-bold text-navy mb-6">
          {t("خريطة الطلب — عُمان", "Demand Map — Oman")}
        </h3>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div className="relative aspect-[4/3] max-h-[320px]">
            <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Oman map">
              <path
                d="M35 15 L55 12 L72 18 L85 28 L92 42 L88 58 L82 72 L70 85 L55 92 L40 88 L28 75 L22 58 L20 42 L25 28 Z"
                fill="rgba(15,118,84,0.06)"
                stroke="rgba(7,26,51,0.15)"
                strokeWidth="0.5"
              />
              {cities.map((c) => {
                const active = selected === c.id;
                return (
                  <g key={c.id} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                    {active && (
                      <motion.circle
                        cx={c.mapX}
                        cy={c.mapY}
                        r="8"
                        fill="none"
                        stroke="#0F7654"
                        strokeWidth="0.5"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                    <motion.circle
                      cx={c.mapX}
                      cy={c.mapY}
                      r={active ? 4 : 3}
                      fill={active ? "#0F7654" : "#071A33"}
                      animate={{ scale: active ? [1, 1.15, 1] : 1 }}
                      transition={{ repeat: active ? Infinity : 0, duration: 2 }}
                    />
                    <text
                      x={c.mapX}
                      y={c.mapY - 6}
                      textAnchor="middle"
                      className="fill-navy text-[4px] font-medium"
                      style={{ fontSize: "4px" }}
                    >
                      {locale === "ar" ? c.name_ar : c.name_en}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <motion.div
            key={city.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <p className="text-3xl font-bold text-navy">
                {locale === "ar" ? city.name_ar : city.name_en}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {city.orders.toLocaleString()} {t("طلب", "orders")} · {city.tailors} {t("خياط", "tailors")}
              </p>
            </div>
            <div className="space-y-3 border-t border-border/40 pt-4">
              {[
                { label: t("اللون الأكثر طلبًا", "Top color"), value: city.topColor },
                { label: t("القماش الأكثر طلبًا", "Top fabric"), value: city.topFabric },
                { label: t("متوسط الطلب", "Avg order"), value: city.avgOrder > 0 ? `${city.avgOrder} ر.ع` : "—" },
                { label: "GMV", value: city.gmv > 0 ? formatOMR(city.gmv) : "—" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold text-navy">{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
