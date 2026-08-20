#!/usr/bin/env node
/**
 * DEV-ONLY catalog seed — NEVER invents stock product photos.
 *
 * Products are created WITHOUT image_url. Tailors must upload real photos.
 *
 * Refuses production Railway URLs unless:
 *   ALLOW_DEMO_SEED=1 node scripts/seed-products.mjs --force
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");
const allowDemo = process.env.ALLOW_DEMO_SEED === "1";

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

/** Metadata-only seeds — image_url always null (no Unsplash / stock). */
const PRODUCTS = [
  {
    name_ar: "عباية حمراء مفتوحة",
    name_en: "Open Red Abaya",
    description_ar: "عباية حمراء مفتوحة — يحتاج الخياط رفع صورة حقيقية قبل النشر للعملاء.",
    category: "abaya",
    tags: ["abaya", "red", "open", "women", "crepe"],
    price: 25.0,
    fabric: "كريب",
    style: "مفتوحة",
    style_cut: "open",
    color: "أحمر",
    color_key: "red",
    gender: "women",
    occasion: "يومي",
  },
  {
    name_ar: "عباية سوداء واسعة",
    name_en: "Wide Black Abaya",
    description_ar: "عباية سوداء واسعة — يحتاج الخياط رفع صورة حقيقية قبل النشر للعملاء.",
    category: "abaya",
    tags: ["abaya", "black", "wide", "women", "chiffon"],
    price: 22.5,
    fabric: "شيفون",
    style: "واسعة",
    style_cut: "wide",
    color: "أسود",
    color_key: "black",
    gender: "women",
    occasion: "صيف",
  },
];

loadEnv();
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const looksProd =
  /railway|rlwy\.net|prod|kytk/i.test(url) || process.env.NODE_ENV === "production";

if (looksProd && !(force && allowDemo)) {
  console.error(`
Refusing to seed against what looks like production.

This script must NEVER publish stock/fake product photos.
If you really need metadata-only demo rows on this DB:

  ALLOW_DEMO_SEED=1 node scripts/seed-products.mjs --force

Better: create a real tailor account and upload real product photos.
`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("railway") || url.includes("rlwy.net") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();

try {
  // Purge any leftover stock-host images first
  const purged = await client.query(
    `UPDATE products
     SET published = FALSE, available = FALSE, image_url = NULL,
         image_source_type = 'BLOCKED_STOCK', updated_at = NOW()
     WHERE image_url IS NOT NULL
       AND (image_url ILIKE '%unsplash%' OR image_url ILIKE '%pexels%' OR image_url ILIKE '%picsum%')
     RETURNING id`
  );
  if (purged.rowCount) {
    console.log(`🧹 Unpublished ${purged.rowCount} stock-image product(s).`);
  }

  const tailorRes = await client.query(
    `SELECT id FROM tailors ORDER BY created_at ASC NULLS LAST LIMIT 1`
  );
  const tailorId = tailorRes.rows[0]?.id;

  if (!tailorId) {
    console.error("No tailor found — register a real tailor first. Will not invent one.");
    process.exit(1);
  }

  let inserted = 0;
  for (const p of PRODUCTS) {
    const existing = await client.query(
      `SELECT id FROM products WHERE name_ar = $1 AND tailor_id = $2 LIMIT 1`,
      [p.name_ar, tailorId]
    );
    // published=FALSE until a real photo is uploaded
    if (existing.rows.length) {
      await client.query(
        `UPDATE products SET
          name_en = $2, description_ar = $3, category = $4, tags = $5, price = $6,
          fabric = $7, style = $8, style_cut = $9, color = $10, color_key = $11,
          gender = $12, occasion = $13, image_url = NULL, image_source_type = 'UNKNOWN',
          published = FALSE, available = FALSE, updated_at = NOW()
         WHERE id = $1`,
        [
          existing.rows[0].id,
          p.name_en,
          p.description_ar,
          p.category,
          p.tags,
          p.price,
          p.fabric,
          p.style,
          p.style_cut,
          p.color,
          p.color_key,
          p.gender,
          p.occasion,
        ]
      );
      console.log(`↻ Updated (unpublished, no image): ${p.name_ar}`);
    } else {
      await client.query(
        `INSERT INTO products (
          tailor_id, name_ar, name_en, description_ar, category, tags, price,
          fabric, style, style_cut, color, color_key, gender, occasion, image_url,
          image_source_type, published, available
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NULL,'UNKNOWN',FALSE,FALSE)`,
        [
          tailorId,
          p.name_ar,
          p.name_en,
          p.description_ar,
          p.category,
          p.tags,
          p.price,
          p.fabric,
          p.style,
          p.style_cut,
          p.color,
          p.color_key,
          p.gender,
          p.occasion,
        ]
      );
      inserted++;
      console.log(`✓ Inserted (unpublished, no image): ${p.name_ar}`);
    }
  }

  console.log(`
Done. ${inserted} metadata-only product(s) for tailor ${tailorId}.
They are NOT published — upload real photos and set published=TRUE before customers see them.
`);
} finally {
  await client.end();
}
