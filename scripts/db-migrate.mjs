#!/usr/bin/env node
/**
 * Apply SQL migrations to PostgreSQL (Railway / any DATABASE_URL).
 *
 * Usage:
 *   npm run db:migrate
 *   DATABASE_URL=postgresql://... npm run db:migrate
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = resolve(root, "supabase/migrations");
const railwayBootstrap = resolve(migrationsDir, "railway/000_auth_stub.sql");

function loadEnvLocal() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function stripSupabaseOnlySql(sql) {
  return sql
    .replace(/CREATE POLICY[\s\S]*?;/gi, "")
    .replace(/DROP POLICY[\s\S]*?;/gi, "")
    .replace(/ALTER TABLE[\s\S]*?ENABLE ROW LEVEL SECURITY\s*;/gi, "");
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function isApplied(client, id) {
  const { rows } = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [id]);
  return rows.length > 0;
}

async function markApplied(client, id) {
  await client.query("INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING", [id]);
}

async function runFile(client, filePath, { label }) {
  if (await isApplied(client, label)) {
    console.log(`⏭ ${label} (already applied)`);
    return;
  }

  let sql = readFileSync(filePath, "utf8");
  if (!filePath.includes("000_auth_stub")) {
    sql = stripSupabaseOnlySql(sql);
  }

  console.log(`→ ${label}`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await markApplied(client, label);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("Missing DATABASE_URL in .env.local or environment.");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: url,
    ssl: url.includes("railway") || url.includes("rlwy.net") ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  console.log("Connected to PostgreSQL.");

  try {
    await ensureMigrationTable(client);

    if (existsSync(railwayBootstrap)) {
      await runFile(client, railwayBootstrap, { label: "railway/000_auth_stub.sql" });
    }

    const files = readdirSync(migrationsDir)
      .filter((f) => /^\d{3}_.*\.sql$/.test(f))
      .sort();

    for (const file of files) {
      await runFile(client, join(migrationsDir, file), { label: file });
    }

    console.log("Migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
