"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Store, Users, ShoppingBag, Coins } from "lucide-react";
import type { CityCoverage } from "@/lib/admin/types";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR, cn } from "@/lib/utils";

export function NationalCoverageSection({
  cities,
  showcaseNetwork,
}: {
  cities: CityCoverage[];
  showcaseNetwork?: boolean;
}) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<CityCoverage | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const totals = useMemo(() => {
    return {
      tailors: cities.reduce((s, c) => s + c.tailors, 0),
      orders: cities.reduce((s, c) => s + c.orders, 0),
      gmv: cities.reduce((s, c) => s + c.gmv, 0),
      active: cities.filter((c) => c.tailors > 0).length,
    };
  }, [cities]);

  const maxTailors = Math.max(1, ...cities.map((c) => c.tailors));

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-navy/10 bg-white shadow-[0_24px_60px_-40px_rgba(7,26,51,0.55)]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy/8 bg-gradient-to-l from-[#f7f4ee] to-white px-6 py-5 md:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-omani-gold">
            {showcaseNetwork
              ? t("شبكة عرض + بيانات حية", "Showcase + live data")
              : t("شبكة حية", "Live network")}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-navy">{t("التغطية الوطنية", "National Coverage")}</h2>
          <p className="mt-1 text-sm text-navy/45">
            {showcaseNetwork
              ? t(
                  "خريطة تفاعلية — نقاط المدن من شبكة العرض عند فراغ الشبكة الحية. GMV والطلبات تبقى أرقامًا حقيقية فقط.",
                  "Interactive map — city dots use showcase network when live network is empty. GMV & orders stay real-only."
                )
              : t("خريطة تفاعلية لتغطية شبكة الخياطين في سلطنة عُمان", "Interactive map of tailor network across Oman")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: t("مدن نشطة", "Active cities"), value: totals.active },
            { label: t("خياطون", "Tailors"), value: totals.tailors },
            { label: t("طلبات", "Orders"), value: totals.orders },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-navy/10 bg-navy px-3.5 py-2 text-center min-w-[88px]"
            >
              <p className="text-lg font-bold text-omani-gold">{s.value}</p>
              <p className="text-[10px] text-white/55">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative grid lg:grid-cols-5 gap-0">
        <div className="lg:col-span-3 relative min-h-[400px] overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#e8f5ef_0%,transparent_50%),linear-gradient(165deg,#f7f4ee_0%,#eef2f6_45%,#e4ebe7_100%)] p-6">
          {/* Depth layers for a more dimensional map plane */}
          <div className="pointer-events-none absolute inset-8 rounded-[2rem] border border-navy/5 bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" />
          <div
            className="pointer-events-none absolute bottom-10 start-1/2 h-8 w-[70%] -translate-x-1/2 rounded-[100%] bg-navy/10 blur-2xl"
            aria-hidden
          />

          <svg viewBox="0 0 100 100" className="relative z-[1] mx-auto h-full w-full max-h-[360px] drop-shadow-sm" aria-label="Oman map">
            <defs>
              <linearGradient id="omanFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F7654" stopOpacity="0.28" />
                <stop offset="55%" stopColor="#0c2340" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#C8A45D" stopOpacity="0.12" />
              </linearGradient>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* subtle 3D offset silhouette */}
            <path
              d="M55 10 L72 14 L85 30 L88 47 L82 64 L75 80 L58 90 L42 87 L28 74 L22 57 L25 40 L35 24 L48 14 Z"
              fill="#071A33"
              opacity="0.08"
              transform="translate(1.2 1.8)"
            />
            <path
              d="M55 8 L72 12 L85 28 L88 45 L82 62 L75 78 L58 88 L42 85 L28 72 L22 55 L25 38 L35 22 L48 12 Z"
              fill="url(#omanFace)"
              stroke="#0F7654"
              strokeWidth="0.7"
              strokeOpacity="0.55"
              filter="url(#softGlow)"
            />
            {cities.map((city) => {
              const active = city.tailors > 0;
              const r = active ? 2.2 + (city.tailors / maxTailors) * 2.8 : 1.6;
              const hot = hovered === city.id || selected?.id === city.id;
              return (
                <g key={city.id}>
                  {active && (
                    <circle
                      cx={city.mapX}
                      cy={city.mapY}
                      r={r + 3.5}
                      fill={city.isShowcaseNetwork ? "#C8A45D" : "#0F7654"}
                      opacity={0.15}
                    />
                  )}
                  <circle
                    cx={city.mapX}
                    cy={city.mapY}
                    r={hot ? r + 1.2 : r}
                    fill={active ? (city.isShowcaseNetwork ? "#C8A45D" : "#0F7654") : "#94a3b8"}
                    stroke="#071A33"
                    strokeWidth="0.45"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHovered(city.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(city)}
                  />
                  {(hot || active) && (
                    <text
                      x={city.mapX}
                      y={city.mapY - r - 3}
                      textAnchor="middle"
                      fontSize="3.2"
                      fill="#071A33"
                      fontWeight="700"
                    >
                      {city.name_ar}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hovered && !selected && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-5 start-5 z-[2] max-w-xs rounded-2xl bg-navy px-4 py-3 text-white shadow-xl"
            >
              {(() => {
                const c = cities.find((x) => x.id === hovered);
                if (!c) return null;
                return (
                  <>
                    <p className="font-bold">{c.name_ar}</p>
                    <p className="mt-1 text-xs text-white/70">
                      {c.tailors} {t("خياط", "tailors")} · {c.orders.toLocaleString()} {t("طلب", "orders")}
                      {c.isShowcaseNetwork ? ` · ${t("عرض تجريبي", "showcase")}` : ""}
                    </p>
                  </>
                );
              })()}
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-2 max-h-[440px] space-y-2 overflow-y-auto border-s border-navy/8 bg-[#faf8f4] p-4">
          {cities.map((city) => {
            const pct = Math.round((city.tailors / maxTailors) * 100);
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelected(city)}
                className={cn(
                  "w-full rounded-2xl border p-3.5 text-start transition-all",
                  selected?.id === city.id
                    ? "border-primary bg-white shadow-md ring-1 ring-primary/15"
                    : "border-transparent bg-white/80 hover:border-navy/10 hover:bg-white"
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-bold text-navy">{city.name_ar}</span>
                  </div>
                  {city.isShowcaseNetwork && (
                    <span className="rounded-full bg-omani-gold/20 px-2 py-0.5 text-[9px] font-bold text-navy">
                      {t("عرض", "Demo")}
                    </span>
                  )}
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-navy/5">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      city.isShowcaseNetwork ? "bg-omani-gold" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-navy/55">
                  <span className="inline-flex items-center gap-1">
                    <Store className="h-3 w-3" /> {city.tailors} {t("خياط", "Tailors")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" /> {city.orders.toLocaleString()} {t("طلب", "Orders")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {city.customers.toLocaleString()} {t("عميل", "Customers")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Coins className="h-3 w-3" /> {formatOMR(city.gmv)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between bg-navy p-6 text-white">
              <div>
                <p className="text-xs uppercase tracking-wider text-omani-gold">
                  {t("تفاصيل المدينة", "City Detail")}
                </p>
                <h3 className="mt-1 text-2xl font-bold">{selected.name_ar}</h3>
                {selected.isShowcaseNetwork && (
                  <p className="mt-2 text-xs text-white/60">
                    {t("أرقام الشبكة التجريبية للمظهر — الطلبات وGMV حقيقية فقط", "Showcase network for appearance — orders & GMV remain real-only")}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-6">
              {[
                [t("الخياطون", "Tailors"), selected.tailors],
                [t("الطلبات", "Orders"), selected.orders.toLocaleString()],
                [t("العملاء", "Customers"), selected.customers.toLocaleString()],
                ["GMV", formatOMR(selected.gmv)],
                [t("أعلى فئة", "Top Category"), selected.topCategory],
                [t("متوسط الطلب", "Avg Order"), selected.avgOrder > 0 ? `${selected.avgOrder} ر.ع` : "—"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between border-b border-navy/8 py-2.5">
                  <span className="text-sm text-navy/50">{label}</span>
                  <span className="font-semibold text-navy">{val}</span>
                </div>
              ))}
              <div className="mt-2 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <p className="mb-1 text-xs font-semibold text-primary">AI Insight</p>
                <p className="text-sm text-navy">{t(selected.aiInsight_ar, selected.aiInsight_en)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
