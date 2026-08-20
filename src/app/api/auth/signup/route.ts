import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signUpWithPostgres } from "@/lib/auth/postgres-auth";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { sessionCookieOptions } from "@/lib/auth/cookies";
import { isPostgresAuthEnabled } from "@/lib/auth/config";
import type { UserRole } from "@/types";

export async function POST(request: Request) {
  if (!isPostgresAuthEnabled()) {
    return NextResponse.json({ error: "PostgreSQL auth is not enabled" }, { status: 503 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    fullName?: string;
    role?: UserRole;
  };

  if (!body.email || !body.password || !body.fullName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await signUpWithPostgres(
    body.email,
    body.password,
    body.fullName,
    body.role ?? "customer"
  );

  if (result.error || !result.profile) {
    return NextResponse.json({ error: result.error ?? "Sign up failed" }, { status: 400 });
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
