"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Sparkles, ArrowLeft, X, Loader2, Lock } from "lucide-react";
import { VoiceInput } from "@/components/ai/VoiceInput";
import { LiveCaptureButton } from "@/components/ai/LiveCameraCapture";
import { analyzeGarmentImage } from "@/lib/ai/image-understanding";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

const INSPIRATION_KEY = "st_inspiration_image";

interface ConciergeInputProps {
  variant?: "hero" | "inline";
  className?: string;
  /** When true, redirects unauthenticated users to login before any interaction */
  requireAuth?: boolean;
  onSubmit?: (text: string, imageUrl?: string) => void;
  onImageAnalyzed?: (summary: string, dataUrl: string) => void;
}

function buildImageSummary(analysis: Awaited<ReturnType<typeof analyzeGarmentImage>>) {
  return `من الصورة: ${analysis.garmentType} · ${analysis.colors.join(" و")} · ${analysis.fabric} · ${analysis.style} · ${analysis.embroidery}`;
}

export function ConciergeInput({
  variant = "inline",
  className,
  requireAuth = false,
  onSubmit,
  onImageAnalyzed,
}: ConciergeInputProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAuth();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageLabel, setImageLabel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const gated = requireAuth && !authLoading && !isAuthenticated;

  const redirectToLogin = useCallback(
    (intent?: string) => {
      const next = intent
        ? `/customer/ai?q=${encodeURIComponent(intent)}`
        : "/customer/ai";
      router.push(`/login?redirect=${encodeURIComponent(next)}&signup=1`);
    },
    [router]
  );

  const guard = useCallback(
    (intent?: string) => {
      if (gated) {
        redirectToLogin(intent);
        return true;
      }
      return false;
    },
    [gated, redirectToLogin]
  );

  const submit = (value?: string) => {
    const msg = (value ?? text).trim();
    if (guard(msg || undefined)) return;
    if (!msg) return;
    if (onSubmit) {
      onSubmit(msg);
      return;
    }
    router.push(`/customer/ai?q=${encodeURIComponent(msg)}`);
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (guard(transcript)) return;
    setText(transcript);
    submit(transcript);
  };

  const processImageData = async (file: File, dataUrl: string) => {
    if (guard()) return;
    setImagePreview(dataUrl);
    setAnalyzing(true);
    setImageLabel(null);

    try {
      sessionStorage.setItem(INSPIRATION_KEY, dataUrl);
    } catch {
      /* ignore quota */
    }

    const hint = text.trim() || file.name;
    const analysis = await analyzeGarmentImage(dataUrl, hint);
    const summary = buildImageSummary(analysis);
    setImageLabel(summary);
    setText(summary);
    setAnalyzing(false);

    if (onImageAnalyzed) {
      onImageAnalyzed(summary, dataUrl);
    }
    if (onSubmit) {
      onSubmit(summary, dataUrl);
    } else {
      router.push(`/customer/ai?q=${encodeURIComponent(summary)}`);
    }
  };

  const handleImageFile = async (file: File) => {
    if (guard()) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await processImageData(file, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleLiveCapture = async (file: File, dataUrl: string) => {
    if (guard()) return;
    await processImageData(file, dataUrl);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageLabel(null);
    setAnalyzing(false);
    try {
      sessionStorage.removeItem(INSPIRATION_KEY);
    } catch {
      /* ignore */
    }
  };

  const openImagePicker = () => {
    if (guard()) return;
    fileRef.current?.click();
  };

  const isHero = variant === "hero";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />

      <div
        className={cn(
          "relative rounded-2xl border transition-all duration-300",
          isHero
            ? "bg-white/95 shadow-[0_24px_80px_-20px_rgba(7,26,51,0.35)] border-white/20 p-2"
            : "bg-white border-border/60 p-1.5",
          focused && !gated && "border-primary/40 ring-4 ring-primary/5",
          listening && !gated && "border-primary/50 ring-4 ring-primary/10",
          gated && "ring-2 ring-omani-gold/30"
        )}
      >
        {gated && (
          <button
            type="button"
            onClick={() => redirectToLogin()}
            className="absolute inset-0 z-10 rounded-2xl cursor-pointer"
            aria-label={t("سجّل دخولك للبدء", "Sign in to start")}
          />
        )}
        <div className="flex items-start gap-3 p-3 md:p-4">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            {gated ? (
              <Lock className="h-4 w-4 text-omani-gold" />
            ) : analyzing ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <textarea
              value={text}
              onChange={(e) => {
                if (!gated) setText(e.target.value);
              }}
              onFocus={() => {
                if (guard()) return;
                setFocused(true);
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (gated) {
                  e.preventDefault();
                  guard();
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              readOnly={gated}
              tabIndex={gated ? -1 : 0}
              rows={isHero ? 2 : 1}
              placeholder={
                gated
                  ? t("سجّل دخولك لتصفّح ثوب أحلامك بالذكاء الاصطناعي...", "Sign in to describe your dream garment with AI...")
                  : t("صف لي الثوب الذي تتخيله...", "Describe the garment you imagine...")
              }
              className={cn(
                "w-full resize-none bg-transparent outline-none font-arabic leading-relaxed placeholder:text-muted-foreground/70",
                isHero ? "text-lg md:text-xl min-h-[56px]" : "text-base min-h-[40px]"
              )}
            />
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="" className="h-14 w-14 rounded-lg object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary">
                      {analyzing ? t("جاري تحليل الصورة...", "Analyzing image...") : t("تم تحليل الصورة", "Image analyzed")}
                    </p>
                    {imageLabel && <p className="text-xs text-muted-foreground truncate">{imageLabel}</p>}
                  </div>
                  <button type="button" onClick={clearImage} className="p-1.5 rounded-lg hover:bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {listening && (
              <p className="text-xs text-primary animate-pulse">{t("جاري الاستماع...", "Listening...")}</p>
            )}
          </div>
        </div>

        <div className={cn("flex items-center justify-between gap-2 border-t border-border/40 px-3 py-2 md:px-4", gated && "pointer-events-none opacity-80")}>
          <div className="flex items-center gap-1">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onListeningChange={setListening}
              disabled={gated}
              className="border-0 bg-transparent shadow-none hover:bg-muted/50"
            />
            <button
              type="button"
              onClick={openImagePicker}
              disabled={analyzing}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                imagePreview
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <ImageIcon className="h-4 w-4" />
              {analyzing ? t("تحليل...", "Analyzing...") : t("صورة", "Image")}
            </button>
            <LiveCaptureButton
              onCapture={handleLiveCapture}
              disabled={analyzing || gated}
              active={Boolean(imagePreview)}
            />
          </div>
          <button
            type="button"
            onClick={() => (gated ? redirectToLogin() : submit())}
            disabled={!gated && (!text.trim() || analyzing)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
              gated || (text.trim() && !analyzing)
                ? "bg-navy text-white hover:bg-navy-light"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {gated ? t("سجّل دخول", "Sign in") : t("ابدأ", "Start")}
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {isHero && (
        <p className="mt-4 text-center text-sm text-white/50">
          {gated
            ? t("أنشئ حساباً مجاناً — صوت، صورة، أو كتابة", "Create a free account — voice, photo, or text")
            : t("قول الي في بالك ترانا بنفهمك..", "Say what's on your mind — we've got you..")}
        </p>
      )}
    </motion.div>
  );
}

export { INSPIRATION_KEY };
