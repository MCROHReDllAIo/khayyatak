"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wand2, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatOMR } from "@/lib/utils";
import type { CustomDesignRequest } from "@/lib/innovation/types";

export default function InnovationRequestsPage() {
  const [requests, setRequests] = useState<CustomDesignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/innovation")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .finally(() => setLoading(false));
  }, []);

  const confirmOrder = async (requestId: string) => {
    setConfirming(requestId);
    const res = await fetch(`/api/customer/innovation/requests/${requestId}/confirm`, {
      method: "POST",
    });
    const data = await res.json();
    setConfirming(null);
    if (res.ok && data.orderId) {
      window.location.href = "/customer/orders";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="editorial-title flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          طلبات الابتكار
        </h1>
        <p className="text-sm text-muted-foreground">ردود حقيقية من الخياطين — لا ردود وهمية</p>
      </div>

      <Link href="/customer/innovation">
        <Button variant="outline" size="sm">+ تصميم جديد</Button>
      </Link>

      {loading && <p className="text-muted-foreground text-sm">جاري التحميل...</p>}

      {requests.map((req) => (
        <div key={req.id} className="rounded-xl border bg-white p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-navy">{req.store_name_ar ?? "متجر"}</p>
              <p className="text-xs text-muted-foreground">{req.status}</p>
            </div>
            {req.status === "SUBMITTED" && (
              <span className="text-xs text-amber-700 flex items-center gap-1">
                <Loader2 className="h-3 w-3" /> بانتظار رد المتجر
              </span>
            )}
          </div>

          {req.review && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-2">
              {req.review.decision === "FEASIBLE" && (
                <p className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> الخياط أكد إمكانية تنفيذ التصميم
                </p>
              )}
              {req.review.decision === "NEEDS_CHANGES" && (
                <p className="flex items-center gap-1 text-amber-700 font-medium">
                  <AlertTriangle className="h-4 w-4" /> يحتاج تعديل
                </p>
              )}
              {req.review.decision === "NOT_FEASIBLE" && (
                <p className="flex items-center gap-1 text-red-600 font-medium">
                  <XCircle className="h-4 w-4" /> لا يمكن تنفيذه حاليًا
                </p>
              )}
              <p>{req.review.tailor_notes_ar}</p>
              {req.review.estimated_price != null && (
                <p className="font-bold text-primary">
                  السعر النهائي من الخياط: {formatOMR(req.review.estimated_price)}
                  {req.review.estimated_delivery_days && ` · ${req.review.estimated_delivery_days} أيام`}
                </p>
              )}
            </div>
          )}

          {req.status === "FEASIBLE" && req.review && (
            <Button
              size="sm"
              disabled={confirming === req.id}
              onClick={() => confirmOrder(req.id)}
              className="gap-1"
            >
              {confirming === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              تأكيد الطلب
            </Button>
          )}
        </div>
      ))}

      {!loading && requests.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">لا توجد طلبات بعد</p>
      )}
    </div>
  );
}
