"use client";

import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";

export function DemoModeBanner() {
  const { t } = useLocale();

  return (
    <div className="bg-omani-gold/10 border-b border-omani-gold/20 px-4 py-1.5 text-center text-xs font-medium text-navy">
      <Sparkles className="inline h-3 w-3 me-1 text-omani-gold" />
      {t("وضع العرض التجريبي — DEMO MODE", "Demo Mode — Prototype Data")}
    </div>
  );
}
