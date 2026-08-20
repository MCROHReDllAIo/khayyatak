import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProfileById } from "@/lib/auth/postgres-auth";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { isPostgresAuthEnabled } from "@/lib/auth/config";

export async function GET() {
  if (!isPostgresAuthEnabled()) {
    return NextResponse.json({ profile: null });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ profile: null });

  const session = verifySession(token);
  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({ profile: null });
  }

  const profile = await getProfileById(session.userId);
  return NextResponse.json({ profile });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
