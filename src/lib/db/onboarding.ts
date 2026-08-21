import { isPostgresConfigured, pgQuery } from "@/lib/db/postgres";
import type { OnboardingEventType, OnboardingState } from "@/lib/onboarding/types";
import { MAIN_TOUR_ID, MAIN_TOUR_VERSION } from "@/lib/onboarding/types";

export async function getOnboardingState(
  userId: string,
  tourId = MAIN_TOUR_ID,
  tourVersion = MAIN_TOUR_VERSION
): Promise<OnboardingState | null> {
  if (!isPostgresConfigured()) return null;
  try {
    const { rows } = await pgQuery<{
      tour_id: string;
      tour_version: string;
      completed: boolean;
      skipped: boolean;
      current_step: number;
      completed_at: string | null;
    }>(
      `SELECT tour_id, tour_version, completed, skipped, current_step, completed_at
       FROM user_onboarding
       WHERE user_id = $1 AND tour_id = $2 AND tour_version = $3
       LIMIT 1`,
      [userId, tourId, tourVersion]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      tourId: row.tour_id,
      tourVersion: row.tour_version,
      completed: row.completed,
      skipped: row.skipped,
      currentStep: row.current_step,
      completedAt: row.completed_at,
    };
  } catch {
    return null;
  }
}

export async function upsertOnboardingState(
  userId: string,
  patch: {
    completed?: boolean;
    skipped?: boolean;
    currentStep?: number;
    completedAt?: string | null;
  },
  tourId = MAIN_TOUR_ID,
  tourVersion = MAIN_TOUR_VERSION
): Promise<OnboardingState | null> {
  if (!isPostgresConfigured()) return null;
  try {
    const completed = patch.completed ?? false;
    const skipped = patch.skipped ?? false;
    const currentStep = patch.currentStep ?? 0;
    const completedAt = patch.completedAt ?? (completed ? new Date().toISOString() : null);

    const { rows } = await pgQuery<{
      tour_id: string;
      tour_version: string;
      completed: boolean;
      skipped: boolean;
      current_step: number;
      completed_at: string | null;
    }>(
      `INSERT INTO user_onboarding (
         user_id, tour_id, tour_version, completed, skipped, current_step, completed_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (user_id, tour_id, tour_version) DO UPDATE SET
         completed = EXCLUDED.completed,
         skipped = EXCLUDED.skipped,
         current_step = EXCLUDED.current_step,
         completed_at = COALESCE(EXCLUDED.completed_at, user_onboarding.completed_at),
         skipped_at = CASE WHEN EXCLUDED.skipped THEN NOW() ELSE user_onboarding.skipped_at END,
         updated_at = NOW()
       RETURNING tour_id, tour_version, completed, skipped, current_step, completed_at`,
      [userId, tourId, tourVersion, completed, skipped, currentStep, completedAt]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      tourId: row.tour_id,
      tourVersion: row.tour_version,
      completed: row.completed,
      skipped: row.skipped,
      currentStep: row.current_step,
      completedAt: row.completed_at,
    };
  } catch {
    return null;
  }
}

export async function logOnboardingEvent(
  userId: string | null,
  eventType: OnboardingEventType,
  stepId?: string,
  metadata?: Record<string, unknown>,
  tourId = MAIN_TOUR_ID,
  tourVersion = MAIN_TOUR_VERSION
): Promise<void> {
  if (!isPostgresConfigured()) return;
  try {
    await pgQuery(
      `INSERT INTO onboarding_events (user_id, tour_id, tour_version, event_type, step_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [
        userId,
        tourId,
        tourVersion,
        eventType,
        stepId ?? null,
        JSON.stringify(metadata ?? {}),
      ]
    );
  } catch {
    /* analytics best-effort */
  }
}
