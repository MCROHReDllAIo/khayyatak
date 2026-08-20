"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { generateId } from "@/lib/utils";
import { conciergeRespond } from "@/lib/ai/concierge";
import { AIChat, type ChatMessage } from "@/components/ai/AIChat";
import { ConciergeInput } from "@/components/ai/ConciergeInput";
import { AIStatusBadge, AIStatusBanner } from "@/components/ai/AIStatusBadge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import type { DesignConfig } from "@/types";

function AIConciergeContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q");
  const { setDesign, setPendingIntentDesign, recordStyleEvent } = useAppState();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t(
        "مرحبًا! أنا مساعدك الذكي للأزياء العمانية.\n\nصف ما تريده — دشداشة، عباية، مناسبة، لون، قماش — وسأساعدك.",
        "Hi! I'm your Omani fashion AI assistant."
      ),
      actions: ["أنشئ التصميم", "تحليل صورة", "ابحث عن خياط"],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastIntentDesign, setLastIntentDesign] = useState<DesignConfig | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const applyIntentDesign = useCallback(
    (d: DesignConfig) => {
      setDesign(d);
      setPendingIntentDesign(null);
      recordStyleEvent({
        colorKey: d.colorKey,
        fabricKey: d.fabricKey,
        fitKey: d.fitKey,
        garmentType: d.garmentType,
      });
      router.push("/customer/designer");
    },
    [setDesign, setPendingIntentDesign, recordStyleEvent, router]
  );

  const sendMessage = useCallback(async (text: string, imageUrl?: string) => {
    const userMsg: ChatMessage = { id: generateId(), role: "user", content: text, imageUrl };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    const history = messages.filter((m) => m.role === "user").map((m) => m.content);
    const { reply, suggestedActions, intentDesign } = await conciergeRespond(text, [...history, text]);
    if (intentDesign) {
      setLastIntentDesign(intentDesign);
      setPendingIntentDesign(intentDesign);
    }
    setMessages((m) => [
      ...m,
      { id: generateId(), role: "assistant", content: reply, actions: suggestedActions },
    ]);
    setLoading(false);
  }, [messages, setPendingIntentDesign]);

  const handleAction = useCallback(
    (action: string) => {
      if (action.includes("أنشئ") || action.includes("تصميم")) {
        if (lastIntentDesign) applyIntentDesign(lastIntentDesign);
        else router.push("/customer/designer");
        return;
      }
      if (action.includes("صورة")) {
        router.push("/customer/image-ai");
        return;
      }
      if (action.includes("خياط")) {
        router.push("/customer/tailors");
        return;
      }
      if (action.includes("قماش")) {
        sendMessage("أبغى تغيير القماش");
        return;
      }
      sendMessage(action);
    },
    [lastIntentDesign, applyIntentDesign, router, sendMessage]
  );

  useEffect(() => {
    if (initialQ && !bootstrapped) {
      setBootstrapped(true);
      sendMessage(initialQ);
    }
  }, [initialQ, bootstrapped, sendMessage]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">AI Concierge</p>
          <AIStatusBadge />
        </div>
        <h1 className="editorial-title">{t("مساعد الأزياء الذكي", "AI Fashion Concierge")}</h1>
      </motion.header>

      <AIStatusBanner />

      <ConciergeInput variant="inline" onSubmit={sendMessage} />

      {lastIntentDesign && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="text-primary font-medium">AI Recommendation:</span>{" "}
            {lastIntentDesign.name ?? `${lastIntentDesign.color} · ${lastIntentDesign.fabric}`}
          </p>
          <Button size="sm" onClick={() => applyIntentDesign(lastIntentDesign)}>
            {t("تطبيق على الاستوديو", "Apply to Studio")}
          </Button>
        </div>
      )}

      <AIChat
        messages={messages}
        onSend={sendMessage}
        onAction={handleAction}
        loading={loading}
        placeholder={t("أريد دشداشة بيضاء رسمية صيفية...", "I want a formal white summer dishdasha...")}
      />

      <div className="flex flex-wrap gap-2 pt-4 fashion-divider">
        <Button size="sm" onClick={() => lastIntentDesign && applyIntentDesign(lastIntentDesign)}>
          {t("أنشئ التصميم", "Create Design")}
        </Button>
        <Link href="/customer/image-ai">
          <Button size="sm" variant="outline" className="gap-1"><ImageIcon className="h-3.5 w-3.5" />{t("تحليل صورة", "Image AI")}</Button>
        </Link>
        <Link href="/customer/tailors"><Button size="sm" variant="outline">{t("ابحث عن خياط", "Find Tailor")}</Button></Link>
      </div>
    </div>
  );
}

export default function AIConciergePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">...</div>}>
      <AIConciergeContent />
    </Suspense>
  );
}
