import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./env";
import { isPostgresAuthEnabled } from "@/lib/auth/config";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

const PROTECTED_PREFIXES = ["/customer", "/tailor", "/admin"];

function hasPostgresSession(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return Boolean(verifySession(token));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  const { url, anonKey, valid } = getSupabasePublicConfig();

  if (!valid) {
    if (isPostgresAuthEnabled()) {
      const loggedIn = hasPostgresSession(request);
      if (isProtected && !loggedIn) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (loggedIn && pathname === "/login") {
        const redirect = request.nextUrl.searchParams.get("redirect") ?? "/customer";
        return NextResponse.redirect(new URL(redirect, request.url));
      }
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const redirect = request.nextUrl.searchParams.get("redirect") ?? "/";
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  return supabaseResponse;
}
