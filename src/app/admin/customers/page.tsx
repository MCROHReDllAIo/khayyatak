"use client";

import { Suspense } from "react";
import AdminCustomersContent from "./AdminCustomersContent";
import { SectionSkeleton } from "@/components/admin/AdminSkeleton";

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<SectionSkeleton rows={6} />}>
      <AdminCustomersContent />
    </Suspense>
  );
}
