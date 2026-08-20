import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProfileById } from "@/lib/auth/postgres-auth";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/auth/session";
import { sessionCookieOptions } from "@/lib/auth/cookies";
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
  if (!profile) {
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({ profile: null });
  }

  // Rolling refresh — extend session on each visit so one login lasts
  const refreshed = signSession({
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  });
  cookieStore.set(SESSION_COOKIE, refreshed, sessionCookieOptions());

  return NextResponse.json({ profile });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
