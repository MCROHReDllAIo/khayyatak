/** Role-aware post-login destinations */

import type { UserRole } from "@/types";

export function roleHomePath(role: UserRole | string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "tailor") return "/tailor/dashboard";
  return "/customer";
}

/**
 * Only allow redirects into the area that matches the signed-in role.
 * Prevents tailor/admin accounts from being sent into /customer/* (and vice versa),
 * which then bounces them to the wrong dashboard.
 */
export function safeAuthRedirect(
  redirect: string | null | undefined,
  role: UserRole | string | null | undefined
): string {
  const home = roleHomePath(role);
  if (!redirect || redirect === "/") return home;

  let path = redirect;
  try {
    if (path.startsWith("http")) {
      path = new URL(path).pathname + new URL(path).search;
    }
  } catch {
    return home;
  }

  if (!path.startsWith("/")) return home;

  if (role === "customer" && (path.startsWith("/tailor") || path.startsWith("/admin"))) {
    return home;
  }
  if (role === "tailor" && (path.startsWith("/customer") || path.startsWith("/admin"))) {
    return home;
  }
  if (role === "admin" && (path.startsWith("/customer") || path.startsWith("/tailor"))) {
    // Admins may open admin only by default
    if (!path.startsWith("/admin")) return home;
  }

  return path;
}

export function innovatePathForRole(role: UserRole | string | null | undefined): string {
  if (role === "tailor") return "/tailor/innovation";
  if (role === "admin") return "/admin";
  return "/customer/innovation";
}
