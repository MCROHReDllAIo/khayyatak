"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, SwitchCamera, Circle } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

interface LiveCameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File, dataUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

export function LiveCameraCapture({
  open,
  onClose,
  onCapture,
  disabled = false,
  className,
}: LiveCameraCaptureProps) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);
    setReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("الكاميرا غير مدعومة في هذا المتصفح", "Camera not supported in this browser"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch {
      setError(
        t(
          "تعذّر الوصول للكاميرا. اسمح بالإذن أو استخدم رفع صورة.",
          "Could not access camera. Allow permission or upload an image."
        )
      );
    }
  }, [facing, stopStream, t]);

  useEffect(() => {
    if (open) startStream();
    else stopStream();
    return () => stopStream();
  }, [open, startStream, stopStream]);

  useEffect(() => {
    if (open) startStream();
  }, [facing, open, startStream]);

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
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
              {!error && (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
                  {error}
                </div>
              )}
              {ready && (
                <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-4 rounded-xl" />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-4 bg-navy border-t border-white/10">
              <button
                type="button"
                onClick={toggleFacing}
                disabled={!!error}
                className="p-3 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40"
                aria-label={t("قلب الكاميرا", "Switch camera")}
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={capture}
                disabled={!ready || !!error}
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
      <LiveCameraCapture
        open={open}
        onClose={() => setOpen(false)}
        onCapture={onCapture}
        disabled={disabled}
      />
    </>
  );
}
