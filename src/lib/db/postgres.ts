import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  return url || null;
}

export function isPostgresConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getPgPool(): pg.Pool {
  if (pool) return pool;

  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured in environment.");
  }

  pool = new Pool({
    connectionString: url,
    ssl:
      url.includes("railway") || url.includes("rlwy.net")
        ? { rejectUnauthorized: false }
        : undefined,
    max: 5,
  });

  return pool;
}

export async function pgQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const client = getPgPool();
  return client.query<T>(text, params);
}
