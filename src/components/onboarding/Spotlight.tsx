"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  rect: DOMRect | null;
  padding?: number;
  className?: string;
  reducedMotion?: boolean;
}

export function Spotlight({
  rect,
  padding = 12,
  className,
  reducedMotion = false,
}: SpotlightProps) {
  const ease = [0.22, 1, 0.36, 1] as const;
  const duration = reducedMotion ? 0 : 0.48;

  if (!rect) {
    return (
      <motion.div
        className={cn("fixed inset-0 z-[90] bg-navy/80", className)}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.28 }}
      />
    );
  }

  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 300;
  const top = Math.min(Math.max(8, rect.top - padding), vh - 48);
  const left = Math.min(Math.max(8, rect.left - padding), vw - 48);
  const width = Math.max(40, Math.min(vw - left - 8, rect.width + padding * 2));
  const height = Math.max(40, Math.min(vh - top - 8, rect.height + padding * 2));

  return (
    <div className={cn("fixed inset-0 z-[90] pointer-events-none", className)} aria-hidden>
      {/* Animated cutout via giant box-shadow */}
      <motion.div
        className="absolute rounded-2xl bg-transparent"
        initial={false}
        animate={{
          top,
          left,
          width,
          height,
          boxShadow: "0 0 0 9999px rgba(7, 26, 51, 0.78)",
        }}
        transition={{ duration, ease }}
      />

      {/* Gold ring */}
      <motion.div
        className="absolute rounded-2xl border-2 border-omani-gold/70"
        initial={false}
        animate={{
          top,
          left,
          width,
          height,
        }}
        transition={{ duration, ease }}
      />

      {/* Soft pulse glow */}
      {!reducedMotion && (
        <motion.div
          className="absolute rounded-2xl"
          initial={false}
          animate={{
            top,
            left,
            width,
            height,
            boxShadow: [
              "0 0 0 0 rgba(200,164,93,0)",
              "0 0 36px 6px rgba(200,164,93,0.28)",
              "0 0 18px 2px rgba(200,164,93,0.14)",
            ],
          }}
          transition={{
            top: { duration, ease },
            left: { duration, ease },
            width: { duration, ease },
            height: { duration, ease },
            boxShadow: {
              duration: 1.8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            },
          }}
        />
      )}

      {/* Light sweep across highlight */}
      {!reducedMotion && (
        <motion.div
          className="absolute overflow-hidden rounded-2xl"
          initial={false}
          animate={{ top, left, width, height }}
          transition={{ duration, ease }}
        >
          <motion.div
            className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-white/12 to-transparent"
            animate={{ x: ["-130%", "230%"] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1.4,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
