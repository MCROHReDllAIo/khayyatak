"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InnovationDesignCanvas } from "@/components/innovation/InnovationDesignCanvas";
import { InnovationSpecPanel } from "@/components/innovation/InnovationSpecPanel";
import { useLocale } from "@/lib/context/locale-context";
import type { FeasibilityDecision, CustomDesignRequest, CustomDesignVersion, FeasibilityReview } from "@/lib/innovation/types";

interface RequestDetail extends CustomDesignRequest {
  version: CustomDesignVersion;
  review?: FeasibilityReview;
}

export default function TailorInnovationReviewPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<FeasibilityDecision | null>(null);
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");

  useEffect(() => {
    fetch(`/api/tailor/innovation/${requestId}`)
      .then((r) => r.json())
      .then((d) => setRequest(d.request))
      .finally(() => setLoading(false));
  }, [requestId]);

  const submitReview = async () => {
    if (!decision || !notes.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/tailor/innovation/${requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        tailor_notes_ar: notes,
        estimated_price: price ? Number(price) : undefined,
        estimated_delivery_days: days ? Number(days) : undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) router.push("/tailor/innovation");
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">{t("جاري التحميل...", "Loading...")}</div>;
  }

  if (!request?.version) {
    return (
      <div className="p-12 text-center space-y-4">
        <p>{t("الطلب غير موجود", "Request not found")}</p>
        <Link href="/tailor/innovation"><Button variant="outline">{t("رجوع", "Back")}</Button></Link>
      </div>
    );
  }

  const spec = request.version.spec;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/tailor/innovation" className="inline-flex items-center gap-1 text-sm text-primary">
        <ArrowRight className="h-4 w-4" /> {t("طلبات الابتكار", "Innovation requests")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-navy">{t("طلب ابتكار جديد", "New innovation request")}</h1>
        <p className="text-sm text-muted-foreground">
          {request.customer_name} · {request.status}
        </p>
      </div>

      {request.ai_tailor_summary && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
          <p className="text-xs font-semibold text-primary mb-1">AI Summary (لا يؤكد التنفيذ)</p>
          <p>{request.ai_tailor_summary}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <InnovationDesignCanvas spec={spec} />
        <InnovationSpecPanel spec={spec} />
      </div>

      {request.review ? (
        <div className="rounded-xl border bg-emerald-50 p-4 text-sm">
          <p className="font-medium">{t("تم الرد:", "Response submitted:")} {request.review.decision}</p>
          <p>{request.review.tailor_notes_ar}</p>
          {request.review.estimated_price != null && (
            <p>{request.review.estimated_price} OMR · {request.review.estimated_delivery_days} {t("أيام", "days")}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <p className="font-semibold text-navy">{t("قرارك — أنت من يؤكد", "Your decision — you confirm feasibility")}</p>

          <div className="flex flex-wrap gap-2">
            {([
              { d: "FEASIBLE" as const, icon: CheckCircle2, ar: "أستطيع تنفيذه", color: "emerald" },
              { d: "NEEDS_CHANGES" as const, icon: AlertTriangle, ar: "بعد تعديل", color: "amber" },
              { d: "NOT_FEASIBLE" as const, icon: XCircle, ar: "لا أستطيع", color: "red" },
            ]).map(({ d, icon: Icon, ar }) => (
              <button
                key={d}
                type="button"
                onClick={() => setDecision(d)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm ${
                  decision === d ? "border-primary bg-primary/10" : "border-muted"
                }`}
              >
                <Icon className="h-4 w-4" /> {ar}
              </button>
            ))}
          </div>

          <div>
            <Label>{t("ملاحظاتك (حقيقية)", "Your notes")}</Label>
            <textarea
              className="w-full mt-1 rounded-lg border p-3 text-sm min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("مثال: القماش المطلوب غير متوفر...", "e.g. Required fabric not in stock...")}
            />
          </div>

          {decision === "FEASIBLE" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("السعر (OMR)", "Price OMR")}</Label>
                <Input type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <Label>{t("أيام التسليم", "Delivery days")}</Label>
                <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
            </div>
          )}

          <Button disabled={!decision || !notes.trim() || submitting} onClick={submitReview} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("إرسال الرد للعميل", "Send response to customer")}
          </Button>
        </div>
      )}
    </div>
  );
}
