import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";

export interface VirtualTryOnSession {
  id: string;
  user_id: string;
  product_id: string | null;
  measurement_id: string | null;
  status: string;
  provider: string | null;
  error_message: string | null;
  created_at: string;
}

export interface VirtualTryOnResult {
  id: string;
  session_id: string;
  user_id: string;
  image_data: string | null;
  image_url: string | null;
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function createTryOnSession(
  userId: string,
  productId: string | null,
  measurementId: string | null
): Promise<string | null> {
  if (!isPostgresConfigured()) return null;

  const { rows } = await pgQuery<{ id: string }>(
    `INSERT INTO virtual_tryon_sessions (user_id, product_id, measurement_id, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id`,
    [userId, productId, measurementId]
  );

  return rows[0]?.id ?? null;
}

export async function updateTryOnSession(
  sessionId: string,
  updates: { status?: string; provider?: string; error_message?: string }
): Promise<void> {
  if (!isPostgresConfigured()) return;

  await pgQuery(
    `UPDATE virtual_tryon_sessions
     SET status = COALESCE($2, status),
         provider = COALESCE($3, provider),
         error_message = COALESCE($4, error_message),
         updated_at = NOW()
     WHERE id = $1`,
    [sessionId, updates.status ?? null, updates.provider ?? null, updates.error_message ?? null]
  );
}

export async function saveTryOnResult(
  sessionId: string,
  userId: string,
  data: {
    image_data?: string;
    image_url?: string;
    provider: string;
    model?: string;
    latency_ms?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<VirtualTryOnResult | null> {
  if (!isPostgresConfigured()) return null;

  const { rows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO virtual_tryon_results
     (session_id, user_id, image_data, image_url, provider, model, latency_ms, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING *`,
    [
      sessionId,
      userId,
      data.image_data ?? null,
      data.image_url ?? null,
      data.provider,
      data.model ?? null,
      data.latency_ms ?? null,
      JSON.stringify(data.metadata ?? {}),
    ]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id as string,
    session_id: row.session_id as string,
    user_id: row.user_id as string,
    image_data: (row.image_data as string) ?? null,
    image_url: (row.image_url as string) ?? null,
    provider: (row.provider as string) ?? null,
    model: (row.model as string) ?? null,
    latency_ms: row.latency_ms != null ? Number(row.latency_ms) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  };
}

export async function getTryOnResultsForUser(userId: string, limit = 10): Promise<VirtualTryOnResult[]> {
  if (!isPostgresConfigured()) return [];

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM virtual_tryon_results
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return rows.map((row) => ({
    id: row.id as string,
    session_id: row.session_id as string,
    user_id: row.user_id as string,
    image_data: (row.image_data as string) ?? null,
    image_url: (row.image_url as string) ?? null,
    provider: (row.provider as string) ?? null,
    model: (row.model as string) ?? null,
    latency_ms: row.latency_ms != null ? Number(row.latency_ms) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  }));
}

export async function getTryOnResultById(resultId: string, userId: string): Promise<VirtualTryOnResult | null> {
  if (!isPostgresConfigured()) return null;

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM virtual_tryon_results WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [resultId, userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id as string,
    session_id: row.session_id as string,
    user_id: row.user_id as string,
    image_data: (row.image_data as string) ?? null,
    image_url: (row.image_url as string) ?? null,
    provider: (row.provider as string) ?? null,
    model: (row.model as string) ?? null,
    latency_ms: row.latency_ms != null ? Number(row.latency_ms) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  };
}
