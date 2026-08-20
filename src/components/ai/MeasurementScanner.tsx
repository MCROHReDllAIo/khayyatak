"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { runMeasurementScan, type MeasurementScanStep } from "@/lib/ai/measurement";
import type { Measurements } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MeasurementResult } from "./MeasurementResult";

interface MeasurementScannerProps {
  onComplete: (measurements: Measurements) => void;
}

const DEFAULT_MANUAL: Measurements = {
  height: 173,
  chest: 98,
  waist: 86,
  shoulder: 44,
  sleeve: 59,
  dishdasha_length: 140,
  confidence: 85,
  is_ai_estimate: true,
};

export function MeasurementScanner({ onComplete }: MeasurementScannerProps) {
  const { t } = useLocale();
  const [step, setStep] = useState<"intro" | "camera" | "scanning" | "result" | "error" | "manual">("intro");
  const [scanMessage, setScanMessage] = useState("");
  const [result, setResult] = useState<Measurements | null>(null);
  const [manual, setManual] = useState<Measurements>(DEFAULT_MANUAL);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep("camera");
    } catch {
      setStep("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  const startScan = async () => {
    setStep("scanning");
    const measurements = await runMeasurementScan((s: MeasurementScanStep) => setScanMessage(s.label_ar));
    stopCamera();
    setResult(measurements);
    setStep("result");
  };

  const handleSave = (m: Measurements) => onComplete({ ...m, is_ai_estimate: m.is_ai_estimate ?? true });

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
            <Button size="lg" onClick={startCamera} className="gap-2"><Camera className="h-5 w-5" />{t("بدء القياس", "Start")}</Button>
            <Button variant="outline" onClick={() => setStep("manual")}>{t("إدخال يدوي", "Manual entry")}</Button>
          </motion.div>
        )}

        {(step === "camera" || step === "scanning") && (
          <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="relative rounded-2xl overflow-hidden bg-navy aspect-[3/4] max-w-sm mx-auto">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {step === "scanning" && (
                <div className="absolute bottom-4 inset-x-4 rounded-xl bg-black/70 px-4 py-3 text-center text-white text-sm">{scanMessage}</div>
              )}
            </div>
            {step === "camera" && <Button size="lg" className="w-full mt-4" onClick={startScan}>{t("التقاط وتحليل", "Capture")}</Button>}
          </motion.div>
        )}

        {step === "result" && result && (
          <MeasurementResult measurements={result} onSave={() => handleSave(result)} editable onChange={setResult} />
        )}

        {step === "manual" && (
          <div className="space-y-3">
            {(["height", "chest", "waist", "shoulder", "sleeve", "dishdasha_length"] as const).map((key) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground">{key}</label>
                <Input type="number" value={manual[key]} onChange={(e) => setManual({ ...manual, [key]: Number(e.target.value) })} />
              </div>
            ))}
            <Button className="w-full" onClick={() => { setResult({ ...manual, confidence: 100, is_ai_estimate: false }); setStep("result"); }}>
              {t("حفظ", "Save")}
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="text-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">{t("تعذر الوصول للكاميرا — أدخل يدويًا أو استخدم Demo", "Camera denied — manual or demo")}</p>
            <Button variant="outline" onClick={() => setStep("manual")}>{t("إدخال يدوي", "Manual")}</Button>
            <Button variant="outline" onClick={() => { setResult(DEFAULT_MANUAL); setStep("result"); }}>{t("Demo AI", "Demo AI")}</Button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
