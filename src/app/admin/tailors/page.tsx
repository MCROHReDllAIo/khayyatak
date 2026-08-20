"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import type { Tailor } from "@/types";

export default function AdminTailorsPage() {
  const { t } = useLocale();
  const [tailors, setTailors] = useState<Tailor[]>([]);

  useEffect(() => {
    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((json) => setTailors(json.tailors ?? []))
      .catch(() => setTailors([]));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("الخياطون", "Tailors")}</h1>
      {tailors.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{t("لم يتم تسجيل أي خياط حتى الآن", "No tailors registered yet")}</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {tailors.map((tailor) => (
            <Card key={tailor.id}>
              <CardContent className="p-4">
                <p className="font-medium">{tailor.name_ar}</p>
                <p className="text-sm text-muted-foreground">{tailor.city} · {tailor.rating}★</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
