"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { Spotlight } from "./Spotlight";
import { TourDemo, TourProgress } from "./TourProgress";
import type { TourStep } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

const EDGE = 16;
const AI_TARGETS = ["home-ai", "home-ai-fab", "home-ai-input", "home-ai-controls", "home-ai-panel", "home-innovate"];

function viewportSize() {
  const vv = window.visualViewport;
  return {
    vw: vv?.width ?? window.innerWidth,
    vh: vv?.height ?? window.innerHeight,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function isAiTarget(target?: string) {
  if (!target) return false;
  return AI_TARGETS.some((id) => target.includes(id));
}

function computePlacement(
  rect: DOMRect | null,
  preferred: TourStep["placement"],
  cardW: number,
  cardH: number,
  forceDock: boolean
): { top: number; left: number; side: string; docked: boolean } {
  const { vw, vh } = viewportSize();
  const maxLeft = Math.max(EDGE, vw - cardW - EDGE);
  const maxTop = Math.max(EDGE, vh - cardH - EDGE);

  // Dock: keep tooltip fully on-screen (center / bottom), never overlap AI sheet input
  if (forceDock || !rect || preferred === "center") {
    const top =
      preferred === "center" || !rect
        ? clamp((vh - cardH) / 2, EDGE, maxTop)
        : clamp(EDGE + 72, EDGE, Math.min(maxTop, vh * 0.12));
    const left = clamp((vw - cardW) / 2, EDGE, maxLeft);
    return { top, left, side: "center", docked: true };
  }

  const space = {
    top: rect.top,
    bottom: vh - rect.bottom,
    left: rect.left,
    right: vw - rect.right,
  };

  let side: string = preferred && preferred !== "auto" ? preferred : "bottom";
  if (!preferred || preferred === "auto") {
    // Prefer sides that fit the real card height
    const ranked = (
      [
        ["bottom", space.bottom],
        ["top", space.top],
        ["left", space.left],
        ["right", space.right],
      ] as Array<[string, number]>
    ).sort((a, b) => b[1] - a[1]);
    side = ranked[0]?.[0] ?? "bottom";
    if (space[side as keyof typeof space] < cardH + 24) {
      return {
        top: clamp(EDGE + 64, EDGE, maxTop),
        left: clamp((vw - cardW) / 2, EDGE, maxLeft),
        side: "center",
        docked: true,
      };
    }
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

  top = clamp(top, EDGE, maxTop);
  left = clamp(left, EDGE, maxLeft);
  return { top, left, side, docked: false };
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
  const [cardSize, setCardSize] = useState({ w: 360, h: 320 });
  const [vw, setVw] = useState(1200);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[stepIndex];
  const prefersReduced = useReducedMotion();
  const reduced = Boolean(prefersReduced);
  const directionRef = useRef(1);
  const prevIndexRef = useRef(stepIndex);

  useEffect(() => {
    directionRef.current = stepIndex >= prevIndexRef.current ? 1 : -1;
    prevIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const update = () => setVw(viewportSize().vw);
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !cardRef.current) return;
    const el = cardRef.current;
    const measureCard = () => {
      const r = el.getBoundingClientRect();
      setCardSize({
        w: Math.ceil(r.width) || 360,
        h: Math.ceil(r.height) || 320,
      });
    };
    measureCard();
    const ro = new ResizeObserver(measureCard);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, stepIndex, step?.id]);

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
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
      setRect(el.getBoundingClientRect());
    };

    const t0 = window.setTimeout(measure, 50);
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    window.visualViewport?.addEventListener("resize", onResize);
    const id = window.setInterval(measure, 500);
    return () => {
      window.clearTimeout(t0);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.visualViewport?.removeEventListener("resize", onResize);
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

  const narrow = vw < 900;
  const forceDock =
    narrow ||
    step?.placement === "center" ||
    isAiTarget(step?.target) ||
    !rect;

  const pos = useMemo(
    () =>
      typeof window !== "undefined"
        ? computePlacement(rect, step?.placement ?? "auto", cardSize.w, cardSize.h, forceDock)
        : { top: 24, left: 16, side: "center", docked: true },
    [rect, step, cardSize.w, cardSize.h, forceDock]
  );

  if (!mounted || !step) return null;

  const title = locale === "ar" ? step.titleAr : step.titleEn;
  const body = locale === "ar" ? step.bodyAr : step.bodyEn;
  const caveat = locale === "ar" ? step.caveatAr : step.caveatEn;
  const isLast = stepIndex >= steps.length - 1;
  const isFirst = stepIndex === 0;
  const dir = directionRef.current;
  const slideIn = reduced ? 0 : (locale === "ar" ? -1 : 1) * dir * 20;
  const slideOut = reduced ? 0 : (locale === "ar" ? -1 : 1) * dir * -16;

  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="tour-root"
          className="fixed inset-0 z-[90] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.25 }}
        >
          <Spotlight rect={step.target ? rect : null} reducedMotion={reduced} />

          <div className="fixed inset-0 z-[91]" onClick={onSkip} role="presentation" />

          <div
            className="pointer-events-none fixed inset-0 z-[95] p-4"
            style={{
              paddingTop: "max(1rem, env(safe-area-inset-top))",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              paddingLeft: "max(1rem, env(safe-area-inset-left))",
              paddingRight: "max(1rem, env(safe-area-inset-right))",
            }}
          >
            <motion.div
              ref={cardRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tour-title"
              className={cn(
                "pointer-events-auto absolute w-[min(360px,calc(100vw-2rem))] max-w-full",
                "max-h-[min(70dvh,560px)] overflow-y-auto overscroll-contain",
                "rounded-2xl border border-white/15",
                "bg-[#0b1a2e]/95 text-white shadow-2xl backdrop-blur-xl",
                "ring-1 ring-omani-gold/15"
              )}
              initial={reduced ? false : { opacity: 0, y: 14, scale: 0.97 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                top: pos.top,
                left: pos.left,
              }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{
                opacity: { duration: 0.25 },
                scale: { type: "spring", stiffness: 360, damping: 28 },
                y: { type: "spring", stiffness: 360, damping: 28 },
                top: { type: "spring", stiffness: 280, damping: 30 },
                left: { type: "spring", stiffness: 280, damping: 30 },
              }}
              style={{ top: pos.top, left: pos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute -top-12 -end-8 h-24 w-24 rounded-full bg-omani-gold/10 blur-3xl" />

              <div className="relative p-4 md:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <TourProgress index={stepIndex} total={steps.length} />
                  <button
                    type="button"
                    onClick={onSkip}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 shrink-0"
                    aria-label={t("تخطي الجولة", "Skip tour")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step.id}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, x: slideIn }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: slideOut }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3"
                  >
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
                  </motion.div>
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-2 pt-1">
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
