"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedScoreProps {
  value: number;
  size?: "md" | "lg" | "xl";
  label?: string;
  sublabel?: string;
  className?: string;
  inverted?: boolean;
}

export function AnimatedScore({
  value,
  size = "lg",
  label,
  sublabel,
  className = "",
  inverted = false,
}: AnimatedScoreProps) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    spring.set(value);
    const unsub = display.on("change", (v) => setShown(v));
    return unsub;
  }, [value, spring, display]);

  const sizes = {
    md: "text-4xl",
    lg: "text-6xl md:text-7xl",
    xl: "text-7xl md:text-8xl",
  };

  return (
    <div className={`text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={`font-bold tracking-tight tabular-nums ${sizes[size]} ${inverted ? "text-white" : "text-navy"}`}>
          {shown}
          <span className={inverted ? "text-omani-gold" : "text-primary"}>%</span>
        </span>
      </motion.div>
      {label && (
        <p className={`mt-2 text-sm font-semibold uppercase tracking-[0.2em] ${inverted ? "text-omani-gold" : "text-primary"}`}>{label}</p>
      )}
      {sublabel && <p className={`mt-1 text-sm ${inverted ? "text-white/60" : "text-muted-foreground"}`}>{sublabel}</p>}
    </div>
  );
}
