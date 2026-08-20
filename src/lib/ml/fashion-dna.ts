/**
 * Extract Fashion DNA from image (vision) or free text.
 */

import { callLLM, callLLMWithVision, extractJsonFromLLM, getAIConfig, isRealAIProvider } from "@/lib/ai/provider";
import { parseFashionDna, type FashionDNA } from "./types";

const SYSTEM = `You analyze Omani / Gulf fashion (dishdasha, abaya, fabric, embroidery).
Return ONLY compact JSON with keys:
category (dishdasha|abaya|fabric|embroidery|kids|other),
color, colorKey (english key like white|black|red),
styleCut, fabric, embroidery, occasion, collar, sleeve,
gender (men|women|unisex|kids),
summaryAr, summaryEn, tags (string array).
Be precise. Do not invent store or brand names.`;

export async function extractFashionDnaFromImage(
  imageDataUrl: string,
  hint?: string
): Promise<{ dna: FashionDNA | null; error?: string; provider?: string }> {
  const config = getAIConfig();
  if (config.provider === "unconfigured") {
    return { dna: null, error: "AI is not configured", provider: "unconfigured" };
  }

  const result = await callLLMWithVision(
    SYSTEM,
    hint?.trim() || "Extract Fashion DNA for Style Twin matching against a real tailor catalog.",
    imageDataUrl
  );

  if (!result.content || !isRealAIProvider(result.provider)) {
    return {
      dna: null,
      error: result.error ?? "Vision analysis failed",
      provider: result.provider,
    };
  }

  const parsed = extractJsonFromLLM<Record<string, unknown>>(result.content);
  const dna = parseFashionDna(parsed);
  if (!dna) {
    return { dna: null, error: "Could not parse Fashion DNA", provider: result.provider };
  }
  return { dna, provider: result.provider };
}

export async function extractFashionDnaFromText(
  text: string
): Promise<{ dna: FashionDNA | null; error?: string; provider?: string }> {
  const config = getAIConfig();
  if (config.provider === "unconfigured") {
    return { dna: null, error: "AI is not configured", provider: "unconfigured" };
  }

  const result = await callLLM(
    SYSTEM,
    `User request: ${text.trim()}\nExtract Fashion DNA JSON for catalog matching.`
  );

  if (!result.content || !isRealAIProvider(result.provider)) {
    return {
      dna: null,
      error: result.error ?? "Text analysis failed",
      provider: result.provider,
    };
  }

  const parsed = extractJsonFromLLM<Record<string, unknown>>(result.content);
  const dna = parseFashionDna(parsed);
  if (!dna) {
    // Fallback: minimal DNA from raw text so embedding still works
    return {
      dna: {
        summaryAr: text.trim(),
        summaryEn: text.trim(),
        tags: text.trim().split(/\s+/).slice(0, 12),
      },
      provider: result.provider,
    };
  }
  if (!dna.summaryAr) dna.summaryAr = text.trim();
  if (!dna.summaryEn) dna.summaryEn = text.trim();
  return { dna, provider: result.provider };
}
