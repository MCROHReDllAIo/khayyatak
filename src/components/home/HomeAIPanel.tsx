"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ImageIcon, Loader2, Mic, Sparkles, Wand2 } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { ChatProductCard } from "@/components/ai/ChatProductCard";
import { StyleTwinResults, type StyleTwinMatchCard } from "@/components/ml/StyleTwinResults";
import { generateId, cn } from "@/lib/utils";
import { extractProductSearchIntent, type ProductSearchIntent } from "@/lib/ai/product-intent";
import type { MatchedProduct } from "@/lib/db/products";
import type { ConciergeShoppingContext } from "@/lib/ai/concierge-types";
import type { Tailor } from "@/types";

const PROMPTS = [
  { ar: "أبغى دشداشة بيضاء رسمية", en: "I want a formal white dishdasha" },
  { ar: "أبحث عن قماش صيفي", en: "Looking for summer fabric" },
  { ar: "أبغى عباية سوداء مفتوحة", en: "I want an open black abaya" },
  { ar: "عندي صورة وأبغى شيء مشابه", en: "I have a photo — find something similar" },
];

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: MatchedProduct[];
  styleTwin?: StyleTwinMatchCard[];
  styleTwinMeta?: { blocked?: boolean; empty?: boolean; error?: string | null };
};

interface HomeAIPanelProps {
  selectedStore: Tailor | null;
  onIntentChange: (intent: ProductSearchIntent | null, highlightTailorIds: string[]) => void;
  onClearStore?: () => void;
  /** Close floating sheet before navigating away */
  onRequestClose?: () => void;
  /** Inside floating sheet — tighter chrome */
  embedded?: boolean;
}

