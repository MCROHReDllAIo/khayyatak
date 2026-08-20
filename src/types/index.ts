export type UserRole = "customer" | "tailor" | "admin";

export type Locale = "ar" | "en";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  role: UserRole;
  city_id?: string;
  city?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface City {
  id: string;
  name_ar: string;
  name_en: string;
  tailor_count: number;
  lat: number;
  lng: number;
}

export type TailorAvailabilityStatus =
  | "available_now"
  | "accepting_orders"
  | "busy"
  | "paused";

export interface TailorService {
  id: string;
  name_ar: string;
  name_en?: string;
  category?: string;
  starting_price?: number;
}

export interface Tailor {
  id: string;
  profile_id: string;
  name_ar: string;
  name_en: string;
  city_id: string;
  city: string;
  rating: number;
  review_count: number;
  starting_price: number;
  delivery_days: number;
  specializations: string[];
  specializations_ar: string[];
  verified: boolean;
  cover_image?: string;
  description_ar: string;
  description_en: string;
  gallery: string[];
  availability_status?: TailorAvailabilityStatus;
  services?: TailorService[];
}

export interface TailorRailItem {
  id: string;
  profile_id: string;
  name_ar: string;
  name_en: string;
  city_id: string;
  city: string;
  rating: number;
  review_count: number;
  starting_price: number;
  delivery_days: number;
  specializations: string[];
  verified: boolean;
  cover_image?: string;
  availability_status: TailorAvailabilityStatus;
  portfolio_preview: string[];
}

export interface Fabric {
  id: string;
  name_ar: string;
  name_en: string;
  type: string;
  price_per_meter: number;
  color: string;
  season: "summer" | "winter" | "all";
}

export type GarmentType = "dishdasha" | "abaya";

export interface DesignConfig {
  garmentType: GarmentType;
  color: string;
  colorKey: string;
  fabric: string;
  fabricKey: string;
  collar: string;
  collarKey: string;
  embroidery: string;
  embroideryKey: string;
  fit?: string;
  fitKey?: string;
  sleeves?: string;
  sleevesKey?: string;
  buttons?: string;
  buttonsKey?: string;
  length?: string;
  lengthKey?: string;
  name?: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  design: DesignConfig;
  created_at: string;
  updated_at: string;
}

export interface TailorProduct {
  id: string;
  tailor_id: string;
  name_ar: string;
  description_ar: string;
  category: string;
  tags: string[];
  price: number;
  fabric: string;
  style: string;
  occasion: string;
  published: boolean;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  tailor_id: string;
  name: string;
  audience: string;
  offer: string;
  message_ar: string;
  channel: string;
  timing: string;
  active: boolean;
  created_at: string;
}

export interface AgentLogEntry {
  id: string;
  agent: string;
  action: string;
  reason: string;
  status: "pending" | "approved" | "dismissed" | "completed";
  created_at: string;
}

export interface StylePreferenceEvent {
  colorKey?: string;
  fabricKey?: string;
  fitKey?: string;
  garmentType?: GarmentType;
  occasion?: string;
  timestamp: string;
}

export interface Measurements {
  id?: string;
  user_id?: string;
  height: number;
  chest: number;
  waist: number;
  shoulder: number;
  sleeve: number;
  dishdasha_length: number;
  confidence: number;
  is_ai_estimate: boolean;
  created_at?: string;
}

export interface StyleRecommendation {
  garmentType: GarmentType;
  color: string;
  colorKey: string;
  fabric: string;
  fabricKey: string;
  collar: string;
  collarKey: string;
  embroidery: string;
  embroideryKey: string;
  style: string;
  message_ar: string;
  message_en: string;
  reasons_ar: string[];
  reasons_en: string[];
}

export interface TailorMatch {
  tailor: Tailor;
  score: number;
  reasons_ar: string[];
  reasons_en: string[];
}

export interface Order {
  id: string;
  customer_id: string;
  tailor_id: string;
  design: DesignConfig;
  measurements?: Measurements;
  status: OrderStatus;
  total_price: number;
  delivery_days: number;
  delivery_address?: string;
  created_at: string;
  updated_at: string;
  tailor?: Tailor;
  customer_name?: string;
}

export type OrderStatus =
  | "received"
  | "measurements_confirmed"
  | "cutting"
  | "sewing"
  | "embroidery"
  | "ready"
  | "delivered";

