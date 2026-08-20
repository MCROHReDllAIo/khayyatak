#!/usr/bin/env node
/**
 * Unpublish products with stock/fake image hosts (Unsplash, Pexels, etc.)
 * Usage: node scripts/purge-stock-product-images.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

loadEnv();
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("railway") || url.includes("rlwy.net") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  const { rows } = await client.query(
    `UPDATE products
     SET published = FALSE,
         available = FALSE,
         image_url = NULL,
         image_source_type = 'BLOCKED_STOCK',
         updated_at = NOW()
     WHERE image_url IS NOT NULL
       AND (
         image_url ILIKE '%unsplash%'
         OR image_url ILIKE '%pexels%'
         OR image_url ILIKE '%loremflickr%'
         OR image_url ILIKE '%placehold%'
         OR image_url ILIKE '%picsum.photos%'
       )
     RETURNING id, name_ar`
  );
  console.log(`Purged ${rows.length} stock-image product(s).`);
  for (const r of rows) console.log(` - ${r.name_ar} (${r.id})`);
} finally {
  await client.end();
}
