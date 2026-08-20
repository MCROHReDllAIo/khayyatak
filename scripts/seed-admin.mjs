#!/usr/bin/env node
/**
 * Creates or updates a strong admin account in Railway PostgreSQL.
 * Usage: npm run seed:admin
 */

import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const EMAIL = process.env.ADMIN_EMAIL?.trim() || "admin@kytk.online";
const NAME = process.env.ADMIN_NAME?.trim() || "مدير خياطك";

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const value = t.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function generatePassword() {
  const raw = randomBytes(24).toString("base64url");
  return `Kytk-${raw.slice(0, 10)}!${raw.slice(10, 18)}`;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

loadEnv();
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD?.trim() || generatePassword();
const passwordHash = hashPassword(password);

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("railway") || url.includes("rlwy.net") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();

try {
  await client.query("BEGIN");

  const existing = await client.query(
    `SELECT user_id FROM auth_accounts WHERE lower(email) = $1 LIMIT 1`,
    [EMAIL.toLowerCase()]
  );

  let userId = existing.rows[0]?.user_id;

  if (userId) {
    await client.query(`UPDATE auth_accounts SET password_hash = $1 WHERE user_id = $2`, [
      passwordHash,
      userId,
    ]);
    await client.query(
      `UPDATE profiles SET role = 'admin', full_name = $2, full_name_ar = $2 WHERE id = $1`,
      [userId, NAME]
    );
  } else {
    const userRes = await client.query(
      `INSERT INTO auth.users (email, raw_user_meta_data)
       VALUES ($1, $2::jsonb)
       RETURNING id`,
      [EMAIL.toLowerCase(), JSON.stringify({ full_name: NAME, role: "admin" })]
    );
    userId = userRes.rows[0].id;
    await client.query(
      `INSERT INTO profiles (id, email, full_name, full_name_ar, role)
       VALUES ($1, $2, $3, $3, 'admin')
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         full_name = EXCLUDED.full_name,
         full_name_ar = EXCLUDED.full_name_ar,
         role = 'admin'`,
      [userId, EMAIL.toLowerCase(), NAME]
    );
    await client.query(
      `INSERT INTO auth_accounts (user_id, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [userId, EMAIL.toLowerCase(), passwordHash]
    );
  }

  await client.query("COMMIT");

  const creds = [
    "# Khayyatak admin — DO NOT COMMIT",
    `Email: ${EMAIL}`,
    `Password: ${password}`,
    `Role: admin`,
    `Login: /login then open /admin`,
    "",
  ].join("\n");

  writeFileSync(resolve(root, ".admin-credentials.local"), creds, "utf8");
  console.log("Admin account ready.");
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${password}`);
  console.log("Saved locally to .admin-credentials.local (gitignored).");
} catch (err) {
  await client.query("ROLLBACK");
  console.error(err.message);
  process.exit(1);
} finally {
  await client.end();
}
