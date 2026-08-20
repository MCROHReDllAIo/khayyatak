"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { applyNaturalLanguageDesign } from "@/lib/ai/concierge";
import type { NLDesignChange } from "@/lib/ai/concierge";
import type { DesignConfig } from "@/types";
import { useLocale } from "@/lib/context/locale-context";

const QUICK_SUGGESTIONS = [
  { label: "Summer", label_ar: "صيفي", prompt: "خليه صيفي" },
  { label: "Slim", label_ar: "أنحف", prompt: "خلّيه أنحف" },
  { label: "Premium", label_ar: "فاخر", prompt: "أبغى شيء رسمي وفخم" },
  { label: "Minimal", label_ar: "بسيط", prompt: "تطريز بسيط" },
];

interface AICopilotProps {
  design: DesignConfig;
  onDesignChange: (design: DesignConfig, changes: NLDesignChange[]) => void;
  nlChanges: NLDesignChange[];
  nlPrompt: string;
  onPromptChange: (v: string) => void;
  onApply: () => void;
}

export function AICopilot({
  design,
  onDesignChange,
  nlChanges,
  nlPrompt,
  onPromptChange,
  onApply,
}: AICopilotProps) {
  const { t, locale } = useLocale();

  const applySuggestion = (prompt: string) => {
    const { design: updated, changes } = applyNaturalLanguageDesign(prompt, design);
    onDesignChange(updated, changes);
  };

  const copilotMessage =
    nlChanges.length > 0
      ? t(
          "فهمت تعديلاتك — التصميم محدّث.",
          "Got your changes — design updated."
        )
      : t(
          "فهمت أنك تريد تصميمًا يناسب ذوقك. جرّب اقتراحات AI أو اكتب تعديلك.",
          "Tell me how to refine your design — try AI suggestions or type naturally."
        );

  return (
    <div className="flex flex-col h-full min-h-[480px] border-s border-border/40 ps-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">AI Copilot</p>
          <p className="text-sm text-muted-foreground">{t("مساعد التصميم", "Design assistant")}</p>
        </div>
      </div>

      <motion.div
        key={copilotMessage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm leading-relaxed text-navy/90 mb-6 p-4 rounded-xl bg-omani-cream/80 border border-border/30"
      >
        {copilotMessage}
      </motion.div>

      {nlChanges.length > 0 && (
        <div className="mb-6 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI updated</p>
          {nlChanges.map((c, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="text-sm"
            >
              <span className="text-muted-foreground">{c.field_ar}</span>
              <span className="mx-2 text-primary">→</span>
              <span className="font-medium">{c.to}</span>
            </motion.p>
          ))}
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {t("اقتراحات AI", "AI Suggestions")}
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => applySuggestion(s.prompt)}
            className="px-4 py-2 rounded-full border border-border/60 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          >
            {locale === "ar" ? s.label_ar : s.label}
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <textarea
          value={nlPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onApply())}
          placeholder={t('"خلّه أفخم" · "خليه صيفي"', '"Make it premium" · "Summer fabric"')}
          rows={2}
          className="w-full resize-none rounded-xl border border-border/60 bg-white px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/5"
        />
        <button
          type="button"
          onClick={onApply}
          className="mt-2 w-full rounded-xl bg-navy py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors"
        >
          {t("تطبيق", "Apply")}
        </button>
      </div>
    </div>
  );
}
