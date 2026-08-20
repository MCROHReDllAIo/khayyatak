"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  imageUrl?: string;
}

interface AIChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onAction?: (action: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function AIChat({ messages, onSend, onAction, loading, placeholder, className }: AIChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
      return;
    }
    onSend(action);
  };

  return (
    <div className={cn("flex flex-col rounded-2xl border bg-white shadow-card overflow-hidden", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[420px] min-h-[320px]">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "user" ? "bg-navy text-white" : "bg-primary/10 text-primary"
              )}
            >
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn("flex-1", msg.role === "user" ? "text-end" : "")}>
              <div
                className={cn(
                  "inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line text-start",
                  msg.role === "user"
                    ? "bg-navy text-white rounded-ee-sm"
                    : "bg-omani-cream text-foreground rounded-es-sm"
                )}
              >
                {msg.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.imageUrl} alt="" className="mb-2 max-h-32 rounded-lg object-cover border border-white/20" />
                )}
                {msg.content}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.actions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleAction(action)}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            جاري التفكير...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder ?? "اكتب رسالتك..."}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
