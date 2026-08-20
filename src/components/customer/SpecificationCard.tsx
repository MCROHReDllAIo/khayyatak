"use client";

import type { TailorSpecification } from "@/lib/ai/specification";
import { Card, CardContent } from "@/components/ui/card";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { FileText } from "lucide-react";

interface SpecificationCardProps {
  spec: TailorSpecification;
}

export function SpecificationCard({ spec }: SpecificationCardProps) {
  return (
    <Card className="border-omani-gold/30 overflow-hidden">
      <div className="bg-navy text-white px-6 py-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-omani-gold" />
        <div>
          <h3 className="font-bold">Tailor Specification</h3>
          <p className="text-xs text-white/70">مواصفات التفصيل للخياط</p>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <GarmentPreview design={spec.garment} size="sm" />
          <div className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">العميل:</span> <strong>{spec.customerName}</strong></div>
            {spec.customerCity && <div><span className="text-muted-foreground">المدينة:</span> {spec.customerCity}</div>}
            <div><span className="text-muted-foreground">التسليم:</span> {spec.deliveryDays} أيام</div>
            {spec.budget && <div><span className="text-muted-foreground">الميزانية:</span> {spec.budget}</div>}
            {spec.measurements && (
              <div className="rounded-lg bg-omani-cream p-3 text-xs">
                الطول {spec.measurements.height}cm • الصدر {spec.measurements.chest}cm • الخصر {spec.measurements.waist}cm
                <p className="text-amber-700 mt-1">AI Estimate — يُؤكد مع الخياط</p>
              </div>
            )}
            <ul className="space-y-1 pt-2 border-t">
              {spec.notes.map((n, i) => (
                <li key={i} className="text-muted-foreground">• {n}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
