"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InnovationChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface InnovationChatPanelProps {
  messages: InnovationChatMessage[];
  loading?: boolean;
  onSend: (text: string, imageDataUrl?: string) => void;
  className?: string;
}

export function InnovationChatPanel({ messages, loading, onSend, className }: InnovationChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onSend(input.trim() || "حلل هذه الصورة", reader.result as string);
    reader.readAsDataURL(file);
    setInput("");
  };

  return (
    <div className={cn("flex flex-col rounded-2xl border bg-white shadow-card overflow-hidden h-full", className)}>
      <div className="border-b px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">AI Design Partner</p>
        <p className="text-[10px] text-muted-foreground">شريك تصميم — ليس تأكيد تنفيذ</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
              msg.role === "user" ? "bg-navy text-white" : "bg-primary/10 text-primary"
            )}>
              {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className={cn(
              "rounded-xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-line",
              msg.role === "user" ? "bg-navy text-white" : "bg-omani-cream"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري التحديث...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-2 flex gap-1">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImage(f);
        }} />
        <Button type="button" size="sm" variant="ghost" className="shrink-0 text-xs px-2" onClick={() => fileRef.current?.click()}>
          📷
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="صف تعديلك..."
          disabled={loading}
          className="text-sm h-9"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
