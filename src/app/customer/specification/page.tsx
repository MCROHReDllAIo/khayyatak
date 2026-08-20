"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FileText, ShoppingBag, Download, Save } from "lucide-react";
import { generateTailorSpecification, type TailorSpecification } from "@/lib/ai/specification";
import { useAuth, useAppState } from "@/lib/context/app-context";
import { SpecificationCard } from "@/components/customer/SpecificationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/context/locale-context";

const SPEC_KEY = "st_saved_spec";

export default function SpecificationPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { design, measurements } = useAppState();

  const baseSpec = useMemo(
    () => generateTailorSpecification(user, design, measurements),
    [user, design, measurements]
  );

  const [spec, setSpec] = useState<TailorSpecification>(() => {
    if (typeof window === "undefined") return baseSpec;
    try {
      const saved = localStorage.getItem(SPEC_KEY);
      return saved ? (JSON.parse(saved) as TailorSpecification) : baseSpec;
    } catch {
      return baseSpec;
    }
  });
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const handleSave = () => {
    localStorage.setItem(SPEC_KEY, JSON.stringify(spec));
    setEditing(false);
  };

  const handleAddNote = () => {
    if (!noteDraft.trim()) return;
    setSpec({ ...spec, notes: [...spec.notes, noteDraft.trim()] });
    setNoteDraft("");
  };

  const handlePrint = () => window.print();

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:max-w-none">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          {t("مواصفات التفصيل", "AI Tailoring Specification")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("ورقة طلب احترافية للخياط", "Professional order sheet for your tailor")}
        </p>
      </div>
      <SpecificationCard spec={spec} />
      {editing && (
        <div className="rounded-xl border p-4 space-y-3 print:hidden">
          <Input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder={t("ملاحظة للخياط", "Note for tailor")} />
          <Button size="sm" onClick={handleAddNote}>{t("إضافة ملاحظة", "Add note")}</Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Link href="/customer/checkout">
          <Button className="gap-2"><ShoppingBag className="h-4 w-4" />{t("تأكيد الطلب", "Place Order")}</Button>
        </Link>
        <Link href="/customer/designer"><Button variant="outline">{t("تعديل التصميم", "Edit Design")}</Button></Link>
        <Button variant="outline" className="gap-2" onClick={() => setEditing(!editing)}>{t("تعديل", "Edit")}</Button>
        <Button variant="outline" className="gap-2" onClick={handleSave}><Save className="h-4 w-4" />{t("حفظ", "Save")}</Button>
        <Button variant="outline" className="gap-2" onClick={handlePrint}><Download className="h-4 w-4" />{t("طباعة / PDF", "Print / PDF")}</Button>
      </div>
    </div>
  );
}
