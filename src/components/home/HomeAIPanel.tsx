"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ImageIcon, Loader2, Mic, Sparkles, Wand2 } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { ChatProductCard } from "@/components/ai/ChatProductCard";
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
};

interface HomeAIPanelProps {
  selectedStore: Tailor | null;
  onIntentChange: (intent: ProductSearchIntent | null, highlightTailorIds: string[]) => void;
  onClearStore?: () => void;
}

export function HomeAIPanel({ selectedStore, onIntentChange, onClearStore }: HomeAIPanelProps) {
  const { t, locale } = useLocale();
  const { isAuthenticated, authLoading } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [context, setContext] = useState<ConciergeShoppingContext>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const redirectLogin = useCallback(
    (intent?: string) => {
      const next = intent ? `/customer/ai?q=${encodeURIComponent(intent)}` : "/customer/ai";
      router.push(`/login?redirect=${encodeURIComponent(next)}&signup=1`);
    },
    [router]
  );

  const send = useCallback(
    async (raw: string, imageDataUrl?: string) => {
      const message = raw.trim();
      if (!message && !imageDataUrl) return;

      if (!authLoading && !isAuthenticated) {
        redirectLogin(message || undefined);
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

      try {
        const storeHint = selectedStore
          ? `\n[سياق المتجر: ${selectedStore.name_ar} / ${selectedStore.city}]`
          : "";
        const res = await fetch("/api/concierge/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `${message}${storeHint}`,
            imageDataUrl,
            context: {
              ...context,
              lastIntent: intent,
            },
          }),
        });
        const data = await res.json();
        const products: MatchedProduct[] = data.products ?? data.matches ?? [];
        const reply =
          data.reply ??
          data.message ??
          (products.length
            ? t(`لقيت لك ${products.length} خيارات مناسبة.`, `Found ${products.length} matching options.`)
            : t("لم نجد منتجات مطابقة.", "No matching products found."));

        setMessages((m) => [
          ...m,
          {
            id: generateId(),
            role: "assistant",
            content: reply,
            products,
          },
        ]);

        if (data.context) setContext(data.context);
        const nextIntent = (data.context?.lastIntent as ProductSearchIntent | undefined) ?? intent;
        const tailorIds = products.map((p) => p.tailor_id).filter(Boolean);
        onIntentChange(nextIntent, tailorIds);
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
      }
    },
    [authLoading, isAuthenticated, redirectLogin, context, selectedStore, onIntentChange, t]
  );

  const startVoice = () => {
    if (!isAuthenticated && !authLoading) {
      redirectLogin();
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
      onresult: ((e: { results: Array<{ 0: { transcript: string } }> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setText(PROMPTS[0].ar);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = "ar-SA";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript?.trim();
        if (transcript) send(transcript);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const onFile = (file: File) => {
    if (!isAuthenticated && !authLoading) {
      redirectLogin();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      send(text.trim() || "أبغى شيء مشابه لهذه الصورة", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const empty = messages.length === 0;

  return (
    <section className="flex h-full min-h-0 flex-col">
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

        {loading && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("جاري البحث في المتاجر الحقيقية...", "Searching real stores...")}
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
        <div className="rounded-2xl border border-white/15 bg-white/95 p-2 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.5)]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={2}
            placeholder={t("ماذا تريد أن تخيط؟", "What do you want tailored?")}
            className="w-full resize-none bg-transparent px-3 pt-2 text-base text-navy outline-none placeholder:text-muted-foreground/70 font-arabic"
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startVoice}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  listening ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Mic className="h-3.5 w-3.5" />
                {t("صوت", "Voice")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated && !authLoading) redirectLogin();
                  else fileRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {t("صورة", "Photo")}
              </button>
              <Link
                href={isAuthenticated ? "/customer/innovation" : "/login?redirect=%2Fcustomer%2Finnovation&signup=1"}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-omani-gold hover:bg-omani-gold/10 font-medium"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {t("ابتكار", "Innovate")}
              </Link>
            </div>
            <button
              type="button"
              disabled={loading || (!text.trim() && !listening)}
              onClick={() => send(text)}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-navy-light"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("ابحث", "Search")}
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
        {!isAuthenticated && !authLoading && (
          <p className="mt-2 text-center text-[11px] text-white/40">
            {t("سجّل دخولك لبدء البحث بالذكاء الاصطناعي", "Sign in to start AI search")}
          </p>
        )}
      </div>
    </section>
  );
}
