"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Save, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatchedProduct } from "@/lib/db/products";

type TryOnStage = "idle" | "analyzing" | "sizing" | "generating" | "done" | "error" | "blocked";

interface VirtualLookPanelProps {
  product: MatchedProduct;
  sizeLabel?: string;
  onClose: () => void;
  onOrder?: () => void;
}

export function VirtualLookPanel({ product, sizeLabel, onClose, onOrder }: VirtualLookPanelProps) {
  const [stage, setStage] = useState<TryOnStage>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockedInfo, setBlockedInfo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const checkPhoto = async () => {
    const res = await fetch("/api/customer/appearance");
    if (res.ok) {
      const data = await res.json();
      setHasPhoto(Boolean(data.profile?.has_image));
    }
  };

  useEffect(() => {
    checkPhoto();
  }, []);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;
      const res = await fetch("/api/customer/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, mimeType: file.type, source: "upload" }),
      });
      setUploading(false);
      if (res.ok) {
        setHasPhoto(true);
      } else {
        const data = await res.json();
        setError(data.error ?? "فشل رفع الصورة");
      }
    };
    reader.readAsDataURL(file);
  };

  const runTryOn = async () => {
    setError(null);
    setBlockedInfo(null);
    setStage("analyzing");

    await new Promise((r) => setTimeout(r, 400));
    setStage("sizing");
    await new Promise((r) => setTimeout(r, 400));
    setStage("generating");

    const res = await fetch("/api/virtual-tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, sizeLabel }),
    });

    const data = await res.json();

    if (data.status === "BLOCKED_BY_PROVIDER") {
      setStage("blocked");
      setBlockedInfo(data.detail ?? data.message);
      return;
    }

    if (data.status === "MISSING_PROFILE_IMAGE" || res.status === 400) {
      setStage("idle");
      setHasPhoto(false);
      setError(data.message ?? "أضف صورة لك للحصول على نظرة افتراضية.");
      return;
    }

    if (!res.ok || data.status === "error") {
      setStage("error");
      setError(data.error ?? "فشل إنشاء النظرة الافتراضية");
      return;
    }

    setResultUrl(data.result?.image_url ?? null);
    setStage("done");
  };

  const stages: Record<TryOnStage, string> = {
    idle: "",
    analyzing: "تحليل التصميم",
    sizing: "مطابقة المقاس",
    generating: "تجهيز الإطلالة",
    done: "✓",
    error: "",
    blocked: "",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold text-navy">نظرة افتراضية</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!hasPhoto && stage === "idle" && (
            <div className="rounded-xl border-2 border-dashed p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">أضف صورة لك للحصول على نظرة افتراضية.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                }}
              />
              <Button
                className="gap-2"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                إضافة صورتي
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {stage === "blocked" && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm space-y-2">
              <p className="font-medium text-amber-900">النظرة الافتراضية غير مفعلة حاليًا.</p>
              <p className="text-amber-800 text-xs">{blockedInfo}</p>
              <p className="text-xs text-muted-foreground">
                Provider: replicate · Env: TRYON_AI_PROVIDER_KEY · Integration: src/lib/ai/virtual-tryon.ts
              </p>
            </div>
          )}

          {["analyzing", "sizing", "generating"].includes(stage) && (
            <div className="space-y-3 py-4">
              <p className="text-center text-sm font-medium text-navy">نجهز إطلالتك...</p>
              {(["analyzing", "sizing", "generating"] as TryOnStage[]).map((s, i) => {
                const active = stage === s;
                const done =
                  (stage === "sizing" && i === 0) ||
                  (stage === "generating" && i <= 1) ||
                  stage === "done";
                return (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span className={done ? "text-emerald-600" : active ? "text-primary" : "text-muted-foreground"}>
                      {done ? "✓" : active ? "..." : "○"}
                    </span>
                    <span className={active ? "font-medium" : ""}>{stages[s]}</span>
                    {active && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary ms-auto" />}
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {stage === "done" && resultUrl && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h3 className="text-lg font-semibold text-navy">نظرتك الافتراضية</h3>
                <p className="text-xs text-muted-foreground">تصور تقريبي للتصميم على مظهرك.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Virtual look" className="w-full rounded-xl object-cover" />
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  هذه معاينة بصرية تقريبية وليست ضمانًا للمقاس أو الشكل النهائي.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>العباية: {product.name_ar}</span>
                  {product.fabric && <span>القماش: {product.fabric}</span>}
                  {sizeLabel && <span>المقاس: {sizeLabel}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={runTryOn}>
                    <RefreshCw className="h-3.5 w-3.5" /> إعادة الإنشاء
                  </Button>
                  {onOrder && (
                    <Button size="sm" className="gap-1" onClick={onOrder}>
                      <ShoppingBag className="h-3.5 w-3.5" /> اختيار هذا التصميم
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {hasPhoto && stage === "idle" && (
            <Button className="w-full gap-2" onClick={runTryOn}>
              <SparklesIcon /> ابدأ النظرة الافتراضية
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
