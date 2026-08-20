"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/app-context";
import { roleHomePath } from "@/lib/auth/redirects";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  role?: UserRole;
  children: React.ReactNode;
}

export function AuthGuard({ role, children }: AuthGuardProps) {
  const { isAuthenticated, role: userRole, authLoading, authConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;
    if (!authConfigured) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}&signup=1`);
      return;
    }
    if (role && userRole && userRole !== role) {
      // Wrong portal — send to that account's real home (not bare /login)
      router.replace(roleHomePath(userRole));
    }
  }, [isAuthenticated, userRole, role, router, authLoading, authConfigured, pathname]);

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">جاري التحقق...</p>
      </div>
    );
  }

  if (!authConfigured || !isAuthenticated || (role && userRole !== role)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">جاري التحقق...</p>
      </div>
    );
  }

  return <>{children}</>;
}
