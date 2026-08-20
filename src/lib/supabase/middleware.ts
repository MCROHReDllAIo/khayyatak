import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./env";
import { isPostgresAuthEnabled } from "@/lib/auth/config";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { roleHomePath, safeAuthRedirect } from "@/lib/auth/redirects";

const PROTECTED_PREFIXES = ["/customer", "/tailor", "/admin"];

function hasPostgresSession(request: NextRequest): { valid: boolean; role?: string } {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { valid: false };
  const session = verifySession(token);
  if (!session) return { valid: false };
  return { valid: true, role: session.role };
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  const { url, anonKey, valid } = getSupabasePublicConfig();

  if (!valid) {
    if (isPostgresAuthEnabled()) {
      const session = hasPostgresSession(request);
      if (isProtected && !session.valid) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        const returnTo = `${pathname}${request.nextUrl.search || ""}`;
        loginUrl.search = "";
        loginUrl.searchParams.set("redirect", returnTo);
        return NextResponse.redirect(loginUrl);
      }
      if (session.valid && pathname === "/login") {
        const redirectParam = request.nextUrl.searchParams.get("redirect");
        const dest = safeAuthRedirect(redirectParam, session.role ?? "customer");
        return NextResponse.redirect(new URL(dest, request.url));
      }

      // Keep each role inside its portal
      if (session.valid && session.role) {
        if (pathname.startsWith("/customer") && session.role !== "customer") {
          return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
        }
        if (pathname.startsWith("/tailor") && session.role !== "tailor") {
          return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
        }
        if (pathname.startsWith("/admin") && session.role !== "admin") {
          return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
        }
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
    const returnTo = `${pathname}${request.nextUrl.search || ""}`;
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const redirect = request.nextUrl.searchParams.get("redirect") ?? "/";
    // Without role on the JWT path, still avoid sending bare "/" loops
    return NextResponse.redirect(new URL(redirect === "/" ? "/customer" : redirect, request.url));
  }

  return supabaseResponse;
}
