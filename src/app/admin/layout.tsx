"use client";

import { AuthGuard } from "@/components/shared/AuthGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { AIStatusBanner } from "@/components/ai/AIStatusBadge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <div className="min-h-screen bg-gradient-to-br from-omani-cream/40 via-white to-slate-50">
        <div className="flex flex-row-reverse min-h-[calc(100vh-29px)]">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminTopBar />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
              <AIStatusBanner />
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
