"use client";

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, X, ExternalLink, AlertTriangle } from "lucide-react";
import { fetchAIStatus } from "@/lib/ai/provider";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import Link from "next/link";
import type { SystemStatusPayload } from "@/lib/admin/system-status";

const DISMISS_KEY = "st_ai_banner_dismissed";

export function AIStatusBadge({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<{
    provider: string;
    model: string | null;
    configured: boolean;
    connected?: boolean;
    error?: string;
    keyIssue?: string | null;
  } | null>(null);

  useEffect(() => {
    fetchAIStatus().then(setStatus);
  }, []);

  if (!status) return null;

  if (status.connected) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full ${className}`}
      >
        <CheckCircle2 className="h-3 w-3" />
        OpenRouter · {status.model ?? "connected"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full ${className}`}
    >
      <Sparkles className="h-3 w-3" />
      {t("ذكاء خياطك", "Khayyatak AI")}
    </span>
  );
}

/** Admin-only setup notice — shown across admin layout when features need config */
export function AIStatusBanner() {
  const { t } = useLocale();
  const { role } = useAuth();
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchAIStatus>> | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusPayload | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    fetchAIStatus().then(setStatus);
    fetch("/api/admin/system-status")
      .then((r) => r.json())
      .then(setSystemStatus)
      .catch(() => setSystemStatus(null));
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (role !== "admin") return null;

  const isManagementKey = status?.keyIssue === "management_key";
  const aiNeedsAttention = status?.configured && !status.connected;
  const tryonMissing = systemStatus?.features.some(
    (f) => f.id === "virtual_tryon" && f.status === "needs_config"
  );
  const showMainBanner = aiNeedsAttention && (!dismissed || isManagementKey);

  if (!showMainBanner && !tryonMissing) return null;

  const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost";

  const dismiss = () => {
    if (isManagementKey) return;
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-3 mb-4">
      {showMainBanner && (
        <div className="rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-950 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-700" />
          <div className="flex-1 min-w-0">
            {isManagementKey ? (
              <>
                <p className="font-semibold">
                  {t(
                    "مفتاح OpenRouter غير مناسب — أضف مفتاح Inference",
                    "OpenRouter key type is wrong — add an Inference key"
                  )}
                </p>
                <p className="text-xs mt-1.5 opacity-90 leading-relaxed">
                  {t(
                    "المفتاح الحالي Management Key ولا يعمل للمحادثات أو الابتكار. أنشئ Inference API Key من",
                    "The current key is a Management Key and cannot run chat or innovation. Create an Inference API Key at"
                  )}{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-0.5 font-medium"
                  >
                    openrouter.ai/keys
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {isProduction
                    ? t(" ثم أضفه في Railway → Variables → OPENROUTER_API_KEY", " then set Railway → Variables → OPENROUTER_API_KEY")
                    : t(" ثم ضعه في .env.local وأعد تشغيل npm run dev", " then add to .env.local and restart npm run dev")}
                </p>
                <Link href="/admin/settings" className="text-xs mt-2 inline-block font-medium text-primary underline">
                  {t("عرض دليل الإعداد الكامل", "View full setup guide")}
                </Link>
              </>
            ) : (
              <>
                <p className="font-semibold">{t("OpenRouter غير متصل", "OpenRouter is not connected")}</p>
                <p className="text-xs mt-1 opacity-90">{status?.error ?? t("تحقق من OPENROUTER_API_KEY", "Check OPENROUTER_API_KEY")}</p>
              </>
            )}
          </div>
          {!isManagementKey && (
            <button type="button" onClick={dismiss} className="p-1 rounded-lg hover:bg-amber-100 shrink-0" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {tryonMissing && status?.connected && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-3">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {t("فعّل التجربة الافتراضية ومعاينة الابتكار", "Enable virtual try-on & innovation preview")}
            </p>
            <p className="text-xs mt-1 opacity-90">
              {t(
                "أضف TRYON_AI_PROVIDER_KEY (Replicate) في Railway —",
                "Add TRYON_AI_PROVIDER_KEY (Replicate) in Railway —"
              )}{" "}
              <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">
                replicate.com
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
