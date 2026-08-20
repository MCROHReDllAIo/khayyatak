"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { Spotlight } from "./Spotlight";
import { TourDemo, TourProgress } from "./TourProgress";
import type { TourStep } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

function preferReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function computePlacement(
  rect: DOMRect | null,
  preferred: TourStep["placement"]
): { top: number; left: number; side: string } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(360, vw - 32);
  const cardH = 280;

  if (!rect || preferred === "center") {
    return { top: Math.max(24, (vh - cardH) / 2), left: Math.max(16, (vw - cardW) / 2), side: "center" };
  }

  const space = {
    top: rect.top,
    bottom: vh - rect.bottom,
    left: rect.left,
    right: vw - rect.right,
  };

  let side: string = preferred && preferred !== "auto" ? preferred : "bottom";
  if (!preferred || preferred === "auto") {
    const ranked = Object.entries(space).sort((a, b) => b[1] - a[1]);
    side = ranked[0]?.[0] ?? "bottom";
  }

  let top = rect.bottom + 14;
  let left = rect.left + rect.width / 2 - cardW / 2;

  if (side === "top") top = rect.top - cardH - 14;
  if (side === "left") {
    top = rect.top + rect.height / 2 - cardH / 2;
    left = rect.left - cardW - 14;
  }
  if (side === "right") {
    top = rect.top + rect.height / 2 - cardH / 2;
    left = rect.right + 14;
  }

  top = Math.min(Math.max(16, top), vh - cardH - 16);
  left = Math.min(Math.max(16, left), vw - cardW - 16);
  return { top, left, side };
}

interface OnboardingTourProps {
  open: boolean;
  steps: TourStep[];
  stepIndex: number;
  onStepIndex: (i: number) => void;
  onSkip: () => void;
  onComplete: () => void;
  onStepEnter?: (step: TourStep) => void;
}

export function OnboardingTour({
  open,
  steps,
  stepIndex,
  onStepIndex,
  onSkip,
  onComplete,
  onStepEnter,
}: OnboardingTourProps) {
  const { t, locale } = useLocale();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const step = steps[stepIndex];
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const reduced = preferReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !step) return;
    onStepEnter?.(step);

    const measure = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
      setRect(el.getBoundingClientRect());
    };

    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const id = window.setInterval(measure, 400);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(id);
    };
  }, [open, step, onStepEnter, reduced]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (stepIndex >= steps.length - 1) onComplete();
        else onStepIndex(stepIndex + 1);
      }
      if (e.key === "ArrowLeft" && stepIndex > 0) onStepIndex(stepIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, stepIndex, steps.length, onSkip, onComplete, onStepIndex]);

  const pos = useMemo(
    () => (typeof window !== "undefined" ? computePlacement(rect, step?.placement ?? "auto") : { top: 0, left: 0, side: "center" }),
    [rect, step]
  );

  if (!mounted || !open || !step) return null;

  const title = locale === "ar" ? step.titleAr : step.titleEn;
  const body = locale === "ar" ? step.bodyAr : step.bodyEn;
  const caveat = locale === "ar" ? step.caveatAr : step.caveatEn;
  const isLast = stepIndex >= steps.length - 1;
  const isFirst = stepIndex === 0;

  const card = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      className={cn(
        "z-[95] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-[#0b1a2e] text-white shadow-2xl",
        isMobile || step.placement === "center" || !rect
          ? "fixed inset-x-4 bottom-4 md:inset-x-auto md:bottom-auto"
          : "fixed",
        reduced ? "" : "animate-in fade-in duration-200"
      )}
      style={
        isMobile || step.placement === "center" || !rect
          ? undefined
          : { top: pos.top, left: pos.left }
      }
    >
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <TourProgress index={stepIndex} total={steps.length} />
          <button
            type="button"
            onClick={onSkip}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            aria-label={t("تخطي الجولة", "Skip tour")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h2 id="tour-title" className="text-lg font-bold tracking-tight font-arabic">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-white/65 leading-relaxed">{body}</p>
        </div>

        <TourDemo demo={step.demo} />

        {caveat && (
          <p className="text-[11px] text-omani-gold/80 leading-snug border border-omani-gold/20 rounded-lg px-2.5 py-2 bg-omani-gold/5">
            {caveat}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {!isFirst && (
            <button
              type="button"
              onClick={() => onStepIndex(stepIndex - 1)}
              className="h-10 px-3 rounded-xl text-sm text-white/70 hover:bg-white/10"
            >
              {t("السابق", "Back")}
            </button>
          )}
          <button
            type="button"
            onClick={onSkip}
            className="h-10 px-3 rounded-xl text-sm text-white/40 hover:text-white/70 ms-auto"
          >
            {t("تخطي", "Skip")}
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onComplete() : onStepIndex(stepIndex + 1))}
            className="h-10 px-4 rounded-xl bg-omani-gold text-navy text-sm font-semibold hover:bg-omani-gold/90"
          >
            {isLast
              ? t("ابدأ مع خياطك", "Start with Khayyatak")
              : t("التالي", "Next")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      <Spotlight rect={step.target ? rect : null} />
      <div
        className="fixed inset-0 z-[91]"
        onClick={onSkip}
        onKeyDown={(e) => e.key === "Escape" && onSkip()}
        role="presentation"
      />
      <div
        className="pointer-events-auto relative z-[95]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {card}
      </div>
    </>,
    document.body
  );
}
