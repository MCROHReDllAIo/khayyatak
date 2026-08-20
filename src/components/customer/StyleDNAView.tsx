"use client";

import { motion } from "framer-motion";
import type { StyleDNA } from "@/lib/ai/style-dna";
import { DESIGN_COLORS } from "@/types";

const COLOR_HEX: Record<string, string> = {
  أبيض: "#FFFFFF",
  كحلي: "#071A33",
  أسود: "#101828",
  بيج: "#E8DFD0",
};

function RingStat({
  label,
  value,
  color = "#0F7654",
  delay = 0,
}: {
  label: string;
  value: number;
  color?: string;
  delay?: number;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#F5F0E7" strokeWidth="6" />
          <motion.circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: delay + 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-navy tabular-nums">{value}%</span>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground text-center">
        {label}
      </p>
    </motion.div>
  );
}

interface StyleDNAViewProps {
  dna: StyleDNA;
}

export function StyleDNAView({ dna }: StyleDNAViewProps) {
  const formalScore = dna.styleTags.includes("Formal") ? 74 : 60;
  const minimalScore = dna.styleTags.includes("Minimal") ? 68 : 55;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,164,93,0.08),transparent_50%)]" />
      <div className="relative p-8 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-2">Style DNA</p>
        <h3 className="text-2xl md:text-3xl font-bold text-navy mb-8">ذوقي</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {dna.preferredColors.slice(0, 2).map((c, i) => (
            <RingStat
              key={c.name}
              label={c.name.toUpperCase()}
              value={c.percent}
              color={i === 0 ? "#0F7654" : "#071A33"}
              delay={i * 0.1}
            />
          ))}
          <RingStat label="FORMAL" value={formalScore} color="#C8A45D" delay={0.2} />
          <RingStat label="MINIMAL" value={minimalScore} color="#667085" delay={0.3} />
        </div>

        <div className="fashion-divider pt-8 grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              الألوان · Colors
            </p>
            <div className="flex flex-wrap gap-3">
              {dna.preferredColors.map((c) => {
                const hex =
                  COLOR_HEX[c.name] ??
                  DESIGN_COLORS.find((dc) => dc.ar === c.name)?.hex ??
                  "#E5E0D8";
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="swatch" style={{ backgroundColor: hex }} />
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.percent}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              الأقمشة · Fabrics
            </p>
            <div className="flex flex-wrap gap-2">
              {dna.preferredFabrics.map((f) => (
                <span
                  key={f}
                  className="px-4 py-2 rounded-full border border-border/50 text-sm bg-omani-cream/50"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="fashion-divider pt-6 mt-8 flex flex-wrap gap-2">
          {dna.styleTags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary border border-primary/20 rounded-md"
            >
              {tag}
            </motion.span>
          ))}
          <span className="ms-auto text-xs text-muted-foreground self-center">
            {dna.budgetRange} · Demo Style DNA
          </span>
        </div>
      </div>
    </div>
  );
}
