"use client";

import { useCallback, useEffect, useState } from "react";
import { OnboardingTour } from "./OnboardingTour";
import { TourWelcome } from "./TourWelcome";
import { MAIN_TOUR_STEPS } from "@/lib/onboarding/tour-steps";
import { MAIN_TOUR_ID, MAIN_TOUR_VERSION } from "@/lib/onboarding/types";
import type { TourStep } from "@/lib/onboarding/types";
import { useAuth } from "@/lib/context/app-context";

const LS_KEY = `kytk_tour_${MAIN_TOUR_ID}_${MAIN_TOUR_VERSION}`;

function readLocal(): { completed?: boolean; skipped?: boolean; currentStep?: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(state: { completed: boolean; skipped: boolean; currentStep: number }) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

async function track(eventType: string, stepId?: string) {
  try {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "event", eventType, stepId }),
    });
  } catch {
    /* ignore */
  }
}

async function persist(patch: { completed?: boolean; skipped?: boolean; currentStep?: number }) {
  writeLocal({
    completed: patch.completed ?? false,
    skipped: patch.skipped ?? false,
    currentStep: patch.currentStep ?? 0,
  });
  try {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", ...patch }),
    });
  } catch {
    /* guest / offline — local only */
  }
}

interface UseOnboardingOptions {
  onStepEnter?: (step: TourStep) => void;
  autoStart?: boolean;
}

export function useOnboardingTour({ onStepEnter, autoStart = true }: UseOnboardingOptions = {}) {
  const { isAuthenticated, authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      const local = readLocal();
      if (local?.completed || local?.skipped) {
        if (!cancelled) setReady(true);
        return;
      }

      if (isAuthenticated) {
        try {
          const res = await fetch("/api/onboarding");
          const data = await res.json();
          if (data.state?.completed || data.state?.skipped) {
            writeLocal({
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
  }, [authLoading, isAuthenticated, autoStart]);

  const startTour = useCallback(() => {
    setWelcomeOpen(false);
    setStepIndex(0);
    setTourOpen(true);
    void track("tour_started", "home");
    void persist({ completed: false, skipped: false, currentStep: 0 });
  }, []);

  const exploreAlone = useCallback(() => {
    setWelcomeOpen(false);
    setTourOpen(false);
    void track("tour_skipped", "welcome");
    void persist({ completed: false, skipped: true, currentStep: 0 });
  }, []);

  const skip = useCallback(() => {
    setTourOpen(false);
    setWelcomeOpen(false);
    void track("tour_skipped", MAIN_TOUR_STEPS[stepIndex]?.id);
    void persist({ completed: false, skipped: true, currentStep: stepIndex });
  }, [stepIndex]);

  const complete = useCallback(() => {
    setTourOpen(false);
    void track("tour_completed", "finish");
    void persist({ completed: true, skipped: false, currentStep: MAIN_TOUR_STEPS.length - 1 });
  }, []);

  const goStep = useCallback((i: number) => {
    setStepIndex(i);
    void track("tour_step_viewed", MAIN_TOUR_STEPS[i]?.id);
    void persist({ completed: false, skipped: false, currentStep: i });
  }, []);

  const restart = useCallback(async () => {
    writeLocal({ completed: false, skipped: false, currentStep: 0 });
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
    } catch {
      /* ignore */
    }
    void track("tour_restarted");
    setStepIndex(0);
    setWelcomeOpen(true);
    setTourOpen(false);
  }, []);

  return {
    ready,
    welcomeOpen,
    tourOpen,
    stepIndex,
    steps: MAIN_TOUR_STEPS,
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

  const tour = useOnboardingTour({ onStepEnter: handleStepEnter });

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
      {/* expose restart via custom event for profile/settings */}
      <TourRestartBridge restart={tour.restart} />
    </>
  );
}

function TourRestartBridge({ restart }: { restart: () => void }) {
  useEffect(() => {
    const handler = () => restart();
    window.addEventListener("kytk-restart-tour", handler);
    return () => window.removeEventListener("kytk-restart-tour", handler);
  }, [restart]);
  return null;
}

export function restartKhayyatakTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("kytk-restart-tour"));
  }
}
