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
import type { SystemFeatureCheck, SystemStatusPayload } from "@/lib/admin/system-status";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Sparkles> = {
  database: Database,
  auth: KeyRound,
  ai_chat: Sparkles,
  style_twin: Sparkles,
  virtual_tryon: Shirt,
  innovation_viz: Palette,
};

const STATUS_META: Record<
  SystemFeatureCheck["status"],
  { icon: typeof CheckCircle2; labelAr: string; labelEn: string; tone: string }
> = {
  ready: {
    icon: CheckCircle2,
    labelAr: "جاهز",
    labelEn: "Ready",
    tone: "border-emerald-200/80 bg-emerald-50/50 text-emerald-800",
  },
  needs_config: {
    icon: AlertTriangle,
    labelAr: "يحتاج إعداد",
    labelEn: "Needs setup",
    tone: "border-slate-200 bg-white text-slate-700",
  },
  misconfigured: {
    icon: XCircle,
    labelAr: "مفتاح خاطئ",
    labelEn: "Wrong key",
    tone: "border-amber-200 bg-amber-50/60 text-amber-900",
  },
  offline: {
    icon: XCircle,
    labelAr: "غير متصل",
    labelEn: "Offline",
    tone: "border-red-200 bg-red-50/50 text-red-800",
  },
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
  const allReady = status?.features.every((f) => f.status === "ready");
  const aiBroken = status?.ai.keyIssue === "management_key" || (status?.ai.configured && !status?.ai.connected);

  return (
    <section className="rounded-2xl border border-border/60 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-navy">{t("حالة المنصة", "Platform status")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allReady
              ? t("كل الميزات الأساسية جاهزة", "Core features are ready")
              : t("أكمل الإعداد لتفعيل الميزات الناقصة", "Finish setup for missing features")}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-navy px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {t("تحديث", "Refresh")}
        </button>
      </div>

      <div className="p-5 space-y-5">
        {!status ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {loading ? t("جاري التحميل...", "Loading...") : t("تعذر تحميل الحالة", "Could not load status")}
          </p>
        ) : (
          <>
            {aiBroken && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-950">
                  {t("فعّل محادثة AI الآن", "Enable AI chat now")}
                </p>
                <p className="text-xs text-amber-900/80 mt-1.5 leading-relaxed">
                  {t(
                    "ضع Inference API Key في",
                    "Set an Inference API Key in"
                  )}{" "}
                  <span className="font-mono text-[11px] bg-white/70 px-1.5 py-0.5 rounded">
                    OPENROUTER_API_KEY
                  </span>
                  {isProduction ? " (Railway → Variables)" : " (.env.local)"}
                  {" · "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-0.5"
                  >
                    openrouter.ai/keys
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            )}

            {allReady && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    {t("المنصة متصلة بالكامل", "Platform fully connected")}
                  </p>
                  <p className="text-xs text-emerald-800/80 mt-0.5">
                    OpenRouter · {status.ai.model ?? "ready"}
                  </p>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-2.5">
              {status.features.map((feature) => {
                const meta = STATUS_META[feature.status];
                const Icon = ICONS[feature.id] ?? Sparkles;
                const StatusIcon = meta.icon;
                return (
                  <div
                    key={feature.id}
                    className={cn("rounded-xl border px-3.5 py-3 flex gap-3 items-start", meta.tone)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-white/80 border border-black/5 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{t(feature.name_ar, feature.name_en)}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium shrink-0 opacity-80">
                          <StatusIcon className="h-3 w-3" />
                          {t(meta.labelAr, meta.labelEn)}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 opacity-75 leading-snug">
                        {t(feature.detail_ar ?? "", feature.detail_en ?? "")}
                      </p>
                      {feature.status !== "ready" && feature.setupUrl && (
                        <a
                          href={feature.setupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] mt-1.5 inline-flex items-center gap-1 underline opacity-90"
                        >
                          {t("إعداد", "Setup")}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/admin/ai-center"
            className="text-xs font-medium bg-navy text-white px-3.5 py-2 rounded-lg hover:bg-navy/90 transition-colors"
          >
            {t("مركز الذكاء", "AI Center")}
          </Link>
          <Link
            href="/customer/style-twin"
            className="text-xs font-medium border border-border px-3.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {t("توأم الأسلوب", "Style Twin")}
          </Link>
          <button
            type="button"
            className="text-xs font-medium border border-border px-3.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={async () => {
              const res = await fetch("/api/ml/style-twin/index", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
              const data = await res.json();
              if (res.ok) {
                alert(
                  t(
                    `تمت الفهرسة: ${data.indexed ?? 0} · الإجمالي ${data.indexedCount ?? 0}`,
                    `Indexed: ${data.indexed ?? 0} · total ${data.indexedCount ?? 0}`
                  )
                );
                load();
              } else {
                alert(data.error || t("فشلت الفهرسة", "Index failed"));
              }
            }}
          >
            {t("فهرسة Style Twin", "Reindex Style Twin")}
          </button>
          <Link
            href="/customer/ai"
            className="text-xs font-medium border border-border px-3.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {t("تجربة المحادثة", "Try chat")}
          </Link>
        </div>
      </div>
    </section>
  );
}
