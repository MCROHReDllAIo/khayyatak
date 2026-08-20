"use client";

import { useEffect, useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2, X, ExternalLink } from "lucide-react";
import { fetchAIStatus } from "@/lib/ai/provider";

const DISMISS_KEY = "st_ai_banner_dismissed";

export function AIStatusBadge({ className = "" }: { className?: string }) {
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

  if (!status.configured) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full ${className}`}>
        <AlertCircle className="h-3 w-3" />
        Demo AI
      </span>
    );
  }

  if (status.connected) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full ${className}`}>
        <CheckCircle2 className="h-3 w-3" />
        OpenRouter · {status.model ?? "connected"}
      </span>
    );
  }

  if (status.keyIssue === "management_key") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full ${className}`}>
        <AlertCircle className="h-3 w-3" />
        Demo AI — wrong key type
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full ${className}`} title={status.error ?? undefined}>
      <AlertCircle className="h-3 w-3" />
      Demo AI fallback
    </span>
  );
}

export function AIStatusBanner() {
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

  if (!status?.configured || status.connected || dismissed) return null;

  const isManagementKey = status.keyIssue === "management_key";

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-3">
      <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
      <div className="flex-1 min-w-0">
        {isManagementKey ? (
          <>
            <p className="font-medium">مفتاح OpenRouter خاطئ — يعمل Demo AI الآن</p>
            <p className="text-xs mt-1 opacity-90">
              المفتاح الحالي هو <strong>Management Key</strong> ولا يعمل للمحادثات. أنشئ مفتاح <strong>Inference API Key</strong> من{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
                openrouter.ai/keys
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              ثم ضعه في <code className="text-[11px] bg-amber-100 px-1 rounded">.env.local</code> وأعد تشغيل <code className="text-[11px] bg-amber-100 px-1 rounded">npm run dev</code>
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">OpenRouter غير متصل — يعمل Demo AI</p>
            <p className="text-xs mt-1 opacity-90">{status.error ?? "تحقق من OPENROUTER_API_KEY"}</p>
          </>
        )}
      </div>
      <button type="button" onClick={dismiss} className="p-1 rounded-lg hover:bg-amber-100 shrink-0" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
