export const MAIN_TOUR_ID = "main";
export const MAIN_TOUR_VERSION = "2026.1";

export type TourPlacement = "top" | "bottom" | "left" | "right" | "center" | "auto";

export type TourStepId =
  | "intro"
  | "home"
  | "stores"
  | "store-card"
  | "ai"
  | "ai-demo"
  | "media"
  | "innovate"
  | "design"
  | "orders"
  | "finish";

export interface TourStep {
  id: TourStepId;
  /** CSS selector for data-tour-target */
  target?: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  placement?: TourPlacement;
  /** Switch home mobile tab when entering step (legacy) */
  mobileTab?: "ai" | "stores";
  /** Open floating AI sheet for this step */
  openAi?: boolean;
  /** Optional honesty note when feature may be unavailable */
  caveatAr?: string;
  caveatEn?: string;
  /** Visual demo inside tooltip (no DB writes) */
  demo?: "ai-search" | "design-collab" | "order-flow" | "summary";
}

export interface OnboardingState {
  tourId: string;
  tourVersion: string;
  completed: boolean;
  skipped: boolean;
  currentStep: number;
  completedAt?: string | null;
}

export type OnboardingEventType =
  | "tour_started"
  | "tour_step_viewed"
  | "tour_skipped"
  | "tour_completed"
  | "feature_tutorial_opened"
  | "tour_restarted";
