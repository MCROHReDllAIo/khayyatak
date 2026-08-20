#!/usr/bin/env node
/**
 * Seed real product rows for AI shopping — no UI fakes.
 * Usage: npm run seed:products
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

const PRODUCTS = [
  {
    name_ar: "عباية حمراء مفتوحة",
    name_en: "Open Red Abaya",
    description_ar: "عباية حمراء مفتوحة من كريب فاخر — قصة مفتوحة أنيقة للمناسبات واليومي.",
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
    image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
  },
  {
    name_ar: "عباية سوداء واسعة",
    name_en: "Wide Black Abaya",
    description_ar: "عباية سوداء واسعة من شيفون خفيف — مثالية للصيف والدوام.",
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
    image_url: "https://images.unsplash.com/photo-1617098907767-40b7e7887522?w=800&q=80",
  },
  {
    name_ar: "عباية بيج رسمية بسيطة",
    name_en: "Simple Formal Beige Abaya",
    description_ar: "عباية بيج رسمية بسيطة بدون تطريز — أناقة هادئة للعيد والمناسبات.",
    category: "abaya",
    tags: ["abaya", "beige", "formal", "simple", "women"],
    price: 28.0,
    fabric: "كريب",
    style: "رسمية",
    style_cut: "formal",
    color: "بيج",
    color_key: "beige",
    gender: "women",
    occasion: "عيد",
    image_url: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&q=80",
  },
  {
    name_ar: "عباية كحلية صيفية",
    name_en: "Summer Navy Abaya",
    description_ar: "عباية كحلية خفيفة من كتان — قصة صيفية مريحة.",
    category: "abaya",
    tags: ["abaya", "navy", "summer", "women", "linen"],
    price: 24.0,
    fabric: "كتان",
    style: "صيفية",
    style_cut: "summer",
    color: "كحلي",
    color_key: "navy",
    gender: "women",
    occasion: "صيف",
    image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
  },
];

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
  const tailorRes = await client.query(
    `SELECT id FROM tailors WHERE verified = TRUE OR TRUE ORDER BY rating DESC NULLS LAST LIMIT 1`
  );
  let tailorId = tailorRes.rows[0]?.id;

  if (!tailorId) {
    const cityRes = await client.query(`SELECT id FROM cities LIMIT 1`);
    const cityId = cityRes.rows[0]?.id;
    const insert = await client.query(
      `INSERT INTO tailors (name_ar, name_en, city_id, rating, starting_price, delivery_days, verified, description_ar, description_en)
       VALUES ('خياطك للعبايات', 'Khayyatak Abayas', $1, 4.8, 20, 5, TRUE, 'متجر عبايات', 'Abaya store')
       RETURNING id`,
      [cityId]
    );
    tailorId = insert.rows[0]?.id;
  }

  if (!tailorId) {
    console.error("No tailor found — create a tailor first.");
    process.exit(1);
  }

  let inserted = 0;
  for (const p of PRODUCTS) {
    const existing = await client.query(
      `SELECT id FROM products WHERE name_ar = $1 AND tailor_id = $2 LIMIT 1`,
      [p.name_ar, tailorId]
    );
    if (existing.rows.length) {
      await client.query(
        `UPDATE products SET
          name_en = $2, description_ar = $3, category = $4, tags = $5, price = $6,
          fabric = $7, style = $8, style_cut = $9, color = $10, color_key = $11,
          gender = $12, occasion = $13, image_url = $14, published = TRUE, available = TRUE
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
          p.image_url,
        ]
      );
      console.log(`↻ Updated: ${p.name_ar}`);
    } else {
      await client.query(
        `INSERT INTO products (
          tailor_id, name_ar, name_en, description_ar, category, tags, price,
          fabric, style, style_cut, color, color_key, gender, occasion, image_url,
          published, available
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,TRUE,TRUE)`,
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
          p.image_url,
        ]
      );
      inserted++;
      console.log(`✓ Inserted: ${p.name_ar}`);
    }
  }

  console.log(`\nDone. ${inserted} new products seeded for tailor ${tailorId}.`);
} finally {
  await client.end();
}
