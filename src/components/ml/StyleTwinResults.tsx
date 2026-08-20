"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Percent, Sparkles, Store } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR, cn } from "@/lib/utils";
import { ProductImageEmpty } from "@/components/shared/ProductImageEmpty";
import { resolveProductImageUrl } from "@/lib/images/product-image";

export interface StyleTwinMatchCard {
  id: string;
  tailor_id: string;
  name_ar: string;
  name_en?: string | null;
  fabric?: string | null;
  color?: string | null;
  style_cut?: string | null;
  style?: string | null;
  image_url?: string | null;
  price?: number;
  tailor_name_ar?: string | null;
  match_percent: number;
  match_reasons: string[];
}

const REASON_LABEL: Record<string, { ar: string; en: string }> = {
  category: { ar: "التصنيف", en: "Category" },
  color: { ar: "اللون", en: "Color" },
  style: { ar: "القصة", en: "Cut" },
  fabric: { ar: "القماش", en: "Fabric" },
  occasion: { ar: "المناسبة", en: "Occasion" },
  embroidery: { ar: "التطريز", en: "Embroidery" },
  style_twin: { ar: "تشابه أسلوبي", en: "Style twin" },
};

interface StyleTwinResultsProps {
  matches: StyleTwinMatchCard[];
  loading?: boolean;
  blocked?: boolean;
  empty?: boolean;
  error?: string | null;
  onHighlightStores?: (tailorIds: string[]) => void;
}

export function StyleTwinResults({
  matches,
  loading,
  blocked,
  empty,
  error,
  onHighlightStores,
}: StyleTwinResultsProps) {
  const { t, locale } = useLocale();

  if (loading) {
    return (
      <div className="rounded-2xl border border-omani-gold/25 bg-omani-gold/5 px-3 py-4 space-y-2">
        <div className="flex items-center gap-2 text-omani-gold text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {t("نبحث عن توأم أسلوبك في المتاجر الحقيقية...", "Finding your style twin in real stores...")}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-omani-gold"
            initial={{ width: "8%" }}
            animate={{ width: ["12%", "78%", "42%", "90%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/55">
        {error ||
          t(
            "توأم الأسلوب يحتاج تفعيل الذكاء الاصطناعي (OpenRouter).",
            "Style Twin needs AI (OpenRouter) configured."
          )}
      </div>
    );
  }

  if (error && !matches.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/55">
        {error}
      </div>
    );
  }

  if (empty || matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-3 py-4 text-center text-xs text-white/50">
        {t(
          "لم نجد تطابقًا قويًا بما يكفي في المتاجر الحقيقية. جرّب صورة أوضح أو وصفًا أدق.",
          "No strong match in real stores yet. Try a clearer photo or a more specific description."
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-omani-gold">
          {t("توأم أسلوبك", "Style Twin")}
        </p>
        <button
          type="button"
          className="text-[11px] text-white/45 hover:text-white/80"
          onClick={() => onHighlightStores?.(matches.map((m) => m.tailor_id))}
        >
          {t("إبراز المتاجر", "Highlight stores")}
        </button>
      </div>

      {matches.map((m, i) => {
        const img = resolveProductImageUrl(m.image_url);
        return (
          <motion.article
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white text-navy"
          >
            <div className="flex gap-3 p-2.5">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ProductImageEmpty className="h-full text-[10px]" />
                )}
                <span
                  className={cn(
                    "absolute bottom-1 start-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                    m.match_percent >= 75
                      ? "bg-omani-gold text-navy"
                      : "bg-navy text-white"
                  )}
                >
                  <Percent className="h-2.5 w-2.5" />
                  {m.match_percent}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-sm font-semibold leading-snug truncate">
                  {locale === "ar" ? m.name_ar : m.name_en || m.name_ar}
                </h4>
                {m.tailor_name_ar && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Store className="h-3 w-3" />
                    {m.tailor_name_ar}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {m.match_reasons.slice(0, 4).map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] text-navy/70"
                    >
                      {locale === "ar" ? REASON_LABEL[r]?.ar ?? r : REASON_LABEL[r]?.en ?? r}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  {typeof m.price === "number" && m.price > 0 ? (
                    <span className="text-xs font-semibold text-primary">
                      {formatOMR(m.price, locale === "ar" ? "ar" : "en")}
                    </span>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={`/tailors/${m.tailor_id}`}
                    className="text-[11px] font-medium text-navy hover:underline"
                  >
                    {t("زيارة المتجر", "Visit store")}
                  </Link>
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
