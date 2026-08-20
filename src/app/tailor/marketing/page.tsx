"use client";

import { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { runMarketingAgent } from "@/lib/ai/agentic";
import { generateMarketingCampaign } from "@/lib/ai/image-understanding";
import { useAppState } from "@/lib/context/app-context";
import { AIStatusBadge } from "@/components/ai/AIStatusBadge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";

export default function MarketingPage() {
  const { t } = useLocale();
  const { campaigns, addCampaign, updateCampaign, addAgentLog } = useAppState();
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedRealAI, setUsedRealAI] = useState(false);
  const agent = runMarketingAgent("عملاء إعادة الطلب");

  const generate = async () => {
    setLoading(true);
    const result = await generateMarketingCampaign("عملاء إعادة الطلب");
    setDraft(result.text);
    setUsedRealAI(result.usedRealAI);
    addCampaign({
      tailor_id: "t1",
      name: result.name,
      audience: "عملاء إعادة الطلب",
      offer: result.offer,
      message_ar: result.text,
      channel: "WhatsApp / SMS",
      timing: "خلال 48 ساعة",
      active: false,
    });
    addAgentLog({
      agent: "MarketingAgent",
      action: "إنشاء حملة",
      reason: agent.message_ar,
      status: "pending",
    });
    setLoading(false);
  };

  const activate = (id: string) => updateCampaign(id, { active: true });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="editorial-title">{t("التسويق الذكي", "AI Marketing")}</h1>
        <AIStatusBadge />
      </div>
      <p className="text-sm text-muted-foreground">{agent.message_ar}</p>
      <Button onClick={generate} disabled={loading} className="gap-2">
        <Sparkles className="h-4 w-4" />
        {loading ? t("جاري الإنشاء...", "Generating...") : t("إنشاء حملة", "Generate")}
      </Button>
      {draft && (
        <div className="rounded-xl border p-5">
          <p className="text-xs text-muted-foreground mb-2">{usedRealAI ? "OpenRouter AI" : "Built-in AI"}</p>
          <pre className="text-sm whitespace-pre-wrap">{draft}</pre>
          <Button size="sm" className="mt-4 gap-1" onClick={() => { navigator.clipboard.writeText(draft); setCopied(true); }}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{t("نسخ", "Copy")}
          </Button>
        </div>
      )}
      {campaigns.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">{t("الحملات المحفوظة", "Saved campaigns")}</h3>
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-lg border p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.audience} · {c.active ? t("نشطة", "Active") : t("مسودة", "Draft")}</p>
              </div>
              {!c.active && <Button size="sm" variant="outline" onClick={() => activate(c.id)}>{t("تفعيل", "Activate")}</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
