import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { restoreDesignVersion } from "@/lib/db/innovation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { sessionId } = await params;
  const body = await request.json();
  const { versionNumber } = body as { versionNumber: number };

  if (!versionNumber) {
    return NextResponse.json({ error: "versionNumber required" }, { status: 400 });
  }

  const version = await restoreDesignVersion(sessionId, auth.id, versionNumber);
  if (!version) {
    return NextResponse.json({ error: "Could not restore version" }, { status: 404 });
  }

  return NextResponse.json({ version });
}
