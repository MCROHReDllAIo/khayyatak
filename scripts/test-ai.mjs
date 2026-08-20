#!/usr/bin/env node
/**
 * Validates OpenRouter / AI configuration.
 * Usage: npm run test:ai
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (!process.env[t.slice(0, eq).trim()]) {
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  }
}

async function inspectOpenRouterKey(apiKey) {
  const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { valid: false, error: "Invalid API key" };
  const json = await res.json();
  const isManagement = json.data?.is_management_key === true;
  const isProvisioning = json.data?.is_provisioning_key === true;
  if (isManagement || isProvisioning) {
    return {
      valid: false,
      error:
        "Management/Provisioning key detected — create an Inference API key at https://openrouter.ai/keys",
    };
  }
  return { valid: true };
}

async function testChat(apiKey, model, referer) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": referer,
      "X-Title": "Khayyatak",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      max_tokens: 16,
      temperature: 0,
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let msg = raw;
    try {
      msg = JSON.parse(raw).error?.message ?? raw;
    } catch {
      /* ignore */
    }
    return { ok: false, error: `${res.status}: ${msg}` };
  }
  const data = JSON.parse(raw);
  const content = data.choices?.[0]?.message?.content ?? "";
  return { ok: content.includes("OK"), content };
}

loadEnv();

const key = process.env.OPENROUTER_API_KEY?.trim();
const model = process.env.OPENROUTER_MODEL?.trim() || "google/gemini-3.7-flash";
const referer = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://kytk.online";

console.log("\nKhayyatak — OpenRouter AI test\n");

if (!key) {
  console.error("✗ OPENROUTER_API_KEY missing in .env.local");
  console.error("  Run: npm run setup:openrouter");
  process.exit(1);
}

const inspection = await inspectOpenRouterKey(key);
if (!inspection.valid) {
  console.error(`✗ ${inspection.error}`);
  process.exit(1);
}

console.log("✓ Inference API key type OK");

const chat = await testChat(key, model, referer);
if (!chat.ok) {
  console.error(`✗ Chat completion failed: ${chat.error ?? "unexpected response"}`);
  process.exit(1);
}

console.log(`✓ Chat OK (${model}) → ${chat.content?.trim()}`);
console.log("\nOpenRouter AI is ready.\n");
