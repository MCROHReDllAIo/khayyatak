"use client";

import { useCallback, useEffect, useState } from "react";
import { OnboardingTour } from "./OnboardingTour";
import { TourWelcome } from "./TourWelcome";
import { MAIN_TOUR_STEPS, CUSTOMER_TOUR_STEPS } from "@/lib/onboarding/tour-steps";
import {
  MAIN_TOUR_ID,
  MAIN_TOUR_VERSION,
  CUSTOMER_TOUR_ID,
  CUSTOMER_TOUR_VERSION,
} from "@/lib/onboarding/types";
import type { TourStep } from "@/lib/onboarding/types";
import { useAuth } from "@/lib/context/app-context";

type TourKind = "main" | "customer";

function tourConfig(kind: TourKind) {
  if (kind === "customer") {
    return {
      id: CUSTOMER_TOUR_ID,
      version: CUSTOMER_TOUR_VERSION,
      steps: CUSTOMER_TOUR_STEPS,
      restartEvent: "kytk-restart-customer-tour",
      trackScope: "customer",
    };
  }
  return {
    id: MAIN_TOUR_ID,
    version: MAIN_TOUR_VERSION,
    steps: MAIN_TOUR_STEPS,
    restartEvent: "kytk-restart-tour",
    trackScope: "home",
  };
}

function lsKey(tourId: string, version: string) {
  return `kytk_tour_${tourId}_${version}`;
}

function readLocal(key: string): { completed?: boolean; skipped?: boolean; currentStep?: number } | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(
  key: string,
  state: { completed: boolean; skipped: boolean; currentStep: number }
) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

async function track(
  eventType: string,
  stepId: string | undefined,
  tourId: string,
  tourVersion: string
) {
  try {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "event", eventType, stepId, tourId, tourVersion }),
    });
  } catch {
    /* ignore */
  }
}

async function persist(
  key: string,
  patch: { completed?: boolean; skipped?: boolean; currentStep?: number },
  tourId: string,
  tourVersion: string
) {
  writeLocal(key, {
    completed: patch.completed ?? false,
    skipped: patch.skipped ?? false,
    currentStep: patch.currentStep ?? 0,
  });
  try {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", ...patch, tourId, tourVersion }),
    });
  } catch {
    /* guest / offline — local only */
  }
}

interface UseOnboardingOptions {
  kind?: TourKind;
  onStepEnter?: (step: TourStep) => void;
  autoStart?: boolean;
}

export function useOnboardingTour({
  kind = "main",
  onStepEnter,
  autoStart = true,
}: UseOnboardingOptions = {}) {
  const cfg = tourConfig(kind);
  const key = lsKey(cfg.id, cfg.version);
  const { isAuthenticated, authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      const local = readLocal(key);
      if (local?.completed || local?.skipped) {
        if (!cancelled) setReady(true);
        return;
      }

      if (isAuthenticated) {
        try {
          const res = await fetch(
            `/api/onboarding?tourId=${encodeURIComponent(cfg.id)}&tourVersion=${encodeURIComponent(cfg.version)}`
          );
          const data = await res.json();
          if (data.state?.completed || data.state?.skipped) {
            writeLocal(key, {
              completed: !!data.state.completed,
              skipped: !!data.state.skipped,
              currentStep: data.state.currentStep ?? 0,
            });
            if (!cancelled) setReady(true);
            return;
          }
          if (typeof data.state?.currentStep === "number" && data.state.currentStep > 0) {
            if (!cancelled) {
              setStepIndex(data.state.currentStep);
              setTourOpen(true);
              setReady(true);
            }
            return;
          }
        } catch {
          /* fall through to welcome */
        }
      }

      if (!cancelled && autoStart) {
        setWelcomeOpen(true);
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, autoStart, key, cfg.id, cfg.version]);

  const startTour = useCallback(() => {
    setWelcomeOpen(false);
    setStepIndex(0);
    setTourOpen(true);
    void track("tour_started", cfg.trackScope, cfg.id, cfg.version);
    void persist(key, { completed: false, skipped: false, currentStep: 0 }, cfg.id, cfg.version);
  }, [cfg.id, cfg.version, cfg.trackScope, key]);

  const exploreAlone = useCallback(() => {
    setWelcomeOpen(false);
    setTourOpen(false);
    void track("tour_skipped", "welcome", cfg.id, cfg.version);
    void persist(key, { completed: false, skipped: true, currentStep: 0 }, cfg.id, cfg.version);
  }, [cfg.id, cfg.version, key]);

  const skip = useCallback(() => {
    setTourOpen(false);
    setWelcomeOpen(false);
    void track("tour_skipped", cfg.steps[stepIndex]?.id, cfg.id, cfg.version);
    void persist(key, { completed: false, skipped: true, currentStep: stepIndex }, cfg.id, cfg.version);
  }, [stepIndex, cfg.steps, cfg.id, cfg.version, key]);

  const complete = useCallback(() => {
    setTourOpen(false);
    void track("tour_completed", "finish", cfg.id, cfg.version);
    void persist(
      key,
      { completed: true, skipped: false, currentStep: cfg.steps.length - 1 },
      cfg.id,
      cfg.version
    );
  }, [cfg.steps.length, cfg.id, cfg.version, key]);

  const goStep = useCallback(
    (i: number) => {
      setStepIndex(i);
      void track("tour_step_viewed", cfg.steps[i]?.id, cfg.id, cfg.version);
      void persist(key, { completed: false, skipped: false, currentStep: i }, cfg.id, cfg.version);
    },
    [cfg.steps, cfg.id, cfg.version, key]
  );

  const restart = useCallback(async () => {
    writeLocal(key, { completed: false, skipped: false, currentStep: 0 });
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart", tourId: cfg.id, tourVersion: cfg.version }),
      });
    } catch {
      /* ignore */
    }
    void track("tour_restarted", undefined, cfg.id, cfg.version);
    setStepIndex(0);
    setWelcomeOpen(true);
    setTourOpen(false);
  }, [key, cfg.id, cfg.version]);

  return {
    ready,
    welcomeOpen,
    tourOpen,
    stepIndex,
    steps: cfg.steps,
    kind,
    restartEvent: cfg.restartEvent,
    startTour,
    exploreAlone,
    skip,
    complete,
    goStep,
    restart,
    onStepEnter,
    setTourOpen,
  };
}

