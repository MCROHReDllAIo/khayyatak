"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Wand2,
  Loader2,
  Send,
  Sparkles,
  CheckCircle2,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InnovationDesignCanvas } from "@/components/innovation/InnovationDesignCanvas";
import { InnovationSpecPanel } from "@/components/innovation/InnovationSpecPanel";
import { InnovationChatPanel, type InnovationChatMessage } from "@/components/innovation/InnovationChatPanel";
import { generateId } from "@/lib/utils";
import type { InnovationDesignSpec, CustomDesignVersion, MaterialCheckResult } from "@/lib/innovation/types";
import { DEFAULT_INNOVATION_SPEC } from "@/lib/innovation/types";
import type { Tailor } from "@/types";

interface InnovationStudioProps {
  sessionId: string;
  onBack?: () => void;
  /** Prefill first collaboration message (from home AI innovate) */
  initialIdea?: string | null;
}

export function InnovationStudio({ sessionId, onBack, initialIdea }: InnovationStudioProps) {
  const [spec, setSpec] = useState<InnovationDesignSpec>(DEFAULT_INNOVATION_SPEC);
  const [versions, setVersions] = useState<CustomDesignVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<CustomDesignVersion | null>(null);
  const [messages, setMessages] = useState<InnovationChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "مرحبًا في ابتكار! صفي فكرتك — لون، قصة، أكمام، تطريز — ونبني التصميم معًا.\n\nمثال: «أبغى عباية سوداء مفتوحة، واسعة، تطريز ذهبي بسيط»",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [materialResults, setMaterialResults] = useState<MaterialCheckResult[]>();
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const [aiVizUrl, setAiVizUrl] = useState<string | undefined>();
  const [viewAngle, setViewAngle] = useState<"front" | "back" | "side">("front");
  const [showSubmit, setShowSubmit] = useState(false);

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/customer/innovation/${sessionId}`);
    const data = await res.json();
    if (data.currentVersion) {
      setSpec(data.currentVersion.spec);
      setCurrentVersion(data.currentVersion);
      setVersions(data.versions ?? []);
      setAiVizUrl(data.currentVersion.ai_visualization_url);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((d) => setTailors(d.tailors ?? []));
  }, [loadSession]);

  const sendMessage = async (text: string, imageDataUrl?: string) => {
    setMessages((m) => [...m, { id: generateId(), role: "user", content: text }]);
    setLoading(true);

    try {
      const history = messages.filter((m) => m.role === "user").map((m) => m.content);
      const res = await fetch(`/api/customer/innovation/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, imageDataUrl, history: [...history, text] }),
      });
      const data = await res.json();

      if (data.spec) setSpec(data.spec);
      if (data.version) {
        setCurrentVersion(data.version);
        setVersions((v) => [...v.filter((x) => x.version_number !== data.version.version_number), data.version]);
      }

      setMessages((m) => [
        ...m,
        {
          id: generateId(),
          role: "assistant",
          content: data.reply + (data.disclaimer ? `\n\n_${data.disclaimer}_` : ""),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: generateId(), role: "assistant", content: "حدث خطأ. حاول مرة أخرى." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const seededRef = useRef(false);
  useEffect(() => {
    if (!initialIdea?.trim() || seededRef.current) return;
    seededRef.current = true;
    const timer = window.setTimeout(() => {
      void sendMessage(initialIdea.trim());
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once when studio opens
  }, [initialIdea, sessionId]);

  const checkMaterials = async () => {
    setLoading(true);
    const res = await fetch(`/api/customer/innovation/${sessionId}/material-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tailorIds: selectedStore ? [selectedStore] : undefined }),
    });
    const data = await res.json();
    setMaterialResults(data.results);
    setLoading(false);
  };

  const runVisualization = async () => {
    setVisualizing(true);
    const res = await fetch(`/api/customer/innovation/${sessionId}/visualize`, { method: "POST" });
    const data = await res.json();
    setVisualizing(false);
    if (data.status === "success" && data.imageUrl) {
      setAiVizUrl(data.imageUrl);
    } else if (data.status === "BLOCKED_BY_PROVIDER") {
      setMessages((m) => [
        ...m,
        {
          id: generateId(),
          role: "assistant",
          content: `معاينة AI غير مفعلة.\n${data.detail ?? data.message}\nEnv: INNOVATION_IMAGE_PROVIDER_KEY`,
        },
      ]);
    }
  };

  const submitToStore = async () => {
    if (!selectedStore) return;
    setSubmitting(true);
    const res = await fetch(`/api/customer/innovation/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: selectedStore }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setShowSubmit(false);
      setMessages((m) => [
        ...m,
        {
          id: generateId(),
          role: "assistant",
          content: data.message ?? "تم الإرسال. بانتظار رد المتجر — لن نختلق ردًا.",
        },
      ]);
    }
  };

  const restoreVersion = async (versionNumber: number) => {
    const res = await fetch(`/api/customer/innovation/${sessionId}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionNumber }),
    });
    const data = await res.json();
    if (data.version) {
      setSpec(data.version.spec);
      setCurrentVersion(data.version);
      await loadSession();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-navy">ابتكار</h1>
          </div>
          <p className="text-xs text-muted-foreground">استوديو التصميم التCollaborative</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>رجوع</Button>
          )}
          <Button variant="outline" size="sm" onClick={checkMaterials} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "تحقق من المواد"}
          </Button>
          <Button variant="outline" size="sm" onClick={runVisualization} disabled={visualizing}>
            {visualizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            معاينة AI
          </Button>
          <Button size="sm" className="gap-1" onClick={() => setShowSubmit(true)} disabled={submitted}>
            <Send className="h-3.5 w-3.5" /> إرسال للمتجر
          </Button>
          <a href="/customer/innovation/requests">
            <Button size="sm" variant="ghost">طلباتي</Button>
          </a>
        </div>
      </div>

      {versions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {versions.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => restoreVersion(v.version_number)}
              className={`shrink-0 text-[10px] px-3 py-1.5 rounded-full border ${
                currentVersion?.version_number === v.version_number
                  ? "bg-primary text-white border-primary"
                  : "border-muted hover:border-primary"
              }`}
            >
              v{v.version_number}: {v.change_summary_ar?.slice(0, 20)}
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-4 min-h-[520px]">
        <div className="lg:col-span-4 order-1">
          <InnovationChatPanel messages={messages} loading={loading} onSend={sendMessage} className="min-h-[420px]" />
        </div>
        <div className="lg:col-span-5 order-2">
          <InnovationDesignCanvas
            spec={spec}
            viewAngle={viewAngle}
            onViewChange={setViewAngle}
            aiVisualizationUrl={aiVizUrl}
          />
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            نظرة 3D حقيقية غير متوفرة — المعاينة structured 2D فقط. Three.js/GLTF مطلوب.
          </p>
        </div>
        <div className="lg:col-span-3 order-3">
          <InnovationSpecPanel spec={spec} version={currentVersion ?? undefined} materialResults={materialResults} />
        </div>
      </div>

      {showSubmit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-navy flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> جاهزة للإرسال؟
            </h2>
            <p className="text-xs text-muted-foreground">
              الخياط يقرر إمكانية التنفيذ — AI لا يؤكد التصنيع.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-medium">اختر المتجر</p>
              {tailors.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedStore(t.id)}
                  className={`w-full text-start text-sm rounded-xl border p-3 flex items-center gap-2 ${
                    selectedStore === t.id ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                >
                  <Store className="h-4 w-4 text-primary shrink-0" />
                  <span>{t.name_ar}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmit(false)}>تعديل</Button>
              <Button
                className="flex-1 gap-1"
                disabled={!selectedStore || submitting}
                onClick={submitToStore}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
