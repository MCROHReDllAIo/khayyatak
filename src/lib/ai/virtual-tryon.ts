/**
 * Real virtual try-on via Replicate — never CSS overlay.
 * Requires TRYON_AI_PROVIDER_KEY (Replicate API token).
 */

import { logAICall } from "@/lib/db/analytics";

export type TryOnStatus = "success" | "BLOCKED_BY_PROVIDER" | "error";

export interface TryOnProviderConfig {
  configured: boolean;
  provider: string;
  model: string;
  envKey: string;
  setupUrl: string;
}

export interface TryOnRequest {
  userImageDataUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
  userId?: string;
  productId?: string;
}

export interface TryOnResponse {
  status: TryOnStatus;
  imageUrl?: string;
  imageData?: string;
  provider?: string;
  model?: string;
  requestId?: string;
  latencyMs?: number;
  error?: string;
  blockedReason?: string;
}

const DEFAULT_MODEL =
  process.env.TRYON_AI_MODEL?.trim() ||
  "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56eaaffd174bf7269528a8d0d738e017";

export function getTryOnProviderConfig(): TryOnProviderConfig {
  return {
    configured: Boolean(process.env.TRYON_AI_PROVIDER_KEY?.trim()),
    provider: "replicate",
    model: DEFAULT_MODEL,
    envKey: "TRYON_AI_PROVIDER_KEY",
    setupUrl: "https://replicate.com/account/api-tokens",
  };
}

async function pollReplicatePrediction(
  predictionUrl: string,
  apiKey: string,
  maxWaitMs = 120_000
): Promise<{ output?: unknown; error?: string; id?: string }> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(predictionUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return { error: `Replicate poll failed: ${res.status}` };
    }

    const data = (await res.json()) as {
      id?: string;
      status?: string;
      output?: unknown;
      error?: string;
    };

    if (data.status === "succeeded") {
      return { output: data.output, id: data.id };
    }
    if (data.status === "failed" || data.status === "canceled") {
      return { error: data.error ?? `Prediction ${data.status}` };
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return { error: "Virtual try-on timed out" };
}

export async function runVirtualTryOn(req: TryOnRequest): Promise<TryOnResponse> {
  const config = getTryOnProviderConfig();
  const start = Date.now();

  if (!config.configured) {
    return {
      status: "BLOCKED_BY_PROVIDER",
      blockedReason:
        "النظرة الافتراضية غير مفعلة حاليًا. Provider: replicate — Env: TRYON_AI_PROVIDER_KEY — Setup: https://replicate.com/account/api-tokens",
      error: "TRYON_AI_PROVIDER_KEY is not configured",
    };
  }

  const apiKey = process.env.TRYON_AI_PROVIDER_KEY!.trim();

  try {
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        version: DEFAULT_MODEL.includes(":")
          ? DEFAULT_MODEL.split(":")[1]
          : DEFAULT_MODEL,
        input: {
          human_img: req.userImageDataUrl,
          garm_img: req.garmentImageUrl,
          garment_des: req.garmentDescription ?? "garment",
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      await logAICall({
        userId: req.userId,
        feature: "virtual_tryon",
        provider: "replicate",
        model: DEFAULT_MODEL,
        status: "error",
        latencyMs: Date.now() - start,
        errorMessage: errText.slice(0, 500),
      });
      return { status: "error", error: `Replicate error: ${createRes.status} — ${errText.slice(0, 200)}` };
    }

    let prediction = (await createRes.json()) as {
      id?: string;
      urls?: { get?: string };
      status?: string;
      output?: unknown;
      error?: string;
    };

    if (prediction.status !== "succeeded" && prediction.urls?.get) {
      const polled = await pollReplicatePrediction(prediction.urls.get, apiKey);
      if (polled.error) {
        await logAICall({
          userId: req.userId,
          feature: "virtual_tryon",
          provider: "replicate",
          model: DEFAULT_MODEL,
          status: "error",
          latencyMs: Date.now() - start,
          errorMessage: polled.error,
        });
        return { status: "error", error: polled.error };
      }
      prediction = { ...prediction, output: polled.output, status: "succeeded" };
    }

    const output = prediction.output;
    let imageUrl: string | undefined;

    if (typeof output === "string") {
      imageUrl = output;
    } else if (Array.isArray(output) && typeof output[0] === "string") {
      imageUrl = output[0];
    }

    if (!imageUrl) {
      return { status: "error", error: "No image returned from provider" };
    }

    const latencyMs = Date.now() - start;

    await logAICall({
      userId: req.userId,
      feature: "virtual_tryon",
      provider: "replicate",
      model: DEFAULT_MODEL,
      status: "success",
      latencyMs,
    });

    return {
      status: "success",
      imageUrl,
      provider: "replicate",
      model: DEFAULT_MODEL,
      requestId: prediction.id,
      latencyMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logAICall({
      userId: req.userId,
      feature: "virtual_tryon",
      provider: "replicate",
      model: DEFAULT_MODEL,
      status: "error",
      latencyMs: Date.now() - start,
    });
    return { status: "error", error: msg };
  }
}
