import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { createInnovationSession, getInnovationRequestsForCustomer } from "@/lib/db/innovation";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const { title } = body as { title?: string };

  const session = await createInnovationSession(auth.id, title);
  if (!session) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }

  return NextResponse.json({ session });
}

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const requests = await getInnovationRequestsForCustomer(auth.id);
  return NextResponse.json({ requests });
}
