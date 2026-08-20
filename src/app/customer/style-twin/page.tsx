"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ImageIcon, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { StyleTwinResults, type StyleTwinMatchCard } from "@/components/ml/StyleTwinResults";
import { Button } from "@/components/ui/button";

export default function StyleTwinPage() {
  const { t } = useLocale();
  const { isAuthenticated, authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<StyleTwinMatchCard[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (imageDataUrl?: string) => {
    if (!isAuthenticated && !authLoading) {
      window.location.href = `/login?redirect=${encodeURIComponent("/customer/style-twin")}&signup=1`;
      return;
    }
    setLoading(true);
    setError(null);
    setBlocked(false);
    setEmpty(false);
    try {
      const res = await fetch("/api/ml/style-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          text: text.trim() || undefined,
          limit: 8,
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        setBlocked(true);
        setMatches([]);
        setError(data.errorAr || data.error || null);
        return;
      }
      const list = (data.matches ?? []) as StyleTwinMatchCard[];
      setMatches(list);
      setEmpty(list.length === 0);
      if (!data.ok && data.error) setError(data.errorAr || data.error);
    } catch {
      setError(t("تعذر تشغيل توأم الأسلوب", "Style Twin failed"));
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050d18] text-white">
      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-omani-gold/90 mb-2">Style Twin ML</p>
          <h1 className="text-2xl font-bold font-arabic">{t("توأم أسلوبك", "Your Style Twin")}</h1>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            {t(
              "ارفع صورة دشداشة أو عباية أو قماش — نطابقها مع منتجات ومتاجر حقيقية فقط.",
              "Upload a dishdasha, abaya, or fabric photo — we match only real products and stores."
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-40 w-full rounded-xl object-cover" />
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder={t("وصف اختياري: رسمية، صيفية، تطريز...", "Optional: formal, summer, embroidery...")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30"
          />
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const url = reader.result as string;
                  setPreview(url);
                  run(url);
                };
                reader.readAsDataURL(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4 me-1.5" />
              {t("رفع صورة", "Upload photo")}
            </Button>
            <Button
              type="button"
              className="bg-omani-gold text-navy hover:bg-omani-gold/90"
              disabled={loading || (!text.trim() && !preview)}
              onClick={() => run(preview ?? undefined)}
            >
              <Sparkles className="h-4 w-4 me-1.5" />
              {t("ابحث", "Search")}
            </Button>
          </div>
        </div>

        <StyleTwinResults
          matches={matches}
          loading={loading}
          blocked={blocked}
          empty={empty}
          error={error}
        />

        <Link href="/" className="block text-center text-sm text-white/40 hover:text-white/70">
          {t("العودة للمتاجر", "Back to stores")}
        </Link>
      </div>
    </div>
  );
}
