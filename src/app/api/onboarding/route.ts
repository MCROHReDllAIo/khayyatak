import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-auth";
import { getOnboardingState, logOnboardingEvent, upsertOnboardingState } from "@/lib/db/onboarding";
import { MAIN_TOUR_ID, MAIN_TOUR_VERSION } from "@/lib/onboarding/types";
import type { OnboardingEventType } from "@/lib/onboarding/types";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, state: null });
  }
  const state = await getOnboardingState(user.id);
  return NextResponse.json({ authenticated: true, state });
}

export async function POST(request: Request) {
  const user = await getApiUser();
  const body = (await request.json()) as {
    action?: "save" | "event" | "restart";
    completed?: boolean;
    skipped?: boolean;
    currentStep?: number;
    eventType?: OnboardingEventType;
    stepId?: string;
  };

  if (body.action === "event") {
    await logOnboardingEvent(user?.id ?? null, body.eventType ?? "tour_step_viewed", body.stepId);
    return NextResponse.json({ ok: true });
  }

  if (!user) {
    return NextResponse.json({ error: "Auth required to persist tour" }, { status: 401 });
  }

  if (body.action === "restart") {
    const state = await upsertOnboardingState(user.id, {
      completed: false,
      skipped: false,
      currentStep: 0,
      completedAt: null,
    });
    await logOnboardingEvent(user.id, "tour_restarted");
    return NextResponse.json({ state });
  }

  const state = await upsertOnboardingState(user.id, {
    completed: body.completed,
    skipped: body.skipped,
    currentStep: body.currentStep,
    completedAt: body.completed ? new Date().toISOString() : null,
  });

  return NextResponse.json({
    state,
    tourId: MAIN_TOUR_ID,
    tourVersion: MAIN_TOUR_VERSION,
  });
}
