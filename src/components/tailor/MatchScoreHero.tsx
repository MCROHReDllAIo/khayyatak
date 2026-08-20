"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedScore } from "@/components/ui/AnimatedScore";
import { cn } from "@/lib/utils";

const REASON_KEYS = [
  { key: "style", ar: "الستايل", en: "Style" },
  { key: "price", ar: "السعر", en: "Price" },
  { key: "rating", ar: "التقييم", en: "Rating" },
  { key: "speed", ar: "السرعة", en: "Speed" },
  { key: "location", ar: "الموقع", en: "Location" },
];

interface MatchScoreHeroProps {
  score: number;
  tailorName: string;
  reasons: string[];
  locale?: "ar" | "en";
  className?: string;
}

export function MatchScoreHero({
  score,
  tailorName,
  reasons,
  locale = "ar",
  className,
}: MatchScoreHeroProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/50 bg-white px-6 py-10 md:px-12 md:py-14",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(15,118,84,0.06),transparent_60%)]" />
      <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3">
            {locale === "ar" ? "أفضل تطابق لك" : "Your best match"}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2">{tailorName}</h2>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-sm text-primary hover:underline"
          >
            {revealed
              ? locale === "ar"
                ? "إخفاء الأسباب"
                : "Hide reasons"
              : locale === "ar"
                ? "لماذا؟"
                : "Why?"}
          </button>
          <AnimatePresence>
            {revealed && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {reasons.map((reason, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                      ✓
                    </span>
                    {reason}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          {!revealed && (
            <div className="mt-4 flex flex-wrap gap-2">
              {REASON_KEYS.map((r, i) => (
                <span
                  key={r.key}
                  className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-border/60 text-muted-foreground"
                >
                  {locale === "ar" ? r.ar : r.en}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          <AnimatedScore value={score} size="lg" label="AI MATCH" />
        </div>
      </div>
    </section>
  );
}
