"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, SwitchCamera, Circle, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

interface LiveCameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File, dataUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

type Facing = "environment" | "user";

function isSecureCameraContext() {
  if (typeof window === "undefined") return false;
  return window.isSecureContext;
}

async function requestCameraStream(preferredFacing: Facing): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Camera API unavailable", "NotSupportedError");
  }

  const otherFacing: Facing = preferredFacing === "environment" ? "user" : "environment";

  const constraintSets: MediaStreamConstraints[] = [
    {
      video: {
        facingMode: { ideal: preferredFacing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    { video: { facingMode: preferredFacing }, audio: false },
    { video: { facingMode: otherFacing }, audio: false },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: true, audio: false },
  ];

  let lastError: unknown = new DOMException("No camera found", "NotFoundError");

  for (const constraints of constraintSets) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

function mapCameraError(err: unknown, t: (ar: string, en: string) => string): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return t(
      "تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم اضغط «إعادة المحاولة».",
      "Camera permission denied. Allow access in browser settings, then tap Retry."
    );
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return t(
      "لا توجد كاميرا على هذا الجهاز. استخدم «صورة» لرفع صورة من المعرض.",
      "No camera on this device. Use Image to upload from gallery."
    );
  }
  if (name === "NotSupportedError") {
    return t(
      "الكاميرا غير مدعومة هنا. جرّب Chrome/Safari على https أو localhost.",
      "Camera not supported here. Try Chrome/Safari on https or localhost."
    );
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return t(
      "الكاميرا مستخدمة من تطبيق آخر. أغلقه ثم أعد المحاولة.",
      "Camera is in use by another app. Close it and retry."
    );
  }
  return t(
    "تعذّر تشغيل الكاميرا. اضغط «إعادة المحاولة» أو استخدم رفع صورة.",
    "Could not start camera. Tap Retry or upload an image."
  );
}

export function LiveCameraCapture({
  open,
  onClose,
  onCapture,
}: LiveCameraCaptureProps) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setReady(false);
  }, []);

  const bindStreamToVideo = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;

    video.srcObject = stream;

    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        video.removeEventListener("loadedmetadata", onReady);
        resolve();
      };
      if (video.readyState >= 1) resolve();
      else video.addEventListener("loadedmetadata", onReady, { once: true });
      setTimeout(() => reject(new Error("video timeout")), 8000);
    }).catch(() => undefined);

    try {
      await video.play();
      setReady(video.videoWidth > 0);
      return true;
    } catch {
      setReady(false);
      return false;
    }
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);
    setReady(false);
    setStarting(true);

    if (!isSecureCameraContext()) {
      setError(
        t(
          "الكاميرا تحتاج اتصالًا آمنًا (https أو localhost).",
          "Camera requires a secure context (https or localhost)."
        )
      );
      setStarting(false);
      return;
    }

    try {
      const stream = await requestCameraStream(facing);
      streamRef.current = stream;

      // Video ref may attach on the next frame after the dialog opens.
      let bound = await bindStreamToVideo(stream);
      if (!bound) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        bound = await bindStreamToVideo(stream);
      }
      if (!bound) {
        throw new DOMException("Video element not ready", "AbortError");
      }
    } catch (err) {
      stopStream();
      setError(mapCameraError(err, t));
    } finally {
      setStarting(false);
    }
  }, [bindStreamToVideo, facing, stopStream, t]);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }
    const id = requestAnimationFrame(() => {
      void startStream();
    });
    return () => {
      cancelAnimationFrame(id);
      stopStream();
    };
  }, [open, facing, startStream, stopStream]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `live-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file, dataUrl);
        onClose();
      },
      "image/jpeg",
      0.92
    );
  };

  const toggleFacing = () => {
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("تصوير مباشر", "Live capture")}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-4 top-[8vh] bottom-[8vh] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[101] flex flex-col rounded-2xl overflow-hidden bg-navy shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-sm font-medium text-white">{t("تصوير Live", "Live capture")}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-white/70 hover:bg-white/10"
                aria-label={t("إغلاق", "Close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 bg-black min-h-[240px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "absolute inset-0 h-full w-full object-cover",
                  facing === "user" && "scale-x-[-1]",
                  (!ready || error) && "opacity-0"
                )}
              />
              {(starting || (!ready && !error)) && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                  {t("جاري تشغيل الكاميرا...", "Starting camera...")}
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="text-sm text-white/80 leading-relaxed">{error}</p>
                  <button
                    type="button"
                    onClick={() => void startStream()}
                    disabled={starting}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-4 w-4", starting && "animate-spin")} />
                    {t("إعادة المحاولة", "Retry")}
                  </button>
                </div>
              )}
              {ready && !error && (
                <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-4 rounded-xl" />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-4 bg-navy border-t border-white/10">
              <button
                type="button"
                onClick={toggleFacing}
                disabled={!!error || starting}
                className="p-3 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40"
                aria-label={t("قلب الكاميرا", "Switch camera")}
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={capture}
                disabled={!ready || !!error || starting}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
                aria-label={t("التقاط", "Capture")}
              >
                <Circle className="h-8 w-8 text-white fill-white/90" />
              </button>
              <div className="w-11" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface LiveCaptureButtonProps {
  onCapture: (file: File, dataUrl: string) => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

export function LiveCaptureButton({ onCapture, disabled, active, className }: LiveCaptureButtonProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          className
        )}
      >
        <Camera className="h-4 w-4" />
        <span className="flex items-center gap-1">
          {t("Live", "Live")}
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        </span>
      </button>
      <LiveCameraCapture open={open} onClose={() => setOpen(false)} onCapture={onCapture} />
    </>
  );
}
