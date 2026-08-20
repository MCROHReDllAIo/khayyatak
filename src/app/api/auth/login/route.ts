import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signInWithPostgres } from "@/lib/auth/postgres-auth";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { sessionCookieOptions } from "@/lib/auth/cookies";
import { isPostgresAuthEnabled } from "@/lib/auth/config";

export async function POST(request: Request) {
  if (!isPostgresAuthEnabled()) {
    return NextResponse.json({ error: "PostgreSQL auth is not enabled" }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const result = await signInWithPostgres(body.email, body.password);
  if (result.error || !result.profile) {
    return NextResponse.json({ error: result.error ?? "Login failed" }, { status: 401 });
  }

  const token = signSession({
    userId: result.profile.id,
    email: result.profile.email,
    role: result.profile.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

  return NextResponse.json({ profile: result.profile });
}