export interface OrderStatusStep {
  status: OrderStatus;
  label_ar: string;
  label_en: string;
  completed: boolean;
  current: boolean;
  date?: string;
}

export interface Review {
  id: string;
  tailor_id: string;
  customer_name: string;
  rating: number;
  comment_ar: string;
  comment_en: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  tailor_id: string;
  fabric_name_ar: string;
  fabric_name_en: string;
  current_stock: number;
  unit: string;
  consumption_rate: number;
  ai_forecast_days: number;
  ai_recommendation_ar: string;
  ai_recommendation_en: string;
  low_stock: boolean;
}

export interface PricingInput {
  fabric_cost: number;
  labor_hours: number;
  labor_rate: number;
  embroidery_cost: number;
  accessories_cost: number;
  desired_profit_percent: number;
}

export interface PricingRecommendation {
  recommended_price: number;
  estimated_margin: number;
  market_min: number;
  market_max: number;
  reason_ar: string;
  reason_en: string;
}

export interface BusinessInsight {
  id: string;
  message_ar: string;
  message_en: string;
  type: "demand" | "inventory" | "pricing" | "customer" | "general";
  priority: "high" | "medium" | "low";
}

export interface Notification {
  id: string;
  user_id: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  read: boolean;
  created_at: string;
}

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  profile: Profile;
  tailor?: Tailor;
}

export const ORDER_STATUS_LABELS: Record<
  OrderStatus,
  { ar: string; en: string }
> = {
  received: { ar: "تم استلام الطلب", en: "Order Received" },
  measurements_confirmed: {
    ar: "تم تأكيد القياسات",
    en: "Measurements Confirmed",
  },
  cutting: { ar: "جاري القص", en: "Cutting" },
  sewing: { ar: "جاري التفصيل", en: "Sewing" },
  embroidery: { ar: "جاري التطريز", en: "Embroidery" },
  ready: { ar: "جاهز للاستلام", en: "Ready for Pickup" },
  delivered: { ar: "تم التسليم", en: "Delivered" },
};

export const GARMENT_TYPES = [
  { key: "dishdasha" as const, ar: "دشداشة عمانية", en: "Omani Dishdasha" },
  { key: "abaya" as const, ar: "عباية", en: "Abaya" },
];

export const DESIGN_ABAYA_STYLES = [
  { key: "classic", ar: "كلاسيكية", en: "Classic" },
  { key: "butterfly", ar: "فراشة", en: "Butterfly" },
  { key: "kimono", ar: "كيمونو", en: "Kimono" },
  { key: "modern", ar: "عصرية", en: "Modern" },
];

export const DESIGN_COLORS = [
  { key: "white", ar: "أبيض", en: "White", hex: "#FFFFFF" },
  { key: "offwhite", ar: "أوف وايت", en: "Off White", hex: "#F5F0E8" },
  { key: "beige", ar: "بيج", en: "Beige", hex: "#D4C4A8" },
  { key: "black", ar: "أسود", en: "Black", hex: "#1A1A1A" },
  { key: "navy", ar: "كحلي", en: "Navy", hex: "#0B132B" },
  { key: "gray", ar: "رمادي", en: "Gray", hex: "#6B7280" },
];

export const DESIGN_FABRICS = [
  { key: "cotton", ar: "قطني", en: "Cotton" },
  { key: "linen", ar: "كتان", en: "Linen" },
  { key: "premium", ar: "فاخر", en: "Premium" },
  { key: "summer", ar: "صيفي", en: "Summer" },
  { key: "winter", ar: "شتوي", en: "Winter" },
];

export const DESIGN_COLLARS = [
  { key: "classic", ar: "كلاسيكية", en: "Classic" },
  { key: "emirati", ar: "إماراتية", en: "Emirati" },
  { key: "omani", ar: "عمانية", en: "Omani" },
  { key: "modern", ar: "عصرية", en: "Modern" },
];

export const DESIGN_EMBROIDERY = [
  { key: "none", ar: "بدون", en: "None" },
  { key: "minimal", ar: "بسيط", en: "Minimal" },
  { key: "gold", ar: "ذهبي", en: "Gold" },
  { key: "silver", ar: "فضي", en: "Silver" },
  { key: "traditional", ar: "تراثي", en: "Traditional" },
];
