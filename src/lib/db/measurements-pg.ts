import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";
import type { Measurements } from "@/types";

export interface MeasurementProfile extends Measurements {
  weight?: number;
  hip?: number;
  size_label?: string;
}

function mapRow(row: Record<string, unknown>): MeasurementProfile {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    height: Number(row.height ?? 0),
    weight: row.weight != null ? Number(row.weight) : undefined,
    chest: Number(row.chest ?? 0),
    waist: Number(row.waist ?? 0),
    hip: row.hip != null ? Number(row.hip) : undefined,
    shoulder: Number(row.shoulder ?? 0),
    sleeve: Number(row.sleeve ?? 0),
    dishdasha_length: Number(row.dishdasha_length ?? 0),
    size_label: (row.size_label as string) ?? undefined,
    confidence: Number(row.confidence ?? 0),
    is_ai_estimate: Boolean(row.is_ai_estimate),
    created_at: row.created_at as string,
  };
}

export async function getMeasurementProfile(userId: string): Promise<MeasurementProfile | null> {
  if (!isPostgresConfigured()) return null;

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM measurements WHERE user_id = $1 ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 1`,
    [userId]
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function upsertMeasurementProfile(
  userId: string,
  data: Partial<MeasurementProfile>
): Promise<MeasurementProfile | null> {
  if (!isPostgresConfigured()) return null;

  const existing = await getMeasurementProfile(userId);

  if (existing?.id) {
    const { rows } = await pgQuery<Record<string, unknown>>(
      `UPDATE measurements SET
        height = COALESCE($2, height),
        weight = COALESCE($3, weight),
        chest = COALESCE($4, chest),
        waist = COALESCE($5, waist),
        hip = COALESCE($6, hip),
        shoulder = COALESCE($7, shoulder),
        sleeve = COALESCE($8, sleeve),
        dishdasha_length = COALESCE($9, dishdasha_length),
        size_label = COALESCE($10, size_label),
        confidence = COALESCE($11, confidence),
        is_ai_estimate = COALESCE($12, is_ai_estimate),
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        existing.id,
        data.height ?? null,
        data.weight ?? null,
        data.chest ?? null,
        data.waist ?? null,
        data.hip ?? null,
        data.shoulder ?? null,
        data.sleeve ?? null,
        data.dishdasha_length ?? null,
        data.size_label ?? null,
        data.confidence ?? null,
        data.is_ai_estimate ?? null,
      ]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  const { rows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO measurements (
      user_id, height, weight, chest, waist, hip, shoulder, sleeve,
      dishdasha_length, size_label, confidence, is_ai_estimate
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      userId,
      data.height ?? 0,
      data.weight ?? null,
      data.chest ?? 0,
      data.waist ?? 0,
      data.hip ?? null,
      data.shoulder ?? 0,
      data.sleeve ?? 0,
      data.dishdasha_length ?? 0,
      data.size_label ?? null,
      data.confidence ?? 0,
      data.is_ai_estimate ?? false,
    ]
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteMeasurementProfile(userId: string): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  await pgQuery(`DELETE FROM measurements WHERE user_id = $1`, [userId]);
  return true;
}

export function hasTailoringMeasurements(m: MeasurementProfile | null): boolean {
  if (!m) return false;
  return Boolean(m.chest && m.waist && m.shoulder);
}

export function hasOnlyHeightWeight(m: MeasurementProfile | null): boolean {
  if (!m) return false;
  const hasHw = Boolean(m.height || m.weight);
  return hasHw && !hasTailoringMeasurements(m);
}
