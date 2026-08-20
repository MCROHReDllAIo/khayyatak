import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createOrderFromInnovationRequest } from "@/lib/db/innovation";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { requestId } = await params;
  const result = await createOrderFromInnovationRequest(requestId, auth.id);

  if (!result) {
    return NextResponse.json(
      { error: "Cannot create order — request must be FEASIBLE with tailor confirmation" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    orderId: result.orderId,
    message: "تم إنشاء الطلب بنجاح.",
  });
}
