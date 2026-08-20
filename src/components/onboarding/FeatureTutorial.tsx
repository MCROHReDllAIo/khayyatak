"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

const FEATURE_LS = "kytk_feature_tutorials";

interface FeatureTutorialProps {
  featureId: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  /** Only show if never dismissed for this feature */
  auto?: boolean;
}

export function FeatureTutorial({
  featureId,
  titleAr,
  titleEn,
  bodyAr,
  bodyEn,
  auto = true,
}: FeatureTutorialProps) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!auto) return;
    try {
      const map = JSON.parse(localStorage.getItem(FEATURE_LS) ?? "{}") as Record<string, boolean>;
      if (!map[featureId]) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [featureId, auto]);

  const dismiss = () => {
    setOpen(false);
    try {
      const map = JSON.parse(localStorage.getItem(FEATURE_LS) ?? "{}") as Record<string, boolean>;
      map[featureId] = true;
      localStorage.setItem(FEATURE_LS, JSON.stringify(map));
    } catch {
      /* ignore */
    }
    void fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "event", eventType: "feature_tutorial_opened", stepId: featureId }),
    }).catch(() => null);
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4 md:inset-auto md:bottom-6 md:end-6 md:w-[340px]">
      <div
        className={cn(
          "rounded-2xl border border-navy/10 bg-white shadow-premium p-4 text-navy",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
        role="status"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
              {t("شرح سريع", "Quick tip")}
            </p>
            <h3 className="font-bold text-sm">{locale === "ar" ? titleAr : titleEn}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {locale === "ar" ? bodyAr : bodyEn}
            </p>
          </div>
          <button type="button" onClick={dismiss} className="p-1 rounded-lg hover:bg-muted" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full h-9 rounded-xl bg-navy text-white text-xs font-medium"
        >
          {t("فهمت", "Got it")}
        </button>
      </div>
    </div>,
    document.body
  );
}
