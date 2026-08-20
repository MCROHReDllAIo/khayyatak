"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buildStyleDNA } from "@/lib/ai/style-dna";
import { useAuth, useAppState } from "@/lib/context/app-context";
import { StyleDNAView } from "@/components/customer/StyleDNAView";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";

export default function StyleDNAPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { orders, design, styleEvents, favoriteTailorIds } = useAppState();
  const myOrders = orders.filter((o) => o.customer_id === user?.id);
  const dna = buildStyleDNA(myOrders, design, styleEvents, favoriteTailorIds);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {t("ذوقي — Style DNA", "My Style DNA")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("ملف ذوقك الشخصي يغذّي التوصيات", "Your taste profile powers recommendations")}
        </p>
      </div>
      <StyleDNAView dna={dna} />
      <div className="flex gap-2">
        <Link href="/customer/match"><Button>{t("الخياط المناسب", "Find Match")}</Button></Link>
        <Link href="/customer/designer"><Button variant="outline">{t("صمّم الآن", "Design Now")}</Button></Link>
      </div>
    </div>
  );
}
