"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { OrderStatusStep } from "@/types";
import { formatDate, cn } from "@/lib/utils";

interface OrderTimelineProps {
  steps: OrderStatusStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => (
        <motion.div
          key={step.status}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex gap-4 pb-8 last:pb-0"
        >
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute start-[15px] top-8 w-0.5 h-[calc(100%-16px)]",
                step.completed ? "bg-primary" : "bg-border"
              )}
            />
          )}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              step.current
                ? "border-primary bg-primary text-white shadow-glow"
                : step.completed
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground"
            )}
          >
            {step.completed && !step.current ? (
              <Check className="h-4 w-4" />
            ) : step.current ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="h-2.5 w-2.5 rounded-full bg-white"
              />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p
              className={cn(
                "font-medium",
                step.current ? "text-primary" : step.completed ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label_ar}
            </p>
            {step.date && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(step.date, "ar")}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
