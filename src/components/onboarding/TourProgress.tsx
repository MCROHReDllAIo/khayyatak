"use client";

import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";
import type { TourStep } from "@/lib/onboarding/types";

export function TourProgress({
  index,
  total,
  className,
}: {
  index: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              i === index ? "bg-omani-gold w-4" : i < index ? "bg-primary/50" : "bg-white/25"
            )}
          />
        ))}
      </div>
      <span className="text-[11px] text-white/50 tabular-nums">
        {index + 1} / {total}
      </span>
    </div>
  );
}

function DemoAiSearch() {
  const { t } = useLocale();
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-2">
      <p className="text-white/90 font-medium">«{t("أبغى دشداشة بيضاء رسمية وصيفية", "I want a formal summer white dishdasha")}»</p>
      <ul className="space-y-1 text-white/55">
        <li>✓ {t("فهم الطلب", "Understand request")}</li>
        <li>✓ {t("البحث في المتاجر", "Search stores")}</li>
        <li>✓ {t("مطابقة الخيارات", "Match options")}</li>
      </ul>
      <p className="text-[10px] text-omani-gold/90">{t("عرض توضيحي — لا يُنشئ منتجات وهمية", "Demo only — no fake products created")}</p>
    </div>
  );
}

function DemoDesign() {
  const { t } = useLocale();
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-2">
      <p className="text-white/80">{t("أنت:", "You:")} «{t("خلي الأكمام أوسع", "Make sleeves wider")}»</p>
      <p className="text-primary">{t("AI:", "AI:")} {t("تم تعديل الأكمام.", "Sleeves updated.")}</p>
      <p className="text-[10px] uppercase tracking-wider text-omani-gold">{t("معاينة تصميم", "Design preview")}</p>
    </div>
  );
}

function DemoOrderFlow() {
  const { t } = useLocale();
  const steps = [
    t("تم إرسال الطلب", "Order sent"),
    t("تمت المراجعة", "Reviewed"),
    t("قيد التنفيذ", "In progress"),
    t("جاهز", "Ready"),
    t("تم التسليم", "Delivered"),
  ];
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
      <ol className="space-y-1.5 text-white/60">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-omani-gold/80" />
            {s}
            {i < steps.length - 1 && <span className="text-white/25">↓</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function DemoSummary() {
  const { t } = useLocale();
  const items = [
    t("اكتشف المتاجر", "Discover stores"),
    t("ابتكر تصميمك", "Invent your design"),
    t("تحدث مع الذكاء", "Talk to AI"),
    t("احفظ مقاساتك", "Save measurements"),
    t("أرسله للخياط", "Send to tailor"),
    t("تابع طلبك", "Track your order"),
  ];
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-[11px] text-white/80">
          {item}
        </div>
      ))}
    </div>
  );
}

export function TourDemo({ demo }: { demo?: TourStep["demo"] }) {
  if (demo === "ai-search") return <DemoAiSearch />;
  if (demo === "design-collab") return <DemoDesign />;
  if (demo === "order-flow") return <DemoOrderFlow />;
  if (demo === "summary") return <DemoSummary />;
  return null;
}
