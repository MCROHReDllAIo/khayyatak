"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Shirt,
  Palette,
  Database,
  KeyRound,
} from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import type { SystemFeatureCheck, SystemStatusPayload } from "@/lib/admin/system-status";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Sparkles> = {
  database: Database,
  auth: KeyRound,
  ai_chat: Sparkles,
  virtual_tryon: Shirt,
  innovation_viz: Palette,
};

const STATUS_STYLE: Record<SystemFeatureCheck["status"], { icon: typeof CheckCircle2; className: string }> = {
  ready: { icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  needs_config: { icon: AlertTriangle, className: "text-amber-700 bg-amber-50 border-amber-200" },
  misconfigured: { icon: XCircle, className: "text-red-700 bg-red-50 border-red-200" },
  offline: { icon: XCircle, className: "text-red-700 bg-red-50 border-red-200" },
};

export function SystemSetupPanel() {
  const { t } = useLocale();
  const [status, setStatus] = useState<SystemStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/system-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost";

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-navy text-lg">{t("حالة الميزات", "Feature Status")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                "تأكد من إعداد المتغيرات في Railway لتفعيل كل الميزات",
                "Configure Railway variables to enable all features"
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm text-primary hover:bg-primary/5 px-3 py-2 rounded-lg"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t("تحديث", "Refresh")}
          </button>
        </div>

        {!status ? (
          <p className="text-sm text-muted-foreground">{t("تعذر تحميل الحالة", "Could not load status")}</p>
        ) : (
          <div className="grid gap-3">
            {status.features.map((feature) => {
              const style = STATUS_STYLE[feature.status];
              const Icon = ICONS[feature.id] ?? Sparkles;
              const StatusIcon = style.icon;
              return (
                <div
                  key={feature.id}
                  className={cn("rounded-xl border p-4 flex gap-4 items-start", style.className)}
                >
                  <div className="h-9 w-9 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{t(feature.name_ar, feature.name_en)}</p>
                      <StatusIcon className="h-4 w-4 shrink-0" />
                    </div>
                    <p className="text-xs mt-1 opacity-90">{t(feature.detail_ar ?? "", feature.detail_en ?? "")}</p>
                    {feature.envKey && feature.status !== "ready" && (
                      <p className="text-xs mt-2 font-mono bg-white/50 rounded px-2 py-1 inline-block">
                        {feature.envKey}
                      </p>
                    )}
                    {feature.setupUrl && feature.status !== "ready" && (
                      <a
                        href={feature.setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-2 inline-flex items-center gap-1 underline"
                      >
                        {t("إعداد المفتاح", "Set up key")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {status?.ai.keyIssue === "management_key" && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t("إصلاح OpenRouter (مطلوب للمحادثات)", "Fix OpenRouter (required for chat)")}
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
              <li>
                {t("افتح", "Open")}{" "}
                <a href="https://openrouter.ai/keys" className="underline" target="_blank" rel="noopener noreferrer">
                  openrouter.ai/keys
                </a>
              </li>
              <li>{t("أنشئ Inference API Key (ليس Management)", "Create Inference API Key (not Management)")}</li>
              <li>
                {isProduction
                  ? t("في Railway → Variables → استبدل OPENROUTER_API_KEY", "In Railway → Variables → replace OPENROUTER_API_KEY")
                  : t("في .env.local → OPENROUTER_API_KEY ثم أعد التشغيل", "In .env.local → OPENROUTER_API_KEY then restart")}
              </li>
            </ol>
          </div>
        )}

        {status && status.features.some((f) => f.id === "virtual_tryon" && f.status !== "ready") && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p className="font-medium">{t("Replicate (اختياري — للتجربة الافتراضية والابتكار)", "Replicate (optional — try-on & innovation)")}</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {t(
                "نفس المفتاح يعمل للاثنين: TRYON_AI_PROVIDER_KEY",
                "Same token works for both: TRYON_AI_PROVIDER_KEY"
              )}
            </p>
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs mt-2 inline-flex items-center gap-1 text-primary underline"
            >
              replicate.com/account/api-tokens
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/admin/ai-center"
            className="text-sm bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90"
          >
            {t("مركز الذكاء الاصطناعي", "AI Command Center")}
          </Link>
          <Link href="/customer/ai" className="text-sm border px-4 py-2 rounded-xl hover:bg-muted">
            {t("تجربة محادثة AI", "Test AI Chat")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
