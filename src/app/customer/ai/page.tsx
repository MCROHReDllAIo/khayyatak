"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageIcon, ShoppingBag } from "lucide-react";
import { generateId } from "@/lib/utils";
import { AIChat, type ChatMessage } from "@/components/ai/AIChat";
import { ConciergeInput } from "@/components/ai/ConciergeInput";
import { AIStatusBadge } from "@/components/ai/AIStatusBadge";
import { VirtualLookPanel } from "@/components/ai/VirtualLookPanel";
import { SizeSelectionPanel } from "@/components/ai/SizeSelectionPanel";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";
import type { MatchedProduct } from "@/lib/db/products";
import type { ConciergeShoppingContext } from "@/lib/ai/concierge-types";

function AIConciergeContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t(
        "مرحبًا! أنا Personal Shopper الذكي في خياطك.\n\nصف ما تريده — مثل: «أبغى عباية حمرا مفتوحة» — وأبحث لك في منتجاتنا الحقيقية.",
        "Hi! I'm your Khayyatak AI personal shopper. Describe what you want and I'll find real products."
      ),
      actions: ["أبغى عباية حمرا مفتوحة", "تحليل صورة", "ابحث عن خياط"],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<ConciergeShoppingContext>({});
  const [selectedProduct, setSelectedProduct] = useState<MatchedProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [showVirtualLook, setShowVirtualLook] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const callConcierge = useCallback(
    async (text: string, imageUrl?: string) => {
      const userMsg: ChatMessage = { id: generateId(), role: "user", content: text, imageUrl };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/concierge/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, imageDataUrl: imageUrl, context }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");

        if (data.context) setContext(data.context);

        if (data.selectedProduct) {
          setSelectedProduct(data.selectedProduct);
        } else if (data.products?.length === 1 && data.flow === "select") {
          setSelectedProduct(data.products[0]);
        }

        setMessages((m) => [
          ...m,
          {
            id: generateId(),
            role: "assistant",
            content: data.reply,
            actions: data.suggestedActions,
            products: data.products?.length ? data.products : undefined,
            isDesignConcept: data.products?.length === 0 && Boolean(data.intentDesign) && !data.usedRealAI,
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: generateId(),
            role: "assistant",
            content: "عذرًا، حدث خطأ. حاول مرة أخرى.",
            actions: ["أبغى عباية حمرا مفتوحة"],
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [context]
  );

  const handleProductSelect = useCallback(
    (product: MatchedProduct) => {
      setSelectedProduct(product);
      setContext((c) => ({ ...c, selectedProductId: product.id, lastProducts: [product] }));
      setMessages((m) => [
        ...m,
        {
          id: generateId(),
          role: "assistant",
          content: `تمام. اخترت "${product.name_ar}". هل تريد استخدام مقاساتك المحفوظة؟`,
          actions: ["استخدم مقاساتي", "إدخال مقاسات", "نظرة افتراضية", "اختيار هذا التصميم"],
          products: [product],
        },
      ]);
    },
    []
  );

  const createOrder = useCallback(async () => {
    if (!selectedProduct) return;
    setOrdering(true);
    try {
      const res = await fetch("/api/customer/orders/from-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          sizeLabel: selectedSize,
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setMessages((m) => [
          ...m,
          {
            id: generateId(),
            role: "assistant",
            content: `تم إنشاء طلبك #${data.order.id.slice(0, 8)} بنجاح!`,
            actions: ["عرض الطلبات"],
          },
        ]);
        router.push("/customer/orders");
      } else {
        setMessages((m) => [
          ...m,
          {
            id: generateId(),
            role: "assistant",
            content: data.error ?? "تعذر إنشاء الطلب. تأكد من تسجيل الدخول.",
            actions: ["تسجيل الدخول"],
          },
        ]);
      }
    } finally {
      setOrdering(false);
    }
  }, [selectedProduct, selectedSize, router]);

  const handleAction = useCallback(
    (action: string) => {
      if (action.includes("صورة") || action.includes("Image")) {
        router.push("/customer/image-ai");
        return;
      }
      if (action.includes("خياط") || action.includes("Tailor")) {
        router.push("/customer/tailors");
        return;
      }
      if (action.includes("تسجيل") || action.includes("Login")) {
        router.push("/login");
        return;
      }
      if (action.includes("طلبات") || action.includes("Orders")) {
        router.push("/customer/orders");
        return;
      }
      if (action.includes("استخدم مقاساتي") || action.includes("إدخال مقاسات")) {
        if (selectedProduct) setShowSizePanel(true);
        else callConcierge(action);
        return;
      }
      if (action.includes("نظرة افتراضية") || action.includes("Virtual")) {
        if (selectedProduct) setShowVirtualLook(true);
        else callConcierge(action);
        return;
      }
      if (
        action.includes("اختيار هذا التصميم") ||
        action.includes("اختيار") ||
        action.includes("Choose")
      ) {
        if (selectedProduct) createOrder();
        else callConcierge(action);
        return;
      }
      if (action.includes("تصميم") && action.includes("أنشئ")) {
        router.push("/customer/designer");
        return;
      }
      callConcierge(action);
    },
    [router, selectedProduct, callConcierge, createOrder]
  );

  useEffect(() => {
    if (initialQ && !bootstrapped) {
      setBootstrapped(true);
      callConcierge(initialQ);
    }
  }, [initialQ, bootstrapped, callConcierge]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            AI Personal Shopper
          </p>
          <AIStatusBadge />
        </div>
        <h1 className="editorial-title">{t("مساعد التسوق الذكي", "AI Personal Shopper")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            "أخبرني ما تريد — أجد لك منتجات حقيقية من خياطك",
            "Tell me what you want — I'll find real Khayyatak products"
          )}
        </p>
      </motion.header>

      <ConciergeInput variant="inline" onSubmit={callConcierge} />

      {selectedProduct && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="text-primary font-medium">{t("المختار:", "Selected:")}</span>{" "}
            {selectedProduct.name_ar}
            {selectedSize && ` · ${selectedSize}`}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowVirtualLook(true)}>
              {t("نظرة افتراضية", "Virtual Look")}
            </Button>
            <Button size="sm" disabled={ordering} className="gap-1" onClick={createOrder}>
              <ShoppingBag className="h-3.5 w-3.5" />
              {ordering ? t("جاري...", "Ordering...") : t("اختيار هذا التصميم", "Order")}
            </Button>
          </div>
        </div>
      )}

      <AIChat
        messages={messages}
        onSend={callConcierge}
        onAction={handleAction}
        onProductSelect={handleProductSelect}
        onProductVirtualLook={(p) => {
          setSelectedProduct(p);
          setShowVirtualLook(true);
        }}
        onProductSize={(p) => {
          setSelectedProduct(p);
          setShowSizePanel(true);
        }}
        loading={loading}
        placeholder={t("أبغى عباية حمرا مفتوحة...", "I want an open red abaya...")}
        className="min-h-[480px]"
      />

      <div className="flex flex-wrap gap-2 pt-4 fashion-divider">
        <Link href="/customer/image-ai">
          <Button size="sm" variant="outline" className="gap-1">
            <ImageIcon className="h-3.5 w-3.5" />
            {t("تحليل صورة", "Image AI")}
          </Button>
        </Link>
        <Link href="/customer/tailors">
          <Button size="sm" variant="outline">{t("ابحث عن خياط", "Find Tailor")}</Button>
        </Link>
      </div>

      {showSizePanel && selectedProduct && (
        <SizeSelectionPanel
          product={selectedProduct}
          onClose={() => setShowSizePanel(false)}
          onConfirm={(size) => {
            setSelectedSize(size);
            setShowSizePanel(false);
            setMessages((m) => [
              ...m,
              {
                id: generateId(),
                role: "assistant",
                content: `تم اختيار المقاس ${size}. هل تريد مشاهدة كيف ستبدو عليك؟`,
                actions: ["نظرة افتراضية", "اختيار هذا التصميم"],
              },
            ]);
          }}
        />
      )}

      {showVirtualLook && selectedProduct && (
        <VirtualLookPanel
          product={selectedProduct}
          sizeLabel={selectedSize ?? undefined}
          onClose={() => setShowVirtualLook(false)}
          onOrder={() => {
            setShowVirtualLook(false);
            createOrder();
          }}
        />
      )}
    </div>
  );
}

export default function AIConciergePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">...</div>}>
      <AIConciergeContent />
    </Suspense>
  );
}
