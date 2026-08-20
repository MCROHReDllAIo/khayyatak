export interface AgentAction {
  id: string;
  agent: string;
  message_ar: string;
  message_en: string;
  requiresApproval: boolean;
  status: "pending" | "approved" | "dismissed";
}

export interface AgentWorkflow {
  trigger: string;
  steps: string[];
  suggestedAction: AgentAction;
}

export function runInventoryAgent(stockDays: number, fabric: string): AgentWorkflow {
  return {
    trigger: `مخزون ${fabric} منخفض (${stockDays} أيام)`,
    steps: [
      "اكتشاف نقص المخزون",
      "تحليل توقع الطلب",
      "حساب الكمية المطلوبة",
      "إعداد طلب توريد",
      "انتظار موافقة الخياط",
    ],
    suggestedAction: {
      id: `agent-${Date.now()}`,
      agent: "InventoryAgent",
      message_ar: `أنصح بإعادة طلب 25 مترًا من ${fabric}. هل توافق؟`,
      message_en: `Recommend reordering 25m of ${fabric}. Approve?`,
      requiresApproval: true,
      status: "pending",
    },
  };
}

export function runOrderAgent(lateCount: number): AgentAction {
  return {
    id: `order-agent-${Date.now()}`,
    agent: "OrderAgent",
    message_ar: `${lateCount} طلبات معرضة للتأخر. أقترح إعادة ترتيب الأولويات.`,
    message_en: `${lateCount} orders at risk of delay. Reprioritize?`,
    requiresApproval: true,
    status: "pending",
  };
}

export function runMarketingAgent(audience: string): AgentAction {
  return {
    id: `mkt-${Date.now()}`,
    agent: "MarketingAgent",
    message_ar: `حملة "عرض إعادة طلب" جاهزة لـ ${audience}.`,
    message_en: `Reorder campaign ready for ${audience}.`,
    requiresApproval: true,
    status: "pending",
  };
}
