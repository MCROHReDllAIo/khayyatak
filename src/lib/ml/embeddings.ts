/**
 * OpenRouter / OpenAI-compatible embeddings for Style Twin.
 */

import { getAIConfig, inspectOpenRouterKey } from "@/lib/ai/provider";
import { getAppUrl } from "@/lib/constants/site";
import { STYLE_TWIN_EMBEDDING_MODEL } from "./types";

export interface EmbedResult {
  embedding: number[] | null;
  model: string;
  error?: string;
}

function embeddingsUrl(provider: string, baseUrl?: string): string | null {
  if (provider === "openrouter") return "https://openrouter.ai/api/v1/embeddings";
  if (provider === "openai") return "https://api.openai.com/v1/embeddings";
  if (baseUrl?.includes("openrouter")) return "https://openrouter.ai/api/v1/embeddings";
  if (baseUrl?.includes("openai")) return "https://api.openai.com/v1/embeddings";
  return null;
}

export function isEmbeddingsConfigured(): boolean {
  const config = getAIConfig();
  return config.provider === "openrouter" || config.provider === "openai";
}

export async function embedText(text: string): Promise<EmbedResult> {
  const trimmed = text.trim();
  const config = getAIConfig();
  const model =
    process.env.OPENROUTER_EMBEDDING_MODEL?.trim() ||
    (config.provider === "openai" ? "text-embedding-3-small" : STYLE_TWIN_EMBEDDING_MODEL);
  if (!trimmed) {
    return { embedding: null, model, error: "Empty text" };
  }

  if (config.provider === "unconfigured" || !config.apiKey) {
    return { embedding: null, model, error: "AI is not configured" };
  }

  const url = embeddingsUrl(config.provider, config.baseUrl);
  if (!url) {
    return {
      embedding: null,
      model,
      error: "Embeddings require OpenRouter or OpenAI",
    };
  }

  if (config.provider === "openrouter") {
    const keyCheck = await inspectOpenRouterKey(config.apiKey);
    if (!keyCheck.valid) {
      return { embedding: null, model, error: keyCheck.error ?? "Invalid OpenRouter key" };
    }
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
    if (config.provider === "openrouter") {
      headers["HTTP-Referer"] = getAppUrl();
      headers["X-Title"] = "Khayyatak Style Twin";
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        input: trimmed.slice(0, 8000),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        embedding: null,
        model,
        error: `Embedding failed (${res.status}): ${errText.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
      model?: string;
    };
    const embedding = json.data?.[0]?.embedding;
    if (!embedding?.length) {
      return { embedding: null, model, error: "No embedding returned" };
    }
    return { embedding, model: json.model ?? model };
  } catch (err) {
    return {
      embedding: null,
      model,
      error: err instanceof Error ? err.message : "Embedding request failed",
    };
  }
}
