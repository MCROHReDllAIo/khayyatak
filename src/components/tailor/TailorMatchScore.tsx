"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

interface TailorMatchScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function TailorMatchScore({ score, size = "md", showLabel = true }: TailorMatchScoreProps) {
  const { t } = useLocale();

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const color =
    score >= 90 ? "bg-primary text-white" : score >= 80 ? "bg-omani-gold/90 text-navy" : "bg-navy/80 text-white";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("inline-flex items-center gap-1.5 rounded-full font-bold shadow-sm", color, sizeClasses[size])}
    >
      <Sparkles className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {showLabel && <span className="opacity-80 font-normal">{t("AI Match", "AI Match")}</span>}
      <span>{score}%</span>
    </motion.div>
  );
}
