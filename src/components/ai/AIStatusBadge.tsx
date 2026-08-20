"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, X, ExternalLink, AlertTriangle } from "lucide-react";
import { fetchAIStatus } from "@/lib/ai/provider";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";

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
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full ${className}`}
      >
        <CheckCircle2 className="h-3 w-3" />
        OpenRouter · {status.model ?? "OK"}
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

/** Compact admin notice — only when AI chat is broken */
export function AIStatusBanner() {
  const { t } = useLocale();
  const { role } = useAuth();
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchAIStatus>> | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    fetchAIStatus().then(setStatus);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (role !== "admin") return null;
  if (!status?.configured || status.connected) return null;

  const isManagementKey = status.keyIssue === "management_key";
  if (!isManagementKey && dismissed) return null;

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
    <div className="mb-5 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3.5 flex gap-3 items-start">
      <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-950">
          {isManagementKey
            ? t("مفتاح OpenRouter يحتاج تحديث", "OpenRouter key needs updating")
            : t("OpenRouter غير متصل", "OpenRouter is not connected")}
        </p>
        <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
          {isManagementKey ? (
            <>
              {t(
                "استخدم Inference API Key من",
                "Use an Inference API Key from"
              )}{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-0.5"
              >
                openrouter.ai/keys
                <ExternalLink className="h-3 w-3" />
              </a>
              {isProduction
                ? t(" وضعه في Railway → Variables → OPENROUTER_API_KEY", " and set Railway → Variables → OPENROUTER_API_KEY")
                : t(" وضعه في .env.local ثم أعد التشغيل", " and set it in .env.local, then restart")}
            </>
          ) : (
            status.error ?? t("تحقق من OPENROUTER_API_KEY", "Check OPENROUTER_API_KEY")
          )}
        </p>
        <Link
          href="/admin/settings"
          className="inline-flex mt-2 text-xs font-medium text-navy hover:text-primary transition-colors"
        >
          {t("الإعدادات ←", "Settings →")}
        </Link>
      </div>
      {!isManagementKey && (
        <button
          type="button"
          onClick={dismiss}
          className="p-1.5 rounded-lg hover:bg-amber-100/80 text-amber-800/60 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
