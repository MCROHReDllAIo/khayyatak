import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOMR(amount: number, locale: "ar" | "en" = "ar"): string {
  const formatted = amount.toFixed(3);
  return locale === "ar" ? `${formatted} ر.ع` : `${formatted} OMR`;
}

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatDate(date: string, locale: "ar" | "en" = "ar"): string {
  const d = new Date(date);
  const day = d.getUTCDate();
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  if (locale === "ar") {
    return `${day} ${AR_MONTHS[month]} ${year}`;
  }
  return `${EN_MONTHS[month]} ${day}, ${year}`;
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import type { OrderStatus, OrderStatusStep } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";

export function getOrderTimeline(
  currentStatus: OrderStatus,
  createdAt: string
): OrderStatusStep[] {
  const statuses: OrderStatus[] = [
    "received",
    "measurements_confirmed",
    "cutting",
    "sewing",
    "embroidery",
    "ready",
    "delivered",
  ];
  const currentIndex = statuses.indexOf(currentStatus);
  const baseDate = new Date(createdAt);

  return statuses.map((status, index) => {
    const labels = ORDER_STATUS_LABELS[status];
    const stepDate = new Date(baseDate);
    stepDate.setDate(stepDate.getDate() + index);
    return {
      status,
      label_ar: labels.ar,
      label_en: labels.en,
      completed: index < currentIndex,
      current: index === currentIndex,
      date: index <= currentIndex ? stepDate.toISOString() : undefined,
    };
  });
}
