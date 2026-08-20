"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AIInsightCardProps {
  title?: string;
  message: string;
  type?: "demand" | "inventory" | "pricing" | "customer" | "general";
  className?: string;
}

export function AIInsightCard({ title, message, className }: AIInsightCardProps) {
  const { t } = useLocale();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-transparent", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-1">
                {title ?? t("توقع AI", "AI Insight")}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
