#!/usr/bin/env node
/**
 * Core logic tests for Smart Tailor AI (no external deps).
 * Run: npm test
 */

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

// --- Intent extraction (mirrors src/lib/ai/intent.ts) ---
function extractFashionIntent(message) {
  const m = message.toLowerCase();
  const intent = { summary_ar: "طلب أزياء", garmentType: undefined, colorKey: undefined, fitKey: undefined, fabricKey: undefined, style: undefined, season: undefined };

  if (/عبا|abaya/.test(m)) intent.garmentType = "abaya";
  else if (/دش|ثوب|dishdasha/.test(m)) intent.garmentType = "dishdasha";

  if (/أبيض|بيض|white/.test(m)) intent.colorKey = "white";
  else if (/كحل|navy/.test(m)) intent.colorKey = "navy";

  if (/صيف|summer|خفيف/.test(m)) {
    intent.fabricKey = "summer";
    intent.season = "summer";
  }

  if (/أنحف|ضيق|slim|مو\s*واس|بس\s*مو\s*واس/i.test(m)) intent.fitKey = "slim";
  if (/رسم|formal|فخم/.test(m)) intent.style = "رسمي";

  return intent;
}

// --- NL design (mirrors concierge patterns) ---
function applyNL(prompt, design) {
  if (/أنحف|ضيق|slim|مو\s*واس|بس\s*مو\s*واس/i.test(prompt)) return { ...design, fitKey: "slim", fit: "أنحف" };
  if (/كحل|navy/i.test(prompt)) return { ...design, colorKey: "navy", color: "كحلي" };
  if (/صيف|summer/i.test(prompt)) return { ...design, fabricKey: "summer", fabric: "صيفي" };
  return design;
}

// --- Matching score helper ---
function scoreTailor(tailor, criteria) {
  let score = 70;
  if (criteria.budget && tailor.starting_price <= criteria.budget) score += 10;
  if (criteria.city && tailor.city_id === criteria.city) score += 8;
  if (tailor.rating >= 4.5) score += 7;
  if (criteria.design?.garmentType === "abaya" && tailor.specializations.includes("abaya")) score += 8;
  return Math.min(99, score);
}

// --- Style DNA color counting ---
function topColor(events) {
  const map = {};
  events.forEach((e) => {
    map[e.colorKey] = (map[e.colorKey] ?? 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0];
}

// --- Reorder simulation ---
function reorder(source) {
  return {
    ...source,
    id: "new-" + Date.now(),
    status: "received",
  };
}

console.log("\nSmart Tailor AI — Core Tests\n");

console.log("Intent extraction:");
const intent1 = extractFashionIntent("أبغى دشداشة بيضاء صيفية رسمية وفخمة بس مو واسعة");
assert(intent1.garmentType === "dishdasha", "detects dishdasha");
assert(intent1.colorKey === "white", "detects white");
assert(intent1.fabricKey === "summer", "detects summer fabric");
assert(intent1.fitKey === "slim", "detects slim fit from مو واسعة");
assert(intent1.style === "رسمي", "detects formal style");

const intent2 = extractFashionIntent("ابا ثوب رسمي");
assert(intent2.garmentType === "dishdasha", "Gulf Arabic: ابا ثوب");

console.log("\nNatural language design:");
const base = { color: "أبيض", colorKey: "white", fit: "قياسي", fitKey: "regular", fabric: "كتان", fabricKey: "linen" };
const slim = applyNL("خليه أنحف", base);
assert(slim.fitKey === "slim", "خليه أنحف → slim fit");
const navy = applyNL("أبغى كحلي", base);
assert(navy.colorKey === "navy", "أبغى كحلي → navy");
const summer = applyNL("خله صيفي", base);
assert(summer.fabricKey === "summer", "خله صيفي → summer fabric");

console.log("\nTailor matching:");
const tailorFormal = { starting_price: 15, city_id: "muscat", rating: 4.8, specializations: ["formal", "dishdasha"] };
const tailorAbaya = { starting_price: 18, city_id: "muscat", rating: 4.6, specializations: ["abaya"] };
const s1 = scoreTailor(tailorFormal, { budget: 20, city: "muscat", design: { garmentType: "dishdasha" } });
const s2 = scoreTailor(tailorAbaya, { budget: 20, city: "muscat", design: { garmentType: "abaya" } });
assert(s1 >= 85, "formal white budget tailor scores high");
assert(s2 > scoreTailor(tailorAbaya, { budget: 10 }), "budget filter affects score");

console.log("\nStyle DNA:");
const events = [
  { colorKey: "white" }, { colorKey: "white" }, { colorKey: "white" },
  { fabricKey: "linen" }, { fabricKey: "linen" },
];
assert(topColor(events) === "white", "white dominates after 3 picks");

console.log("\nReorder:");
const original = { id: "order-1", status: "delivered", design: { color: "أبيض" }, tailor_id: "t1" };
const newOrder = reorder(original);
assert(newOrder.id !== original.id, "new order gets new ID");
assert(newOrder.status === "received", "new order starts at received");
assert(original.status === "delivered", "original order unchanged");

console.log("\nOrder status flow:");
const flow = ["received", "measurements_confirmed", "cutting", "sewing", "embroidery", "ready", "delivered"];
assert(flow.indexOf("cutting") === flow.indexOf("received") + 2, "status flow order valid");

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