export function OnboardingProvider({
  onMobileTab,
  onOpenAi,
  onCloseAi,
  children,
}: {
  onMobileTab?: (tab: "ai" | "stores") => void;
  onOpenAi?: () => void;
  onCloseAi?: () => void;
  children?: React.ReactNode;
}) {
  const handleStepEnter = useCallback(
    (step: TourStep) => {
      if (step.mobileTab) onMobileTab?.(step.mobileTab);
      if (step.openAi) onOpenAi?.();
      else onCloseAi?.();
    },
    [onMobileTab, onOpenAi, onCloseAi]
  );

  const tour = useOnboardingTour({ kind: "main", onStepEnter: handleStepEnter });

  return (
    <>
      {children}
      <TourWelcome open={tour.welcomeOpen} onStart={tour.startTour} onExplore={tour.exploreAlone} />
      <OnboardingTour
        open={tour.tourOpen}
        steps={tour.steps}
        stepIndex={tour.stepIndex}
        onStepIndex={tour.goStep}
        onSkip={tour.skip}
        onComplete={tour.complete}
        onStepEnter={handleStepEnter}
      />
      <TourRestartBridge eventName={tour.restartEvent} restart={tour.restart} />
    </>
  );
}

/** Walkthrough for authenticated customer dashboard (/customer) */
export function CustomerOnboardingProvider({ children }: { children?: React.ReactNode }) {
  const tour = useOnboardingTour({ kind: "customer", autoStart: true });

  return (
    <>
      {children}
      <TourWelcome
        open={tour.welcomeOpen}
        onStart={tour.startTour}
        onExplore={tour.exploreAlone}
        eyebrowAr="جولة لوحة العميل"
        eyebrowEn="Customer hub walkthrough"
        titleAr="خلّنا نعرّفك على مساحتك"
        titleEn="Let’s show you your space"
        bodyAr="ابتكار، ذكاء، تصميم، وطلبات — جولة قصيرة توضّح أين تبدأ."
        bodyEn="Innovate, AI, design, and orders — a short tour of where to start."
      />
      <OnboardingTour
        open={tour.tourOpen}
        steps={tour.steps}
        stepIndex={tour.stepIndex}
        onStepIndex={tour.goStep}
        onSkip={tour.skip}
        onComplete={tour.complete}
      />
      <TourRestartBridge eventName={tour.restartEvent} restart={tour.restart} />
    </>
  );
}

function TourRestartBridge({
  restart,
  eventName,
}: {
  restart: () => void;
  eventName: string;
}) {
  useEffect(() => {
    const handler = () => restart();
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [restart, eventName]);
  return null;
}

export function restartKhayyatakTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("kytk-restart-tour"));
  }
}

export function restartCustomerTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("kytk-restart-customer-tour"));
  }
}
