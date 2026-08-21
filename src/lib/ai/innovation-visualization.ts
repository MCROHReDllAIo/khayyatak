/**
 * AI visualization via Replicate — not fake CSS.
 * Requires INNOVATION_IMAGE_PROVIDER_KEY or TRYON_AI_PROVIDER_KEY (Replicate token).
 */

import { logAICall } from "@/lib/db/analytics";
import type { InnovationDesignSpec } from "@/lib/innovation/types";

export interface VisualizationResult {
  status: "success" | "BLOCKED_BY_PROVIDER" | "error";
  imageUrl?: string;
  provider?: string;
  model?: string;
  error?: string;
  blockedReason?: string;
}

const FLUX_MODEL =
  process.env.INNOVATION_IMAGE_MODEL?.trim() ||
  "black-forest-labs/flux-schnell";

function getApiKey(): string | null {
  return (
    process.env.INNOVATION_IMAGE_PROVIDER_KEY?.trim() ||
    process.env.TRYON_AI_PROVIDER_KEY?.trim() ||
    null
  );
}

function buildPrompt(spec: InnovationDesignSpec): string {
  const garment = spec.category === "abaya" ? "Omani abaya" : "Omani dishdasha thobe";
  return [
    `Photorealistic fashion product studio photo of a ${garment} on an invisible mannequin`,
    `exact color ${spec.color} (${spec.colorHex || spec.colorKey})`,
    `${spec.fabric} fabric with realistic weave and soft folds`,
    spec.opening ? `${spec.opening} opening` : null,
    spec.sleeves ? `${spec.sleeves} sleeves` : null,
    spec.embroidery && spec.embroidery !== "none" ? `${spec.embroidery} embroidery` : "clean minimal chest",
    spec.occasion ? `${spec.occasion} occasion styling` : "everyday elegant",
    "soft natural studio lighting, shallow depth of field, high-end editorial fashion photography",
    "no person face, garment only, accurate proportions, Oman Gulf traditional wear",
  ]
    .filter(Boolean)
    .join(", ");
}

export async function generateDesignVisualization(
  spec: InnovationDesignSpec,
  userId?: string
): Promise<VisualizationResult> {
  const apiKey = getApiKey();
  const start = Date.now();

  if (!apiKey) {
    return {
      status: "BLOCKED_BY_PROVIDER",
      blockedReason:
        "معاينة AI غير مفعلة. Provider: replicate — Env: INNOVATION_IMAGE_PROVIDER_KEY أو TRYON_AI_PROVIDER_KEY — Integration: src/lib/ai/innovation-visualization.ts",
      error: "No image generation API key configured",
    };
  }

  try {
    const createRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        input: {
          prompt: buildPrompt(spec),
          num_outputs: 1,
          aspect_ratio: "3:4",
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      await logAICall({
        userId,
        feature: "innovation_visualization",
        provider: "replicate",
        model: FLUX_MODEL,
        status: "error",
        latencyMs: Date.now() - start,
        errorMessage: err.slice(0, 300),
      });
      return { status: "error", error: `Replicate: ${createRes.status}` };
    }

    const prediction = (await createRes.json()) as {
      output?: string | string[];
      status?: string;
      error?: string;
    };

    let imageUrl: string | undefined;
    if (typeof prediction.output === "string") imageUrl = prediction.output;
    else if (Array.isArray(prediction.output)) imageUrl = prediction.output[0];

    if (!imageUrl) {
      return { status: "error", error: prediction.error ?? "No image returned" };
    }

    await logAICall({
      userId,
      feature: "innovation_visualization",
      provider: "replicate",
      model: FLUX_MODEL,
      status: "success",
      latencyMs: Date.now() - start,
    });

    return {
      status: "success",
      imageUrl,
      provider: "replicate",
      model: FLUX_MODEL,
    };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Visualization failed",
    };
  }
}

export function getVisualizationConfig() {
  return {
    configured: Boolean(getApiKey()),
    provider: "replicate",
    model: FLUX_MODEL,
    envKeys: ["INNOVATION_IMAGE_PROVIDER_KEY", "TRYON_AI_PROVIDER_KEY"],
    integration: "src/lib/ai/innovation-visualization.ts",
    label: "AI Visualization — visual concept, not manufacturing guarantee",
  };
}

export function get3DPreviewStatus() {
  return {
    available: true,
    status: "WEBGL_INTERACTIVE",
    reason:
      "Interactive WebGL garment (Three.js + React Three Fiber). Procedural abaya/dishdasha mesh with lighting, orbit, and part picks — not a scanned photogrammetry model.",
    integration: "src/components/innovation/Garment3DViewer.tsx",
  };
}
