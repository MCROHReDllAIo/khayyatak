#!/usr/bin/env node
/**
 * Writes OpenRouter Inference API key into .env.local
 *
 * Usage:
 *   npm run setup:openrouter
 *   npm run setup:openrouter -- --key=sk-or-v1-...
 *
 * Create key at: https://openrouter.ai/keys (Inference API Key — NOT Management)
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
  const lines = ["# Khayyatak — local environment (do not commit)", ""];

  const sections = [
    ["# ─── PostgreSQL (Railway) ───", "DATABASE_URL"],
    ["", "# ─── Supabase (REQUIRED for login) ───", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    ["", "# ─── OpenRouter AI (Inference key) ───", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "OPENROUTER_VISION_MODEL"],
    ["", "# ─── App ───", "NEXT_PUBLIC_APP_URL"],
  ];

  const written = new Set();
  for (const section of sections) {
    for (const key of section) {
      if (key.startsWith("#") || key === "") {
        lines.push(key);
        continue;
      }
      if (map.has(key)) {
        lines.push(`${key}=${map.get(key)}`);
        written.add(key);
      }
    }
  }

  for (const [key, value] of map.entries()) {
    if (!written.has(key)) lines.push(`${key}=${value}`);
  }

  return `${lines.join("\n").trim()}\n`;
}

async function validateKey(key) {
  const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error("Invalid API key");
  const json = await res.json();
  if (json.data?.is_management_key || json.data?.is_provisioning_key) {
    throw new Error(
      "This is a Management/Provisioning key. Create an Inference API key at https://openrouter.ai/keys"
    );
  }
}

async function main() {
  let key = parseArg("key");
  if (!key) {
    const rl = readline.createInterface({ input, output });
    console.log("\nOpenRouter setup — Khayyatak\n");
    console.log("Get an Inference API key (not Management): https://openrouter.ai/keys\n");
    key = await rl.question("OPENROUTER_API_KEY: ");
    rl.close();
  }

  key = key.trim();
  if (!key.startsWith("sk-or-")) {
    console.error("Key should start with sk-or-v1-");
    process.exit(1);
  }

  process.stdout.write("Validating key… ");
  try {
    await validateKey(key);
    console.log("OK\n");
  } catch (err) {
    console.log("FAILED\n");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const map = parseEnvFile(existing);
  map.set("OPENROUTER_API_KEY", key);
  if (!map.has("OPENROUTER_MODEL")) map.set("OPENROUTER_MODEL", "google/gemini-3.7-flash");
  if (!map.has("OPENROUTER_VISION_MODEL")) map.set("OPENROUTER_VISION_MODEL", "google/gemini-3.7-flash");
  if (!map.has("NEXT_PUBLIC_APP_URL")) map.set("NEXT_PUBLIC_APP_URL", "https://kytk.online");

  writeFileSync(envPath, serializeEnv(map), "utf8");
  console.log(`Saved to ${envPath}`);
  console.log("Run: npm run test:ai — then restart npm run dev\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
