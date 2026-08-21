import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-auth";
import { getOnboardingState, logOnboardingEvent, upsertOnboardingState } from "@/lib/db/onboarding";
import { MAIN_TOUR_ID, MAIN_TOUR_VERSION } from "@/lib/onboarding/types";
import type { OnboardingEventType } from "@/lib/onboarding/types";

function resolveTour(searchOrBody: { tourId?: string | null; tourVersion?: string | null }) {
  return {
    tourId: searchOrBody.tourId?.trim() || MAIN_TOUR_ID,
    tourVersion: searchOrBody.tourVersion?.trim() || MAIN_TOUR_VERSION,
  };
}

export async function GET(request: Request) {
  const user = await getApiUser();
  const url = new URL(request.url);
  const { tourId, tourVersion } = resolveTour({
    tourId: url.searchParams.get("tourId"),
    tourVersion: url.searchParams.get("tourVersion"),
  });

  if (!user) {
    return NextResponse.json({ authenticated: false, state: null, tourId, tourVersion });
  }
  const state = await getOnboardingState(user.id, tourId, tourVersion);
  return NextResponse.json({ authenticated: true, state, tourId, tourVersion });
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
    tourId?: string;
    tourVersion?: string;
  };

  const { tourId, tourVersion } = resolveTour(body);

  if (body.action === "event") {
    await logOnboardingEvent(
      user?.id ?? null,
      body.eventType ?? "tour_step_viewed",
      body.stepId,
      undefined,
      tourId,
      tourVersion
    );
    return NextResponse.json({ ok: true });
  }

  if (!user) {
    return NextResponse.json({ error: "Auth required to persist tour" }, { status: 401 });
  }

  if (body.action === "restart") {
    const state = await upsertOnboardingState(
      user.id,
      {
        completed: false,
        skipped: false,
        currentStep: 0,
        completedAt: null,
      },
      tourId,
      tourVersion
    );
    await logOnboardingEvent(user.id, "tour_restarted", undefined, undefined, tourId, tourVersion);
    return NextResponse.json({ state, tourId, tourVersion });
  }

  const state = await upsertOnboardingState(
    user.id,
    {
      completed: body.completed,
      skipped: body.skipped,
      currentStep: body.currentStep,
      completedAt: body.completed ? new Date().toISOString() : null,
    },
    tourId,
    tourVersion
  );

  return NextResponse.json({
    state,
    tourId,
    tourVersion,
  });
}