export function HomeAIPanel({
  selectedStore,
  onIntentChange,
  onClearStore,
  onRequestClose,
  embedded,
}: HomeAIPanelProps) {
  const { t, locale } = useLocale();
  const { isAuthenticated, authLoading } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [styleTwinLoading, setStyleTwinLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [controlHint, setControlHint] = useState<string | null>(null);
  const [context, setContext] = useState<ConciergeShoppingContext>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, styleTwinLoading]);

  const redirectLogin = useCallback(
    (nextPath?: string) => {
      const next = nextPath || "/customer/ai";
      router.push(`/login?redirect=${encodeURIComponent(next)}&signup=1`);
    },
    [router]
  );

  const requireAuth = useCallback(
    (nextPath?: string) => {
      if (!authLoading && !isAuthenticated) {
        redirectLogin(nextPath);
        return false;
      }
      return true;
    },
    [authLoading, isAuthenticated, redirectLogin]
  );

  const pushSystemNote = useCallback(
    (content: string) => {
      setControlHint(content);
      window.setTimeout(() => setControlHint(null), 4000);
    },
    []
  );

  const runStyleTwin = useCallback(
    async (imageDataUrl: string | undefined, queryText: string): Promise<{
      matches: StyleTwinMatchCard[];
      blocked?: boolean;
      empty?: boolean;
      error?: string | null;
      tailorIds: string[];
    }> => {
      setStyleTwinLoading(true);
      try {
        const res = await fetch("/api/ml/style-twin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrl,
            text: queryText || undefined,
            limit: 6,
          }),
        });
        const data = await res.json();
        if (data.blocked) {
          return {
            matches: [],
            blocked: true,
            error: data.errorAr || data.error || null,
            tailorIds: [],
          };
        }
        const matches = (data.matches ?? []) as StyleTwinMatchCard[];
        return {
          matches,
          empty: matches.length === 0,
          error: data.ok === false ? data.errorAr || data.error || null : null,
          tailorIds: matches.map((m) => m.tailor_id).filter(Boolean),
        };
      } catch {
        return {
          matches: [],
          error: t("تعذر تشغيل توأم الأسلوب", "Style Twin failed"),
          tailorIds: [],
        };
      } finally {
        setStyleTwinLoading(false);
      }
    },
    [t]
  );

  const send = useCallback(
    async (raw: string, imageDataUrl?: string) => {
      const message = raw.trim();
      if (!message && !imageDataUrl) return;

      if (!authLoading && !isAuthenticated) {
        redirectLogin(
          message
            ? `/customer/ai?q=${encodeURIComponent(message)}`
            : "/customer/ai"
        );
        return;
      }

      const intent = extractProductSearchIntent(
        message || "بحث من صورة",
        context.lastIntent ?? null
      );
      onIntentChange(intent, []);

      const userMsg: ChatMsg = {
        id: generateId(),
        role: "user",
        content: message || t("صورة للإلهام", "Inspiration photo"),
      };
      setMessages((m) => [...m, userMsg]);
      setText("");
      setLoading(true);
      const useTwin = Boolean(imageDataUrl) || /مشابه|شبيه|صورة|similar|twin|توأم/i.test(message);
      if (useTwin) setStyleTwinLoading(true);

      try {
        const storeHint = selectedStore
          ? `\n[سياق المتجر: ${selectedStore.name_ar} / ${selectedStore.city}]`
          : "";

        // Text-only Style Twin path (embeddings) when user asks for similar style without photo
        const twinOnly =
          useTwin && !imageDataUrl
            ? await runStyleTwin(undefined, message)
            : null;

        const data = imageDataUrl || !twinOnly
          ? await fetch("/api/concierge/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: `${message || "أبغى شيء مشابه لهذه الصورة"}${storeHint}`,
                imageDataUrl,
                context: {
                  ...context,
                  lastIntent: intent,
                },
              }),
            }).then((res) => res.json())
          : null;

        const twinFromApi = data?.styleTwin;
        const twinMatches: StyleTwinMatchCard[] =
          twinOnly?.matches?.length
            ? twinOnly.matches
            : ((twinFromApi?.matches ?? []) as StyleTwinMatchCard[]);
        const twinBlocked = twinOnly?.blocked || twinFromApi?.blocked;
        const twinError =
          twinOnly?.error || twinFromApi?.errorAr || twinFromApi?.error || null;

        const productList: MatchedProduct[] = data?.products ?? data?.matches ?? [];
        const reply =
          twinMatches.length > 0
            ? t(
                `وجد توأم أسلوبك ${twinMatches.length} خيارات من المتاجر الحقيقية.`,
                `Style Twin found ${twinMatches.length} real-store matches.`
              )
            : data?.reply ??
              data?.message ??
              (productList.length
                ? t(`لقيت لك ${productList.length} خيارات مناسبة.`, `Found ${productList.length} matching options.`)
                : t("لم نجد منتجات مطابقة.", "No matching products found."));

        setMessages((m) => [
          ...m,
          {
            id: generateId(),
            role: "assistant",
            content: reply,
            products: twinMatches.length ? undefined : productList,
            styleTwin: twinMatches.length ? twinMatches : undefined,
            styleTwinMeta: useTwin
              ? {
                  blocked: Boolean(twinBlocked),
                  empty: Boolean(!twinBlocked && twinMatches.length === 0),
                  error: twinError,
                }
              : undefined,
          },
        ]);

        if (data?.context) setContext(data.context);
        const nextIntent = (data?.context?.lastIntent as ProductSearchIntent | undefined) ?? intent;
        const tailorIds = [
          ...twinMatches.map((x) => x.tailor_id),
          ...productList.map((p) => p.tailor_id).filter(Boolean),
        ];
        onIntentChange(nextIntent, [...new Set(tailorIds)]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: generateId(),
            role: "assistant",
            content: t("تعذر الاتصال الآن. حاول مرة أخرى.", "Could not connect. Please try again."),
          },
        ]);
      } finally {
        setLoading(false);
        setStyleTwinLoading(false);
      }
    },
    [
      authLoading,
      isAuthenticated,
      redirectLogin,
      context,
      selectedStore,
      onIntentChange,
      t,
      runStyleTwin,
    ]
  );

  const stopVoice = useCallback(() => {
    try {
      recognitionRef.current?.stop();
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startVoice = useCallback(() => {
    if (!requireAuth("/customer/ai")) return;

    if (listening) {
      stopVoice();
      return;
    }

    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    type SpeechRecognitionLike = {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: ((e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
      onerror: ((e: { error?: string }) => void) | null;
      onend: (() => void) | null;
    };

    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      pushSystemNote(
        t(
          "المتصفح لا يدعم الصوت هنا — اكتب طلبك أو جرّب Chrome.",
          "Voice isn’t supported in this browser — type your request or try Chrome."
        )
      );
      return;
    }

    try {
      stopVoice();
      const rec = new SR();
      rec.lang = locale === "ar" ? "ar-SA" : "en-US";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e) => {
        const transcript = e.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) {
          setText(transcript);
          void send(transcript);
        }
      };
      rec.onerror = (e) => {
        setListening(false);
        if (e.error === "not-allowed") {
          pushSystemNote(t("اسمح بالميكروفون من إعدادات المتصفح.", "Allow the microphone in browser settings."));
        } else if (e.error !== "aborted") {
          pushSystemNote(t("تعذر التعرف على الصوت. حاول مرة أخرى.", "Couldn’t hear that. Try again."));
        }
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      pushSystemNote(t("استمع الآن… تكلم بوضوح", "Listening… speak clearly"));
    } catch {
      setListening(false);
      pushSystemNote(t("تعذر تشغيل الميكروفون.", "Couldn’t start the microphone."));
    }
  }, [requireAuth, listening, stopVoice, locale, pushSystemNote, t, send]);

  const onFile = useCallback(
    (file: File) => {
      if (!requireAuth("/customer/ai")) return;
      if (!file.type.startsWith("image/")) {
        pushSystemNote(t("اختر صورة فقط.", "Please choose an image file."));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        pushSystemNote(t("الصورة كبيرة جدًا (حد أقصى 8MB).", "Image is too large (max 8MB)."));
        return;
      }
      setUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploading(false);
        void send(text.trim() || t("أبغى شيء مشابه لهذه الصورة", "Find something similar to this photo"), dataUrl);
      };
      reader.onerror = () => {
        setUploading(false);
        pushSystemNote(t("تعذر قراءة الصورة.", "Couldn’t read the image."));
      };
      reader.readAsDataURL(file);
    },
    [requireAuth, pushSystemNote, t, send, text]
  );

  const openInnovate = useCallback(() => {
    const idea = text.trim();
    const path = idea
      ? `/customer/innovation?idea=${encodeURIComponent(idea.slice(0, 280))}`
      : "/customer/innovation";

    if (!requireAuth(path)) return;

    onRequestClose?.();
    // Let the sheet start closing, then navigate
    window.setTimeout(() => router.push(path), 120);
  }, [text, requireAuth, onRequestClose, router]);

  useEffect(() => {
    return () => stopVoice();
  }, [stopVoice]);

  const empty = messages.length === 0;
  const busy = loading || styleTwinLoading || uploading;

  return (
    <section className="flex h-full min-h-0 flex-col" data-tour="home-ai-panel">
      {!embedded && (
        <header className="shrink-0 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {t("مستشارك الذكي", "Your AI stylist")}
          </p>
          <h2 className="mt-1 text-2xl md:text-3xl font-bold text-white tracking-tight">
            {t("الذكاء", "Intelligence")}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            {t("قل لي ماذا تريد، وأنا أبحث لك.", "Tell me what you want — I'll find it.")}
          </p>
          {selectedStore && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
              <span>
                {t("تستكشف الآن:", "Exploring:")}{" "}
                <strong className="text-omani-gold">{selectedStore.name_ar}</strong>
              </span>
              <button type="button" onClick={onClearStore} className="text-white/50 hover:text-white">
                {t("إلغاء", "Clear")}
              </button>
            </div>
          )}
        </header>
      )}

      {embedded && selectedStore && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 shrink-0">
          <span>
            {t("تستكشف:", "Exploring:")}{" "}
            <strong className="text-omani-gold">{selectedStore.name_ar}</strong>
          </span>
          <button type="button" onClick={onClearStore} className="text-white/50 hover:text-white">
            {t("إلغاء", "Clear")}
          </button>
        </div>
      )}

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto space-y-3 pe-1 pb-3">
        {empty && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-white/40">{t("جرّب مثلاً:", "Try for example:")}</p>
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p.ar}
                  type="button"
                  onClick={() => send(locale === "ar" ? p.ar : p.en)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {locale === "ar" ? p.ar : p.en}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-omani-gold/70">
              {t(
                "أو ارفع صورة — توأم الأسلوب يطابقها مع متاجر حقيقية.",
                "Or upload a photo — Style Twin matches it to real stores."
              )}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "user" ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-white text-navy"
                    : "bg-white/10 text-white border border-white/10"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.styleTwinMeta && (msg.styleTwin || msg.styleTwinMeta.blocked || msg.styleTwinMeta.empty) && (
                  <div className="mt-3">
                    <StyleTwinResults
                      matches={msg.styleTwin ?? []}
                      blocked={msg.styleTwinMeta.blocked}
                      empty={msg.styleTwinMeta.empty}
                      error={msg.styleTwinMeta.error}
                      onHighlightStores={(ids) => onIntentChange(context.lastIntent ?? null, ids)}
                    />
                  </div>
                )}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {msg.products.map((p) => (
                      <ChatProductCard key={p.id} product={p} compact />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(loading || styleTwinLoading) && (
          <div className="space-y-2">
            {styleTwinLoading && (
              <StyleTwinResults matches={[]} loading />
            )}
            {loading && !styleTwinLoading && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("جاري البحث في المتاجر الحقيقية...", "Searching real stores...")}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 pt-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <div className="rounded-2xl border border-white/15 bg-white/95 p-2 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.5)]" data-tour="home-ai-input">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!busy) void send(text);
              }
            }}
            rows={2}
            placeholder={t("ماذا تريد أن تخيط؟", "What do you want tailored?")}
            className="w-full resize-none bg-transparent px-3 pt-2 text-base text-navy outline-none placeholder:text-muted-foreground/70 font-arabic"
            disabled={busy}
          />
          <div
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1 pb-1 pt-2 border-t border-border/40"
            data-tour="home-ai-controls"
          >
            <div className="flex flex-wrap items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={startVoice}
                disabled={busy && !listening}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors shrink-0",
                  listening
                    ? "bg-red-500/15 text-red-600 ring-1 ring-red-500/30"
                    : "text-muted-foreground hover:bg-muted"
                )}
                aria-pressed={listening}
              >
                <Mic className={cn("h-3.5 w-3.5", listening && "animate-pulse")} />
                {listening ? t("إيقاف", "Stop") : t("صوت", "Voice")}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted shrink-0 disabled:opacity-40"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                {t("صورة", "Photo")}
              </button>
              <button
                type="button"
                onClick={openInnovate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-omani-gold hover:bg-omani-gold/10 font-medium shrink-0 disabled:opacity-40"
                data-tour="home-innovate"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {t("ابتكار", "Innovate")}
              </button>
            </div>
            <button
              type="button"
              disabled={busy || (!text.trim() && !listening)}
              onClick={() => void send(text)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-navy-light shrink-0"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {t("ابحث", "Search")}
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
        {controlHint && (
          <p className="mt-2 text-center text-[11px] text-omani-gold/90">{controlHint}</p>
        )}
        {!isAuthenticated && !authLoading && (
          <p className="mt-2 text-center text-[11px] text-white/40">
            {t("سجّل دخولك لبدء البحث بالذكاء الاصطناعي", "Sign in to start AI search")}
          </p>
        )}
      </div>
    </section>
  );
}
