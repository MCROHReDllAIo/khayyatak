import { getAuthProvider, isAuthConfigured } from "@/lib/auth/config";
import { getAIConfig, inspectOpenRouterKey, testAIConnection } from "@/lib/ai/provider";
import { getTryOnProviderConfig } from "@/lib/ai/virtual-tryon";
import { getVisualizationConfig } from "@/lib/ai/innovation-visualization";
import { isPostgresConfigured } from "@/lib/db/postgres";
import { isEmbeddingsConfigured } from "@/lib/ml/embeddings";
import { countProductEmbeddings } from "@/lib/ml/product-embeddings-db";
import { STYLE_TWIN_EMBEDDING_MODEL } from "@/lib/ml/types";

export type FeatureStatus = "ready" | "needs_config" | "misconfigured" | "offline";

export interface SystemFeatureCheck {
  id: string;
  name_ar: string;
  name_en: string;
  status: FeatureStatus;
  detail_ar?: string;
  detail_en?: string;
  envKey?: string;
  setupUrl?: string;
}

export interface SystemStatusPayload {
  checkedAt: string;
  features: SystemFeatureCheck[];
  ai: {
    provider: string;
    model: string | null;
    configured: boolean;
    connected: boolean;
    keyIssue?: string | null;
    error?: string | null;
  };
  styleTwin?: {
    configured: boolean;
    indexedCount: number;
    model: string;
  };
}

export async function getSystemStatusPayload(): Promise<SystemStatusPayload> {
  const aiTest = await testAIConnection();
  const tryon = getTryOnProviderConfig();
  const innovation = getVisualizationConfig();
  const authProvider = getAuthProvider();
  const dbConfigured = isPostgresConfigured();
  const embeddingsOk = isEmbeddingsConfigured();
  let indexedCount = 0;
  try {
    indexedCount = await countProductEmbeddings();
  } catch {
    indexedCount = 0;
  }

  const features: SystemFeatureCheck[] = [
    {
      id: "database",
      name_ar: "قاعدة البيانات",
      name_en: "Database",
      status: dbConfigured ? "ready" : "needs_config",
      detail_ar: dbConfigured ? "PostgreSQL على Railway" : "أضف DATABASE_URL في Railway",
      detail_en: dbConfigured ? "Railway PostgreSQL" : "Set DATABASE_URL in Railway",
      envKey: "DATABASE_URL",
    },
    {
      id: "auth",
      name_ar: "تسجيل الدخول",
      name_en: "Authentication",
      status: isAuthConfigured() ? "ready" : "needs_config",
      detail_ar: isAuthConfigured() ? `وضع ${authProvider}` : "أضف DATABASE_URL أو Supabase",
      detail_en: isAuthConfigured() ? `${authProvider} mode` : "Set DATABASE_URL or Supabase",
    },
    {
      id: "ai_chat",
      name_ar: "محادثة AI والابتكار",
      name_en: "AI Chat & Innovation",
      status: !aiTest.configured
        ? "needs_config"
        : aiTest.keyIssue === "management_key"
          ? "misconfigured"
          : aiTest.content
            ? "ready"
            : "offline",
      detail_ar:
        aiTest.keyIssue === "management_key"
          ? "استخدم Inference Key وليس Management Key"
          : aiTest.error ?? (aiTest.content ? "متصل" : "تحقق من OPENROUTER_API_KEY"),
      detail_en:
        aiTest.keyIssue === "management_key"
          ? "Use an Inference key, not a Management key"
          : aiTest.error ?? (aiTest.content ? "Connected" : "Check OPENROUTER_API_KEY"),
      envKey: "OPENROUTER_API_KEY",
      setupUrl: "https://openrouter.ai/keys",
    },
    {
      id: "style_twin",
      name_ar: "توأم الأسلوب (ML)",
      name_en: "Style Twin ML",
      status: !embeddingsOk
        ? "needs_config"
        : !dbConfigured
          ? "needs_config"
          : indexedCount > 0
            ? "ready"
            : "offline",
      detail_ar: !embeddingsOk
        ? "يحتاج OPENROUTER_API_KEY للـ embeddings"
        : indexedCount > 0
          ? `مفهرس: ${indexedCount} منتج · ${STYLE_TWIN_EMBEDDING_MODEL}`
          : "شغّل npm run ml:index-products لفهرسة المنتجات",
      detail_en: !embeddingsOk
        ? "Needs OPENROUTER_API_KEY for embeddings"
        : indexedCount > 0
          ? `Indexed: ${indexedCount} products · ${STYLE_TWIN_EMBEDDING_MODEL}`
          : "Run npm run ml:index-products to index products",
      envKey: "OPENROUTER_EMBEDDING_MODEL",
      setupUrl: "https://openrouter.ai/docs",
    },
    {
      id: "virtual_tryon",
      name_ar: "التجربة الافتراضية",
      name_en: "Virtual Try-On",
      status: tryon.configured ? "ready" : "needs_config",
      detail_ar: tryon.configured ? "Replicate مفعّل" : "أضف TRYON_AI_PROVIDER_KEY",
      detail_en: tryon.configured ? "Replicate enabled" : "Set TRYON_AI_PROVIDER_KEY",
      envKey: tryon.envKey,
      setupUrl: tryon.setupUrl,
    },
    {
      id: "innovation_viz",
      name_ar: "معاينة الابتكار",
      name_en: "Innovation Preview",
      status: innovation.configured ? "ready" : "needs_config",
      detail_ar: innovation.configured ? "Replicate Flux مفعّل" : "أضف INNOVATION_IMAGE_PROVIDER_KEY",
      detail_en: innovation.configured ? "Replicate Flux enabled" : "Set INNOVATION_IMAGE_PROVIDER_KEY",
      envKey: "INNOVATION_IMAGE_PROVIDER_KEY",
      setupUrl: "https://replicate.com/account/api-tokens",
    },
  ];

  const config = getAIConfig();
  return {
    checkedAt: new Date().toISOString(),
    features,
    ai: {
      provider: config.provider,
      model: config.model ?? null,
      configured: aiTest.configured,
      connected: Boolean(aiTest.content),
      keyIssue: aiTest.keyIssue ?? null,
      error: aiTest.error ?? null,
    },
    styleTwin: {
      configured: embeddingsOk,
      indexedCount,
      model: STYLE_TWIN_EMBEDDING_MODEL,
    },
  };
}

/** Lightweight health check for dashboard — no paid LLM test call */
export async function getQuickAIHealthStatus(): Promise<"operational" | "warning" | "error"> {
  const config = getAIConfig();
  if (config.provider === "unconfigured") return "warning";
  if (config.provider === "openrouter" && config.apiKey) {
    const inspection = await inspectOpenRouterKey(config.apiKey);
    if (!inspection.valid) return inspection.isManagementKey ? "error" : "warning";
  }
  return "operational";
}
