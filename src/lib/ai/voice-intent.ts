import type { Order } from "@/types";
import { computeOverdueOrders, computeNearDueOrders } from "@/lib/analytics/platform-stats";

export interface VoiceIntentResult {
  reply_ar: string;
  reply_en: string;
  action?: string;
  demoMode: boolean;
}

const DEMO_INTENTS: { pattern: RegExp; handler: (orders: Order[]) => VoiceIntentResult }[] = [
  {
    pattern: /متأخر|تأخير|late|overdue/i,
    handler: (orders) => {
      const late = computeOverdueOrders(orders, "t1");
      return {
        reply_ar: `لديك ${late.length} طلبًا متأخرًا. ${late[0] ? `الأولوية: #${late[0].id.slice(-6)}` : ""}`,
        reply_en: `You have ${late.length} overdue orders.`,
        action: late.length ? "/tailor/orders" : undefined,
        demoMode: true,
      };
    },
  },
  {
    pattern: /كم\s*عند|how many|عدد\s*الطلب/i,
    handler: (orders) => {
      const active = orders.filter((o) => o.tailor_id === "t1" && o.status !== "delivered");
      return {
        reply_ar: `لديك ${active.length} طلبًا نشطًا و${orders.filter((o) => o.tailor_id === "t1").length} إجماليًا.`,
        reply_en: `${active.length} active orders for your shop.`,
        action: "/tailor/orders",
        demoMode: true,
      };
    },
  },
  {
    pattern: /مخزون|inventory|stock/i,
    handler: () => ({
      reply_ar: "تحقق من صفحة المخزون — هناك خامات منخفضة تحتاج إعادة طلب.",
      reply_en: "Check inventory — low stock items need reorder.",
      action: "/tailor/inventory",
      demoMode: true,
    }),
  },
  {
    pattern: /تسليم|delivery|غد|tomorrow/i,
    handler: (orders) => {
      const near = computeNearDueOrders(orders, "t1", 1);
      return {
        reply_ar: `${near.length} طلبات تسليمها غدًا.`,
        reply_en: `${near.length} orders due tomorrow.`,
        action: "/tailor/orders",
        demoMode: true,
      };
    },
  },
  {
    pattern: /دش|ثوب|عبا|dishdasha|abaya/i,
    handler: () => ({
      reply_ar: "فهمت — سأفتح مساعد التصميم. صف لي ما تريد بالتفصيل.",
      reply_en: "Opening design assistant — describe what you want.",
      action: "/customer/designer",
      demoMode: true,
    }),
  },
];

export function interpretVoiceQuery(transcript: string, orders: Order[] = []): VoiceIntentResult {
  for (const { pattern, handler } of DEMO_INTENTS) {
    if (pattern.test(transcript)) {
      return handler(orders);
    }
  }

  return {
    reply_ar: `سمعت: "${transcript}". جرّب: "كم عندي طلب متأخر؟" أو "أبغى دشداشة بيضاء".`,
    reply_en: `Heard: "${transcript}". Try asking about overdue orders or a white dishdasha.`,
    demoMode: true,
  };
}

export const VOICE_DEMO_PHRASES = [
  "كم عندي طلب متأخر؟",
  "أبغى دشداشة بيضاء رسمية صيفية",
  "كم طلب نشط؟",
];
