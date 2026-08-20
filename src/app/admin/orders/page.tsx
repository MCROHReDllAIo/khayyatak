"use client";

import { Suspense } from "react";
import AdminOrdersPage from "./AdminOrdersContent";
import { SectionSkeleton } from "@/components/admin/AdminSkeleton";

export default function AdminOrdersRoute() {
  return (
    <Suspense fallback={<SectionSkeleton rows={8} />}>
      <AdminOrdersPage />
    </Suspense>
  );
}
