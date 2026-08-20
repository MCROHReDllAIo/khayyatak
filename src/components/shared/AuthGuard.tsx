"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/app-context";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  role?: UserRole;
  children: React.ReactNode;
}

export function AuthGuard({ role, children }: AuthGuardProps) {
  const { isAuthenticated, role: userRole, authLoading, authConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!authConfigured) {
      router.replace("/login");
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (role && userRole !== role) {
      router.replace("/login");
    }
  }, [isAuthenticated, userRole, role, router, authLoading, authConfigured]);

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
