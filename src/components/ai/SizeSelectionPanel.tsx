"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatchedProduct } from "@/lib/db/products";
import type { MeasurementProfile } from "@/lib/db/measurements-pg";

const READY_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface SizeSelectionPanelProps {
  product: MatchedProduct;
  onClose: () => void;
  onConfirm: (sizeLabel: string, measurements?: MeasurementProfile | null) => void;
}

export function SizeSelectionPanel({ product, onClose, onConfirm }: SizeSelectionPanelProps) {
  const [mode, setMode] = useState<"ready" | "custom">("ready");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [saved, setSaved] = useState<MeasurementProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState({
    height: "",
    weight: "",
    shoulder: "",
    chest: "",
    waist: "",
    hip: "",
    sleeve: "",
    dishdasha_length: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customer/measurements")
      .then((r) => r.json())
      .then((d) => setSaved(d.measurements ?? null))
      .finally(() => setLoading(false));
  }, []);

  const saveCustom = async () => {
    setSaving(true);
    const payload = {
      height: Number(custom.height) || undefined,
      weight: Number(custom.weight) || undefined,
      shoulder: Number(custom.shoulder) || undefined,
      chest: Number(custom.chest) || undefined,
      waist: Number(custom.waist) || undefined,
      hip: Number(custom.hip) || undefined,
      sleeve: Number(custom.sleeve) || undefined,
      dishdasha_length: Number(custom.dishdasha_length) || undefined,
      size_label: selectedSize ?? undefined,
      is_ai_estimate: false,
      confidence: 100,
    };
    const res = await fetch("/api/customer/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.measurements) {
      setSaved(data.measurements);
      onConfirm(selectedSize ?? "مخصص", data.measurements);
    }
  };

  const onlyHeightWeight =
    saved &&
    (saved.height || saved.weight) &&
    !(saved.chest && saved.waist && saved.shoulder);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-navy">اختيار المقاس</h2>
            <p className="text-xs text-muted-foreground">{product.name_ar}</p>
          </div>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!loading && saved && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                استخدم مقاساتي المحفوظة
              </p>
              {onlyHeightWeight && (
                <p className="text-xs text-amber-700">لنتيجة أدق، أضف قياسات الجسم.</p>
              )}
              <Button
                size="sm"
                onClick={() => onConfirm(saved.size_label ?? "محفوظ", saved)}
              >
                استخدم مقاساتي
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "ready" ? "default" : "outline"}
              onClick={() => setMode("ready")}
            >
              مقاس جاهز
            </Button>
            <Button
              size="sm"
              variant={mode === "custom" ? "default" : "outline"}
              onClick={() => setMode("custom")}
            >
              مقاساتي الخاصة
            </Button>
          </div>

          {mode === "ready" && (
            <div className="flex flex-wrap gap-2">
              {READY_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                    selectedSize === s
                      ? "bg-navy text-white border-navy"
                      : "border-muted hover:border-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {mode === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["height", "الطول"],
                ["weight", "الوزن"],
                ["shoulder", "الكتف"],
                ["chest", "الصدر"],
                ["waist", "الخصر"],
                ["hip", "الورك"],
                ["sleeve", "الكم"],
                ["dishdasha_length", "الطول"],
              ].map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <Input
                    type="number"
                    className="h-9"
                    value={custom[key as keyof typeof custom]}
                    onChange={(e) => setCustom((c) => ({ ...c, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            {mode === "ready" ? (
              <Button
                disabled={!selectedSize}
                className="flex-1"
                onClick={() => onConfirm(selectedSize!)}
              >
                تأكيد
              </Button>
            ) : (
              <Button disabled={saving} className="flex-1" onClick={saveCustom}>
                {saving ? "جاري الحفظ..." : "حفظ واستخدام"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
