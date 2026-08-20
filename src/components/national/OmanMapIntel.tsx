"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CITIES } from "@/lib/demo-data";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { useLocale } from "@/lib/context/locale-context";

const CITY_NODES: Record<
  string,
  { x: number; y: number; orders: number; topColor: string; topFabric: string; avgOrder: string }
> = {
  muscat: { x: 78, y: 38, orders: 420, topColor: "أبيض", topFabric: "كتان", avgOrder: "21 ر.ع" },
  salalah: { x: 42, y: 82, orders: 186, topColor: "بيج", topFabric: "صيفي", avgOrder: "17 ر.ع" },
  sohar: { x: 55, y: 18, orders: 98, topColor: "كحلي", topFabric: "قطني", avgOrder: "18 ر.ع" },
  nizwa: { x: 58, y: 52, orders: 74, topColor: "أبيض", topFabric: "فاخر", avgOrder: "22 ر.ع" },
  sur: { x: 88, y: 55, orders: 52, topColor: "أسود", topFabric: "كريب", avgOrder: "19 ر.ع" },
};

export function OmanMapIntel() {
  const { t, locale } = useLocale();
  const [selected, setSelected] = useState<string>("muscat");
  const node = CITY_NODES[selected];
  const city = CITIES.find((c) => c.id === selected);

  return (
    <div className="relative rounded-3xl border border-border/50 bg-omani-cream overflow-hidden min-h-[420px]">
      <GeometricPattern className="text-navy opacity-40" />
      <div className="relative p-6 md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 mb-1">
          Aggregate Demo Intelligence
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
              {CITIES.map((c) => {
                const n = CITY_NODES[c.id];
                if (!n) return null;
                const active = selected === c.id;
                return (
                  <g key={c.id} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                    {active && (
                      <motion.circle
                        cx={n.x}
                        cy={n.y}
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
                      cx={n.x}
                      cy={n.y}
                      r={active ? 4 : 3}
                      fill={active ? "#0F7654" : "#071A33"}
                      animate={{ scale: active ? [1, 1.15, 1] : 1 }}
                      transition={{ repeat: active ? Infinity : 0, duration: 2 }}
                    />
                    <text
                      x={n.x}
                      y={n.y - 6}
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
            key={selected}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <p className="text-3xl font-bold text-navy">
                {locale === "ar" ? city?.name_ar : city?.name_en}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {node.orders} {t("طلب — Demo", "orders — Demo")}
              </p>
            </div>
            <div className="space-y-3 border-t border-border/40 pt-4">
              {[
                { label: t("اللون الأكثر طلبًا", "Top color"), value: node.topColor },
                { label: t("القماش الأكثر طلبًا", "Top fabric"), value: node.topFabric },
                { label: t("متوسط الطلب", "Avg order"), value: node.avgOrder },
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
