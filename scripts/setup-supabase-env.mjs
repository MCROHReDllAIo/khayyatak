#!/usr/bin/env node
/**
 * Writes Supabase credentials into .env.local
 *
 * Usage:
 *   npm run setup:supabase
 *   npm run setup:supabase -- --url=https://xxxx.supabase.co --anon=eyJ... --service=eyJ...
 *
 * Get keys from: Supabase Dashboard → Project Settings → API
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

function parseEnvFile(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return map;
}

function serializeEnv(map) {
  const order = [
    "# ─── PostgreSQL (Railway) ───",
    "DATABASE_URL",
    "",
    "# ─── Supabase (REQUIRED for Auth) ───",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "",
    "# ─── AI Provider ───",
    "OPENROUTER_API_KEY",
    "OPENROUTER_MODEL",
    "OPENROUTER_VISION_MODEL",
    "",
    "# ─── App ───",
    "NEXT_PUBLIC_APP_URL",
  ];

  const lines = ["# Smart Tailor AI — local environment (do not commit)", ""];

  for (const key of order) {
    if (key.startsWith("#") || key === "") {
      lines.push(key);
      continue;
    }
    if (map.has(key)) lines.push(`${key}=${map.get(key)}`);
  }

  for (const [key, value] of map.entries()) {
    if (order.includes(key)) continue;
    lines.push(`${key}=${value}`);
  }

  return `${lines.join("\n").trim()}\n`;
}

function validate(url, anon) {
  const errors = [];
  if (!url) errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
  else if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    errors.push("URL must look like https://YOUR_REF.supabase.co");
  }
  if (!anon) errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
  else if (!anon.startsWith("eyJ")) {
    errors.push("Anon key should start with eyJ (JWT from Supabase API settings)");
  }
  return errors;
}

async function prompt(label, current = "") {
  const rl = readline.createInterface({ input, output });
  const suffix = current ? ` [keep current]` : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  rl.close();
  return answer || current;
}

async function main() {
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const map = parseEnvFile(existing);

  let url = parseArg("url") || map.get("NEXT_PUBLIC_SUPABASE_URL") || "";
  let anon = parseArg("anon") || map.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";
  let service = parseArg("service") || map.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  const hasCli = parseArg("url") || parseArg("anon");

  if (!hasCli) {
    console.log("\nSmart Tailor AI — Supabase setup");
    console.log("Open: https://supabase.com/dashboard/project/_/settings/api\n");
    url = await prompt("Project URL (https://xxxx.supabase.co)", url);
    anon = await prompt("anon public key", anon);
    service = await prompt("service_role key (optional, for admin analytics)", service);
  }

  const errors = validate(url, anon);
  if (errors.length) {
    console.error("\n❌ Invalid configuration:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  map.set("NEXT_PUBLIC_SUPABASE_URL", url);
  map.set("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon);
  if (service) map.set("SUPABASE_SERVICE_ROLE_KEY", service);

  if (!map.has("OPENROUTER_API_KEY") && existing.includes("OPENROUTER_API_KEY")) {
    /* preserved via parseEnvFile */
  }
  if (!map.has("NEXT_PUBLIC_APP_URL")) map.set("NEXT_PUBLIC_APP_URL", "https://kytk.online");
  if (!map.has("OPENROUTER_MODEL")) map.set("OPENROUTER_MODEL", "openai/gpt-4o-mini");
  if (!map.has("OPENROUTER_VISION_MODEL")) map.set("OPENROUTER_VISION_MODEL", "openai/gpt-4o-mini");

  writeFileSync(envPath, serializeEnv(map), "utf8");

  console.log("\n✅ Updated .env.local with Supabase credentials");
  console.log("Next steps:");
  console.log("  1. Run SQL migrations in Supabase SQL Editor:");
  console.log("     - supabase/migrations/001_initial_schema.sql");
  console.log("     - supabase/migrations/002_production_schema.sql");
  console.log("     - supabase/migrations/003_tailor_rail.sql");
  console.log("  2. Restart dev server: npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
