import { getAppUrl } from "@/lib/constants/site";

export type AIProvider = "openrouter" | "openai" | "gemini" | "unconfigured";

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  visionModel?: string;
  baseUrl?: string;
}

export interface LLMResult {
  content: string | null;
  provider: AIProvider;
  model?: string;
  error?: string;
}

export function getAIConfig(): AIConfig {
  if (process.env.OPENROUTER_API_KEY?.trim()) {
    return {
      provider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY.trim(),
      model: process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini",
      visionModel: process.env.OPENROUTER_VISION_MODEL?.trim() || "openai/gpt-4o-mini",
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    };
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY.trim(),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      visionModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      baseUrl: "https://api.openai.com/v1/chat/completions",
    };
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    return {
      provider: "gemini",
      apiKey: process.env.GEMINI_API_KEY.trim(),
      model: process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash",
    };
  }
  return { provider: "unconfigured" };
}

export function isRealAIProvider(provider?: string | null): boolean {
  return Boolean(provider && provider !== "unconfigured" && provider !== "mock");
}

let openRouterKeyCache: { key: string; valid: boolean; error?: string; checkedAt: number } | null = null;

async function ensureOpenRouterInferenceKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const now = Date.now();
  if (
    openRouterKeyCache &&
    openRouterKeyCache.key === apiKey &&
    now - openRouterKeyCache.checkedAt < 5 * 60 * 1000
  ) {
    return { valid: openRouterKeyCache.valid, error: openRouterKeyCache.error };
  }
  const inspection = await inspectOpenRouterKey(apiKey);
  openRouterKeyCache = {
    key: apiKey,
    valid: inspection.valid,
    error: inspection.error,
    checkedAt: now,
  };
  return { valid: inspection.valid, error: inspection.error };
}

type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

async function callChatCompletions(
  config: AIConfig,
  messages: ChatMessage[],
  model: string
): Promise<LLMResult> {
  if (!config.apiKey || !config.baseUrl) {
    return { content: null, provider: config.provider, error: "No API key configured" };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

    if (config.provider === "openrouter") {
      headers["HTTP-Referer"] = getAppUrl();
      headers["X-Title"] = "Khayyatak";
    }

    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    const raw = await res.text();
    if (!res.ok) {
      let errorMsg = raw;
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string } };
        errorMsg = parsed.error?.message ?? raw;
      } catch {
        /* use raw */
      }
      console.error("[AI] Request failed:", res.status, errorMsg);
      return {
        content: null,
        provider: config.provider,
        model,
        error: `${res.status}: ${errorMsg}`,
      };
    }

    const data = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return {
      content: data.choices?.[0]?.message?.content ?? null,
      provider: config.provider,
      model,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI] Request error:", msg);
    return { content: null, provider: config.provider, model, error: msg };
  }
}

/** Server-only */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMResult> {
  const config = getAIConfig();
  if (config.provider === "unconfigured") {
    return {
      content: null,
      provider: "unconfigured",
      error: "AI service is not configured. Set OPENROUTER_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.",
    };
  }

  if (config.provider === "openrouter" && config.apiKey) {
    const keyCheck = await ensureOpenRouterInferenceKey(config.apiKey);
    if (!keyCheck.valid) {
      return {
        content: null,
        provider: "openrouter",
        error: keyCheck.error ?? "Invalid OpenRouter key",
      };
    }
  }

  if (config.provider === "gemini" && config.apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userPrompt}` }] }],
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return { content: null, provider: "gemini", model: config.model, error: err };
      }
      const data = await res.json();
      return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? null,
        provider: "gemini",
        model: config.model,
      };
    } catch (error) {
      return {
        content: null,
        provider: "gemini",
        model: config.model,
        error: error instanceof Error ? error.message : "Gemini error",
      };
    }
  }

  return callChatCompletions(
    config,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    config.model!
  );
}

/** Server-only — vision / image analysis */
export async function callLLMWithVision(
  systemPrompt: string,
  userPrompt: string,
  imageDataUrl: string
): Promise<LLMResult> {
  const config = getAIConfig();
  if (config.provider === "unconfigured" || !config.apiKey || !config.baseUrl) {
    return {
      content: null,
      provider: "unconfigured",
      error: "AI image analysis is unavailable because no vision provider is configured.",
    };
  }

  if (config.provider === "openrouter") {
    const keyCheck = await ensureOpenRouterInferenceKey(config.apiKey);
    if (!keyCheck.valid) {
      return {
        content: null,
        provider: "openrouter",
        error: keyCheck.error ?? "Invalid OpenRouter key",
      };
    }
  }

  return callChatCompletions(
    config,
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    config.visionModel ?? config.model!
  );
}

/** Server-only — inspect OpenRouter key type */
export async function inspectOpenRouterKey(apiKey: string): Promise<{
  valid: boolean;
  isManagementKey?: boolean;
  isProvisioningKey?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return { valid: false, error: "Invalid API key" };
    }
    const json = (await res.json()) as {
      data?: { is_management_key?: boolean; is_provisioning_key?: boolean };
    };
    const isManagement = json.data?.is_management_key === true;
    const isProvisioning = json.data?.is_provisioning_key === true;
    if (isManagement || isProvisioning) {
      return {
        valid: false,
        isManagementKey: isManagement,
        isProvisioningKey: isProvisioning,
        error:
          "This is a Management/Provisioning key — create an Inference API key at openrouter.ai/keys",
      };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Could not verify key" };
  }
}

/** Test connectivity — server only */
export async function testAIConnection(): Promise<
  LLMResult & { configured: boolean; keyIssue?: string }
> {
  const config = getAIConfig();
  if (config.provider === "unconfigured") {
    return {
      content: null,
      provider: "unconfigured",
      configured: false,
      error: "AI service is not configured. Set OPENROUTER_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.",
    };
  }

  if (config.provider === "openrouter" && config.apiKey) {
    const inspection = await inspectOpenRouterKey(config.apiKey);
    if (!inspection.valid && inspection.error) {
      return {
        content: null,
        provider: "openrouter",
        configured: true,
        error: inspection.error,
        keyIssue: inspection.isManagementKey ? "management_key" : "invalid_key",
      };
    }
  }

  const result = await callLLM("You are a test assistant.", "Reply with exactly: OK");
  return { ...result, configured: true };
}

/** Safe from client — hits /api/ai/chat */
export async function callLLMFromClient(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string | null; provider?: string; error?: string }> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: data.error ?? "Request failed" };
    return {
      content: data.content ?? null,
      provider: data.provider,
      error: data.error,
    };
  } catch (error) {
    return {
      content: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/** Safe from client — hits /api/ai/vision */
export async function callVisionFromClient(
  systemPrompt: string,
  userPrompt: string,
  imageDataUrl: string
): Promise<{ content: string | null; provider?: string; error?: string }> {
  try {
    const res = await fetch("/api/ai/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userPrompt, imageDataUrl }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: data.error ?? "Vision request failed" };
    return {
      content: data.content ?? null,
      provider: data.provider,
      error: data.error,
    };
  } catch (error) {
    return {
      content: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/** Fetch AI status from client */
export async function fetchAIStatus(): Promise<{
  provider: string;
  model: string | null;
  configured: boolean;
  connected?: boolean;
  error?: string;
  keyIssue?: string | null;
}> {
  try {
    const res = await fetch("/api/ai/chat");
    return await res.json();
  } catch {
    return { provider: "unconfigured", model: null, configured: false, error: "Cannot reach API" };
  }
}

export function extractJsonFromLLM<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
