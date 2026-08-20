import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import {
  getInnovationRequestDetail,
  submitFeasibilityReview,
  getTailorIdForProfile,
} from "@/lib/db/innovation";
import { explainTailorResponse } from "@/lib/ai/innovation-design";
import { pgQuery } from "@/lib/db/postgres";
import type { FeasibilityDecision } from "@/lib/innovation/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.role === "tailor" ? "tailor" : "customer";
  const { requestId } = await params;

  const detail = await getInnovationRequestDetail(requestId, auth.id, role);
  if (!detail) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ request: detail });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.role !== "tailor") {
    return NextResponse.json({ error: "Tailor access only" }, { status: 403 });
  }

  const tailorId = await getTailorIdForProfile(auth.id);
  if (!tailorId) {
    return NextResponse.json({ error: "Tailor not found" }, { status: 404 });
  }

  const { requestId } = await params;
  const body = await request.json();
  const {
    decision,
    estimated_price,
    estimated_delivery_days,
    tailor_notes_ar,
    suggested_changes,
  } = body as {
    decision: FeasibilityDecision;
    estimated_price?: number;
    estimated_delivery_days?: number;
    tailor_notes_ar: string;
    suggested_changes?: string[];
  };

  if (!decision || !tailor_notes_ar) {
    return NextResponse.json({ error: "decision and tailor_notes_ar required" }, { status: 400 });
  }

  if (decision === "FEASIBLE" && (!estimated_price || !estimated_delivery_days)) {
    return NextResponse.json(
      { error: "estimated_price and estimated_delivery_days required for FEASIBLE" },
      { status: 400 }
    );
  }

  const review = await submitFeasibilityReview(requestId, tailorId, {
    decision,
    estimated_price,
    estimated_delivery_days,
    tailor_notes_ar,
    suggested_changes,
  });

  if (!review) {
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }

  const explanation = await explainTailorResponse(decision, tailor_notes_ar);

  const { rows: reqRows } = await pgQuery<{ customer_id: string }>(
    `SELECT customer_id FROM custom_design_requests WHERE id = $1`,
    [requestId]
  );

  if (reqRows[0]?.customer_id) {
    await pgQuery(
      `INSERT INTO design_feasibility_responses (review_id, request_id, customer_id, ai_explanation_ar, ai_explanation_en)
       VALUES ($1, $2, $3, $4, $5)`,
      [review.id, requestId, reqRows[0].customer_id, explanation.ar, explanation.en]
    );
  }

  return NextResponse.json({
    review,
    aiExplanation: explanation,
    message: "تم إرسال الرد للعميل.",
  });
}
