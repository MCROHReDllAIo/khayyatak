import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getInnovationRequestsForTailor, getTailorIdForProfile } from "@/lib/db/innovation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.role !== "tailor") {
    return NextResponse.json({ error: "Tailor access only" }, { status: 403 });
  }

  const tailorId = await getTailorIdForProfile(auth.id);
  if (!tailorId) {
    return NextResponse.json({ error: "Tailor profile not found" }, { status: 404 });
  }

  const requests = await getInnovationRequestsForTailor(tailorId);
  return NextResponse.json({ requests });
}
