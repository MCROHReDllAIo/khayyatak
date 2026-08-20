"use client";

import { motion } from "framer-motion";
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
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        {Array.from({ length: total }).map((_, i) => (
          <motion.span
            key={i}
            layout
            className={cn(
              "h-1.5 rounded-full",
              i === index ? "bg-omani-gold" : i < index ? "bg-primary/55" : "bg-white/25"
            )}
            initial={false}
            animate={{
              width: i === index ? 16 : 6,
              opacity: i === index ? 1 : i < index ? 0.85 : 0.45,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          />
        ))}
      </div>
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="text-[11px] text-white/50 tabular-nums"
      >
        {index + 1} / {total}
      </motion.span>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  }),
};

function DemoAiSearch() {
  const { t } = useLocale();
  const items = [
    t("فهم الطلب", "Understand request"),
    t("البحث في المتاجر", "Search stores"),
    t("مطابقة الخيارات", "Match options"),
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-2 overflow-hidden"
    >
      <motion.p
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-white/90 font-medium"
      >
        «{t("أبغى دشداشة بيضاء رسمية وصيفية", "I want a formal summer white dishdasha")}»
      </motion.p>
      <ul className="space-y-1 text-white/55">
        {items.map((item, i) => (
          <motion.li key={item} custom={i} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-1.5">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.12 + i * 0.1, type: "spring", stiffness: 500, damping: 18 }}
              className="text-omani-gold"
            >
              ✓
            </motion.span>
            {item}
          </motion.li>
        ))}
      </ul>
      <p className="text-[10px] text-omani-gold/90">
        {t("عرض توضيحي — لا يُنشئ منتجات وهمية", "Demo only — no fake products created")}
      </p>
    </motion.div>
  );
}

function DemoDesign() {
  const { t } = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-2"
    >
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-white/80">
        {t("أنت:", "You:")} «{t("خلي الأكمام أوسع", "Make sleeves wider")}»
      </motion.p>
      <motion.p
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18 }}
        className="text-primary"
      >
        {t("AI:", "AI:")} {t("تم تعديل الأكمام.", "Sleeves updated.")}
      </motion.p>
      <p className="text-[10px] uppercase tracking-wider text-omani-gold">
        {t("معاينة تصميم", "Design preview")}
      </p>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs"
    >
      <ol className="space-y-1.5 text-white/60">
        {steps.map((s, i) => (
          <motion.li
            key={s}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.25 }}
            className="flex items-center gap-2"
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-omani-gold/80"
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ delay: 0.08 * i, duration: 0.5 }}
            />
            {s}
          </motion.li>
        ))}
      </ol>
    </motion.div>
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
      {items.map((item, i) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 * i, type: "spring", stiffness: 380, damping: 22 }}
          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-[11px] text-white/80"
        >
          {item}
        </motion.div>
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
