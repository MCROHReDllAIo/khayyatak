#!/usr/bin/env node
/**
 * Index published products into Style Twin embeddings (OpenRouter/OpenAI).
 *
 * Usage:
 *   npm run ml:index-products
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

function dnaFromRow(row) {
  const categoryRaw = String(row.category ?? "").toLowerCase();
  let category = "";
  if (categoryRaw.includes("abaya")) category = "abaya";
  else if (categoryRaw.includes("dish")) category = "dishdasha";
  else if (categoryRaw.includes("fabric")) category = "fabric";
  else if (categoryRaw) category = "other";

  return {
    category: category || undefined,
    color: row.color || undefined,
    colorKey: row.color_key || undefined,
    styleCut: row.style_cut || row.style || undefined,
    fabric: row.fabric || undefined,
    occasion: row.occasion || undefined,
    gender: row.gender || undefined,
    summaryAr: [row.name_ar, row.description_ar].filter(Boolean).join(" — ") || undefined,
    summaryEn: row.name_en || undefined,
    tags: row.tags || undefined,
  };
}

function dnaToText(dna) {
  return [
    dna.summaryEn,
    dna.summaryAr,
    dna.category,
    dna.color,
    dna.colorKey,
    dna.styleCut,
    dna.fabric,
    dna.occasion,
    dna.gender,
    ...(dna.tags || []),
  ]
    .filter(Boolean)
    .join(" · ");
}

async function embedText(text, apiKey, model, provider) {
  const url =
    provider === "openai"
      ? "https://api.openai.com/v1/embeddings"
      : "https://openrouter.ai/api/v1/embeddings";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://kytk.online";
    headers["X-Title"] = "Khayyatak Style Twin Index";
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, input: text.slice(0, 8000) }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`embed ${res.status}: ${err.slice(0, 180)}`);
  }
  const json = await res.json();
  const embedding = json.data?.[0]?.embedding;
  if (!embedding?.length) throw new Error("empty embedding");
  return { embedding, model: json.model || model };
}

async function main() {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL;
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const apiKey = openrouter || openai;
  const provider = openrouter ? "openrouter" : "openai";
  const model =
    process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small";

  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY or OPENAI_API_KEY is required");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS product_embeddings (
      product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      dna_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      embedding JSONB NOT NULL DEFAULT '[]'::jsonb,
      model TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'catalog',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const { rows } = await client.query(`
    SELECT p.id, p.name_ar, p.name_en, p.description_ar, p.category, p.tags,
           p.color, p.color_key, p.style, p.style_cut, p.fabric, p.occasion, p.gender
    FROM products p
    WHERE p.published = TRUE AND COALESCE(p.available, TRUE) = TRUE
    ORDER BY p.created_at DESC
    LIMIT 500
  `);

  console.log(`→ Indexing ${rows.length} products with ${model}...`);
  let indexed = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const dna = dnaFromRow(row);
      const text = dnaToText(dna);
      if (!text.trim()) {
        skipped++;
        continue;
      }
      const emb = await embedText(text, apiKey, model, provider);
      await client.query(
        `INSERT INTO product_embeddings (product_id, dna_json, embedding, model, source, updated_at)
         VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, NOW())
         ON CONFLICT (product_id) DO UPDATE SET
           dna_json = EXCLUDED.dna_json,
           embedding = EXCLUDED.embedding,
           model = EXCLUDED.model,
           source = EXCLUDED.source,
           updated_at = NOW()`,
        [row.id, JSON.stringify(dna), JSON.stringify(emb.embedding), emb.model, "catalog_metadata"]
      );
      indexed++;
      process.stdout.write(`.");
    } catch (err) {
      skipped++;
      console.error(`\n! ${row.id}: ${err.message}`);
    }
  }

  const { rows: countRows } = await client.query(`SELECT COUNT(*)::int AS n FROM product_embeddings`);
  await client.end();
  console.log(`\n✓ indexed=${indexed} skipped=${skipped} catalog=${countRows[0]?.n ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
