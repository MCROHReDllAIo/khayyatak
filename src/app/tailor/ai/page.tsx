"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, TrendingUp, Package, DollarSign, Users, AlertTriangle, Mic } from "lucide-react";
import { generateBusinessInsightsFromData } from "@/lib/ai/business-insights";
import { runInventoryAgent, runOrderAgent } from "@/lib/ai/agentic";
import { computeOverdueOrders } from "@/lib/analytics/platform-stats";
import { interpretVoiceQuery, VOICE_DEMO_PHRASES } from "@/lib/ai/voice-intent";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { VoiceInput } from "@/components/ai/VoiceInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/context/locale-context";
import { BRAND } from "@/lib/constants/brand";
import { useAppState } from "@/lib/context/app-context";

export default function TailorAIPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { orders, inventory, agentLogs, addAgentLog, approveAgentLog } = useAppState();
  const [voiceReply, setVoiceReply] = useState<string | null>(null);

  const insights = useMemo(
    () => generateBusinessInsightsFromData(orders, inventory),
    [orders, inventory]
  );
  const lowStock = inventory.find((i) => i.low_stock) ?? inventory[0];
  const overdueCount = computeOverdueOrders(orders, "t1").length;
  const inventoryWorkflow = runInventoryAgent(lowStock?.ai_forecast_days ?? 6, lowStock?.fabric_name_ar ?? "القماش");
  const orderAlert = runOrderAgent(overdueCount || 1);

  const handleVoice = (text: string) => {
    const result = interpretVoiceQuery(text, orders);
    setVoiceReply(result.reply_ar);
    if (result.action) setTimeout(() => router.push(result.action!), 1500);
  };

  const handleApproveInventory = () => {
    addAgentLog({
      agent: "InventoryAgent",
      action: inventoryWorkflow.suggestedAction.message_ar,
      reason: inventoryWorkflow.trigger,
      status: "approved",
    });
    approveAgentLog(agentLogs[0]?.id ?? "");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {t(BRAND.aiAssistantAr, BRAND.aiAssistantEn)}
        </h1>
        <p className="text-muted-foreground">{t("ذكاء الأعمال لمتجرك — Demo AI من بيانات حقيقية", "Business intelligence — Demo AI from live data")}</p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-5">
          <h3 className="font-bold flex items-center gap-2 mb-3">
            <Mic className="h-5 w-5 text-primary" /> {t("Voice AI", "Voice AI")}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <VoiceInput onTranscript={handleVoice} />
            {VOICE_DEMO_PHRASES.map((phrase) => (
              <Button key={phrase} variant="outline" size="sm" onClick={() => handleVoice(phrase)}>
                {phrase}
              </Button>
            ))}
          </div>
          {voiceReply && (
            <p className="text-sm rounded-xl bg-omani-cream p-3 border">{voiceReply}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">Demo Voice · {t("يمكن استبداله بمزود حقيقي", "Replaceable with real provider")}</p>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {insights.map((i) => (
          <AIInsightCard key={i.id} message={i.message_ar} />
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-5">
          <h3 className="font-bold flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" /> {t("إدارة الطلبات AI", "AI Order Management")}
          </h3>
          <p className="text-sm mt-2">{orderAlert.message_ar}</p>
          <p className="text-xs text-muted-foreground mt-2">{overdueCount} {t("طلبات متأخرة محسوبة", "computed overdue")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold mb-3">{t("Agentic AI — سير عمل", "Agentic Workflow")}</h3>
          <p className="text-sm text-muted-foreground mb-2">{inventoryWorkflow.trigger}</p>
          <ol className="text-sm space-y-1 mb-4">
            {inventoryWorkflow.steps.map((s, i) => (
              <li key={i}>{i + 1}. {s}</li>
            ))}
          </ol>
          <p className="text-sm font-medium text-primary">{inventoryWorkflow.suggestedAction.message_ar}</p>
          <Button size="sm" className="mt-3" onClick={handleApproveInventory}>{t("موافقة", "Approve")}</Button>
          <p className="text-[10px] text-muted-foreground mt-2">{t("يتطلب موافقتك — Demo", "Requires your approval — Demo")}</p>
        </CardContent>
      </Card>

      {agentLogs.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-3">{t("سجل الوكلاء", "Agent Activity Log")}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {agentLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="text-sm border-b pb-2">
                  <p className="font-medium">{log.agent}</p>
                  <p className="text-muted-foreground">{log.action}</p>
                  <p className="text-xs text-primary">{log.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/tailor/analytics"><Button variant="outline" size="sm" className="gap-1"><TrendingUp className="h-3 w-3" />{t("تحليل المبيعات", "Sales")}</Button></Link>
        <Link href="/tailor/inventory"><Button variant="outline" size="sm" className="gap-1"><Package className="h-3 w-3" />{t("المخزون", "Inventory")}</Button></Link>
        <Link href="/tailor/pricing"><Button variant="outline" size="sm" className="gap-1"><DollarSign className="h-3 w-3" />{t("التسعير", "Pricing")}</Button></Link>
        <Link href="/tailor/marketing"><Button variant="outline" size="sm" className="gap-1"><Users className="h-3 w-3" />{t("التسويق", "Marketing")}</Button></Link>
      </div>
    </div>
  );
}
