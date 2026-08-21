"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  AlertCircle,
  Ruler,
  Aperture,
  Undo2,
  Keyboard,
  Loader2,
  Check,
} from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import type { Measurements } from "@/types";
import type { BodySex } from "@/lib/ai/measurement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MeasurementResult } from "./MeasurementResult";
import { cn } from "@/lib/utils";

interface MeasurementScannerProps {
  onComplete: (measurements: Measurements) => void | Promise<void>;
}

const EMPTY_MANUAL: Measurements = {
  height: 173,
  chest: 98,
  waist: 86,
  shoulder: 44,
  sleeve: 59,
  dishdasha_length: 140,
  confidence: 100,
  is_ai_estimate: false,
};

type Step = "calibrate" | "camera" | "scanning" | "result" | "error" | "manual";

export function MeasurementScanner({ onComplete }: MeasurementScannerProps) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>("calibrate");
  const [heightCm, setHeightCm] = useState("173");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<BodySex>("unspecified");
  const [scanMessage, setScanMessage] = useState("");
  const [result, setResult] = useState<Measurements | null>(null);
  const [methodLabel, setMethodLabel] = useState<string | undefined>();
  const [manual, setManual] = useState<Measurements>(EMPTY_MANUAL);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const parsedHeight = Number(heightCm);
  const heightOk = Number.isFinite(parsedHeight) && parsedHeight >= 140 && parsedHeight <= 210;

  const startCamera = useCallback(async () => {
    if (!heightOk) {
      setErrorMsg(t("أدخل طولك الحقيقي بالسنتيمتر أولاً.", "Enter your real height in cm first."));
      return;
    }
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      setStep("camera");
      // Attach after step paints video element
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setStep("error");
    }
  }, [heightOk, t]);

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth < 16) return null;
    const canvas = document.createElement("canvas");
    const maxW = 960;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const startScan = async () => {
    if (!heightOk) return;
    setStep("scanning");
    setScanMessage(t("معايرة بالطول الحقيقي...", "Calibrating to your height..."));

    const imageDataUrl = captureFrame() ?? undefined;
    const weight = weightKg.trim() ? Number(weightKg) : undefined;

    try {
      setScanMessage(t("قراءة نسب الجسم...", "Reading body proportions..."));
      const res = await fetch("/api/customer/measurements/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm: parsedHeight,
          weightKg: Number.isFinite(weight) ? weight : undefined,
          sex,
          imageDataUrl,
        }),
      });
      const data = await res.json();
      stopCamera();

      if (!res.ok || !data.measurements) {
        setErrorMsg(data.errorAr || data.error || t("تعذر التقدير", "Estimate failed"));
        setStep("calibrate");
        return;
      }

      setResult(data.measurements as Measurements);
      setMethodLabel(
        data.usedVision
          ? t("معايرة بالطول + تحليل صورة", "Height-calibrated + photo analysis")
          : t("معايرة بالطول الحقيقي", "Height-calibrated estimate")
      );
      setScanMessage(t("جاهز للمراجعة", "Ready for review"));
      setStep("result");
    } catch {
      stopCamera();
      setErrorMsg(t("تعذر الاتصال بخدمة القياس.", "Could not reach measurement service."));
      setStep("calibrate");
    }
  };

  const handleSave = async (m: Measurements) => {
    setSaving(true);
    try {
      await onComplete({ ...m, is_ai_estimate: m.is_ai_estimate ?? true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === "calibrate" && (
          <motion.div
            key="calibrate"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-[#1a3558] bg-[#0a1f3a] p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="h-5 w-5 text-omani-gold" />
                <p className="font-semibold">{t("معايرة القياس", "Measurement calibration")}</p>
              </div>
              <p className="text-sm text-[#9aa6b5] leading-relaxed mb-4">
                {t(
                  "أدخل طولك الحقيقي بالسنتيمتر — هذا مرجع الدقة. بدون طول معروف لا يمكن قياس صحيح من كاميرا الويب وحدها.",
                  "Enter your real height in cm — this is the accuracy anchor. A webcam alone cannot measure absolute size without scale."
                )}
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs text-omani-gold">{t("الطول (سم) *", "Height (cm) *")}</span>
                  <Input
                    type="number"
                    min={140}
                    max={210}
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="h-12 border-[#1a3558] bg-[#071A33] text-xl font-bold text-white"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs text-[#9aa6b5]">{t("الوزن (كغ) اختياري", "Weight (kg) optional")}</span>
                  <Input
                    type="number"
                    min={30}
                    max={250}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="—"
                    className="h-12 border-[#1a3558] bg-[#071A33] text-xl font-bold text-white"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    { id: "male" as const, ar: "رجل", en: "Male" },
                    { id: "female" as const, ar: "امرأة", en: "Female" },
                    { id: "unspecified" as const, ar: "غير محدد", en: "Unspecified" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSex(opt.id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
                      sex === opt.id
                        ? "bg-omani-gold text-navy border-omani-gold"
                        : "border-[#1a3558] text-[#9aa6b5] hover:border-omani-gold/40"
                    )}
                  >
                    {t(opt.ar, opt.en)}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                disabled={!heightOk}
                onClick={() => void startCamera()}
                className="flex-1 gap-2 h-12 bg-navy hover:bg-navy-light"
              >
                <Camera className="h-5 w-5" />
                {t("بدء القياس بالكاميرا", "Start camera measure")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setManual({ ...EMPTY_MANUAL, height: heightOk ? parsedHeight : 173 });
                  setStep("manual");
                }}
                className="flex-1 gap-2 h-12 border-navy/20"
              >
                <Keyboard className="h-4 w-4" />
                {t("إدخال يدوي", "Manual entry")}
              </Button>
            </div>
          </motion.div>
        )}

        {(step === "camera" || step === "scanning") && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative mx-auto max-w-md"
          >
            {/* Apple Measure–inspired immersive viewport */}
            <div className="relative overflow-hidden rounded-[1.75rem] bg-black aspect-[3/4] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/40">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
                playsInline
                muted
                autoPlay
              />

              {/* Guide silhouette */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[72%] w-[42%] rounded-[45%] border border-dashed border-white/35" />
              </div>

              {/* Top floating controls */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setStep("calibrate");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  {t("رجوع", "Back")}
                </button>
                <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-omani-gold backdrop-blur-sm">
                  {parsedHeight} cm
                </span>
              </div>

              {/* Floating measure chips (preview style) */}
              <div className="pointer-events-none absolute start-3 top-1/3 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy shadow">
                {t("كتف", "Shoulder")}
              </div>
              <div className="pointer-events-none absolute end-3 top-[45%] rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy shadow">
                {t("صدر", "Chest")}
              </div>
              <div className="pointer-events-none absolute start-1/2 -translate-x-1/2 bottom-[28%] rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy shadow">
                {t("خصر", "Waist")}
              </div>

              {step === "scanning" && (
                <div className="absolute inset-x-4 bottom-24 rounded-2xl bg-black/70 px-4 py-3 text-center text-sm text-white backdrop-blur-sm">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-omani-gold" />
                  {scanMessage}
                </div>
              )}

              {/* Shutter */}
              {step === "camera" && (
                <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2">
                  <p className="text-[11px] text-white/80 bg-black/40 rounded-full px-3 py-1">
                    {t("قف بشكل مستقيم داخل الإطار", "Stand straight inside the frame")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void startScan()}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/30 active:scale-95 transition-transform"
                    aria-label={t("التقاط", "Capture")}
                  >
                    <Aperture className="h-7 w-7 text-navy" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3 flex items-center gap-2 text-sm text-primary">
              <Check className="h-4 w-4" />
              {t("راجع الأرقام ثم احفظ", "Review the numbers, then save")}
            </div>
            <MeasurementResult
              measurements={result}
              editable
              onChange={setResult}
              onSave={() => void handleSave(result)}
              saving={saving}
              methodLabel={methodLabel}
            />
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => {
                setResult(null);
                setStep("calibrate");
              }}
            >
              {t("إعادة القياس", "Measure again")}
            </Button>
          </motion.div>
        )}

        {step === "manual" && (
          <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("أدخل المقاسات بالسنتيمتر كما قاسها الخياط أو الشريط.", "Enter cm values from a tailor or tape measure.")}
            </p>
            {(
              [
                ["height", "الطول", "Height"],
                ["chest", "الصدر", "Chest"],
                ["waist", "الخصر", "Waist"],
                ["shoulder", "الكتف", "Shoulder"],
                ["sleeve", "الكم", "Sleeve"],
                ["dishdasha_length", "طول الثوب", "Garment length"],
              ] as const
            ).map(([key, ar, en]) => (
              <label key={key} className="block space-y-1">
                <span className="text-xs text-muted-foreground">{t(ar, en)}</span>
                <Input
                  type="number"
                  value={manual[key]}
                  onChange={(e) => setManual({ ...manual, [key]: Number(e.target.value) })}
                />
              </label>
            ))}
            <Button
              className="w-full"
              onClick={() => {
                setResult({ ...manual, confidence: 100, is_ai_estimate: false });
                setMethodLabel(t("إدخال يدوي دقيق", "Manual precise entry"));
                setStep("result");
              }}
            >
              {t("متابعة للمراجعة", "Continue to review")}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("calibrate")}>
              {t("رجوع", "Back")}
            </Button>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div key="error" className="text-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">
              {t("تعذر الوصول للكاميرا — يمكنك الإدخال اليدوي.", "Camera denied — you can enter manually.")}
            </p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button
                onClick={() => {
                  setManual({ ...EMPTY_MANUAL, height: heightOk ? parsedHeight : 173 });
                  setStep("manual");
                }}
              >
                {t("إدخال يدوي", "Manual entry")}
              </Button>
              <Button variant="outline" onClick={() => setStep("calibrate")}>
                {t("رجوع", "Back")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
