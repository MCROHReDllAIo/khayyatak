"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MotionConfig } from "framer-motion";
import { LocaleProvider } from "./locale-context";
import type {
  Profile,
  UserRole,
  DesignConfig,
  Measurements,
  Order,
  SavedDesign,
  Notification,
  InventoryItem,
  TailorProduct,
  MarketingCampaign,
  AgentLogEntry,
  StylePreferenceEvent,
} from "@/types";
import { DEFAULT_DESIGN } from "@/lib/constants/defaults";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AuthProviderKind } from "@/lib/auth/config";
import { signOut as signOutAction } from "@/lib/actions/auth";

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authLoading: boolean;
  authConfigured: boolean;
  authProvider: AuthProviderKind;
  /** @deprecated use authConfigured */
  supabaseConfigured: boolean;
  refreshProfile: () => Promise<void>;
}

interface AppStateContextType {
  design: DesignConfig;
  setDesign: (design: DesignConfig) => void;
  resetDesign: () => void;
  savedDesigns: SavedDesign[];
  saveDesign: (name?: string) => Promise<SavedDesign | null>;
  loadDesign: (id: string) => void;
  duplicateDesign: (id: string) => Promise<SavedDesign | null>;
  deleteDesign: (id: string) => Promise<void>;
  measurements: Measurements | null;
  setMeasurements: (m: Measurements | null) => Promise<void>;
  deleteMeasurements: () => Promise<void>;
  selectedTailorId: string | null;
  setSelectedTailorId: (id: string | null) => void;
  favoriteTailorIds: string[];
  toggleFavoriteTailor: (id: string) => Promise<void>;
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "created_at" | "updated_at">) => Promise<Order | null>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  reorderFromOrder: (orderId: string) => Promise<Order | null>;
  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<void>;
  inventory: InventoryItem[];
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  products: TailorProduct[];
  addProduct: (product: Omit<TailorProduct, "id" | "created_at">) => Promise<TailorProduct | null>;
  updateProduct: (id: string, updates: Partial<TailorProduct>) => Promise<void>;
  campaigns: MarketingCampaign[];
  addCampaign: (c: Omit<MarketingCampaign, "id" | "created_at">) => Promise<MarketingCampaign | null>;
  updateCampaign: (id: string, updates: Partial<MarketingCampaign>) => Promise<void>;
  agentLogs: AgentLogEntry[];
  addAgentLog: (entry: Omit<AgentLogEntry, "id" | "created_at">) => void;
  approveAgentLog: (id: string) => void;
  styleEvents: StylePreferenceEvent[];
  recordStyleEvent: (event: Omit<StylePreferenceEvent, "timestamp">) => void;
  tryOnPreview: string | null;
  setTryOnPreview: (url: string | null) => void;
  pendingIntentDesign: DesignConfig | null;
  setPendingIntentDesign: (d: DesignConfig | null) => void;
  dataLoading: boolean;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AppStateContext = createContext<AppStateContextType | null>(null);

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: row.email as string,
    full_name: (row.full_name as string) ?? (row.email as string),
    full_name_ar: (row.full_name_ar as string) ?? undefined,
    role: row.role as UserRole,
    city_id: (row.city_id as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    avatar_url: (row.avatar_url as string) ?? undefined,
    created_at: row.created_at as string,
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  const designRow = row.designs as { config?: DesignConfig } | null;
  const measRow = row.measurements as Measurements | null;
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    tailor_id: row.tailor_id as string,
    design: designRow?.config ?? DEFAULT_DESIGN,
    measurements: measRow ?? undefined,
    status: row.status as Order["status"],
    total_price: Number(row.total_price ?? 0),
    delivery_days: Number(row.delivery_days ?? 3),
    delivery_address: (row.delivery_address as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) ?? (row.created_at as string),
    customer_name: (row.customer_name as string) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState<AuthProviderKind>("none");
  const [authConfiguredState, setAuthConfiguredState] = useState(isSupabaseConfigured());
  const supabaseConfigured = isSupabaseConfigured();
  const authConfigured = authConfiguredState;

  const loadProfile = useCallback(async () => {
    if (supabaseConfigured) {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setUser(null);
        setAuthLoading(false);
        return;
      }
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setAuthLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
      setUser(data ? mapProfile(data) : null);
      setAuthLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
      const data = (await res.json()) as { profile?: Profile | null };
      setUser(data.profile ? mapProfile(data.profile as unknown as Record<string, unknown>) : null);
    } catch {
      setUser(null);
    }
    setAuthLoading(false);
  }, [supabaseConfigured]);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      setAuthLoading(true);

      if (supabaseConfigured) {
        setAuthProvider("supabase");
        setAuthConfiguredState(true);
        if (!cancelled) await loadProfile();
        return;
      }

      try {
        const [configRes, sessionRes] = await Promise.all([
          fetch("/api/auth/config", { credentials: "include", cache: "no-store" }),
          fetch("/api/auth/session", { credentials: "include", cache: "no-store" }),
        ]);
        const config = (await configRes.json()) as { provider?: AuthProviderKind; configured?: boolean };
        const session = (await sessionRes.json()) as { profile?: Profile | null };

        if (cancelled) return;

        setAuthProvider(config.provider ?? "none");
        setAuthConfiguredState(Boolean(config.configured));
        setUser(session.profile ? mapProfile(session.profile as unknown as Record<string, unknown>) : null);
      } catch {
        if (!cancelled) {
          setAuthProvider("none");
          setAuthConfiguredState(false);
          setUser(null);
        }
      }

      if (!cancelled) setAuthLoading(false);
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [supabaseConfigured, loadProfile]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const logout = useCallback(async () => {
    if (authProvider === "postgres") {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    } else {
      const supabase = getBrowserSupabase();
      if (supabase) await supabase.auth.signOut();
    }
    setUser(null);
    await signOutAction();
  }, [authProvider]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        logout,
        isAuthenticated: !!user,
        authLoading,
        authConfigured,
        authProvider,
        supabaseConfigured: authConfigured,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [design, setDesignState] = useState<DesignConfig>(DEFAULT_DESIGN);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [measurements, setMeasurementsState] = useState<Measurements | null>(null);
  const [selectedTailorId, setSelectedTailorIdState] = useState<string | null>(null);
  const [favoriteTailorIds, setFavoriteTailorIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<TailorProduct[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLogEntry[]>([]);
  const [styleEvents, setStyleEvents] = useState<StylePreferenceEvent[]>([]);
  const [tryOnPreview, setTryOnPreviewState] = useState<string | null>(null);
  const [pendingIntentDesign, setPendingIntentDesign] = useState<DesignConfig | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const refreshData = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !user) {
      setSavedDesigns([]);
      setMeasurementsState(null);
      setOrders([]);
      setNotifications([]);
      setInventory([]);
      setProducts([]);
      setCampaigns([]);
      setFavoriteTailorIds([]);
      return;
    }

    setDataLoading(true);
    try {
      const [designsRes, measRes, notifRes, favRes] = await Promise.all([
        supabase.from("designs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("measurements").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("favorites").select("tailor_id").eq("user_id", user.id),
      ]);

      setSavedDesigns(
        (designsRes.data ?? []).map((d) => ({
          id: d.id,
          name: d.name ?? "تصميم",
          design: (d.config as DesignConfig) ?? DEFAULT_DESIGN,
          created_at: d.created_at,
          updated_at: d.created_at,
        }))
      );

      const meas = measRes.data?.[0];
      setMeasurementsState(
        meas
          ? {
              id: meas.id,
              user_id: meas.user_id,
              height: Number(meas.height),
              chest: Number(meas.chest),
              waist: Number(meas.waist),
              shoulder: Number(meas.shoulder),
              sleeve: Number(meas.sleeve),
              dishdasha_length: Number(meas.dishdasha_length),
              confidence: Number(meas.confidence ?? 1),
              is_ai_estimate: meas.is_ai_estimate ?? false,
              created_at: meas.created_at,
            }
          : null
      );

      setNotifications((notifRes.data ?? []) as Notification[]);
      setFavoriteTailorIds((favRes.data ?? []).map((f) => f.tailor_id));

      if (user.role === "customer") {
        const { data: orderRows } = await supabase
          .from("orders")
          .select("*, designs(config), measurements(*)")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });
        setOrders((orderRows ?? []).map((r) => mapOrder(r as Record<string, unknown>)));
      } else if (user.role === "tailor") {
        const { data: tailorRow } = await supabase.from("tailors").select("id").eq("profile_id", user.id).maybeSingle();
        if (tailorRow) {
          setSelectedTailorIdState(tailorRow.id);
          const [{ data: orderRows }, { data: inv }, { data: prods }] = await Promise.all([
            supabase.from("orders").select("*, designs(config), measurements(*)").eq("tailor_id", tailorRow.id).order("created_at", { ascending: false }),
            supabase.from("inventory").select("*").eq("tailor_id", tailorRow.id),
            supabase.from("products").select("*").eq("tailor_id", tailorRow.id),
          ]);
          setOrders((orderRows ?? []).map((r) => mapOrder(r as Record<string, unknown>)));
          setInventory((inv ?? []) as InventoryItem[]);
          setProducts(
            (prods ?? []).map((p) => ({
              id: p.id,
              tailor_id: p.tailor_id,
              name_ar: p.name_ar,
              description_ar: p.description_ar ?? "",
              category: p.category ?? "",
              tags: p.tags ?? [],
              price: Number(p.price ?? 0),
              fabric: p.fabric ?? "",
              style: p.style ?? "",
              occasion: p.occasion ?? "",
              published: p.published ?? false,
              created_at: p.created_at,
            }))
          );
        }
      } else if (user.role === "admin") {
        const { data: orderRows } = await supabase
          .from("orders")
          .select("*, designs(config), measurements(*)")
          .order("created_at", { ascending: false })
          .limit(100);
        setOrders((orderRows ?? []).map((r) => mapOrder(r as Record<string, unknown>)));
      }
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setDesign = useCallback((d: DesignConfig) => setDesignState(d), []);
  const resetDesign = useCallback(() => setDesignState(DEFAULT_DESIGN), []);

  const saveDesign = useCallback(
    async (name?: string) => {
      const supabase = getBrowserSupabase();
      if (!supabase || !user) return null;
      const payload = {
        user_id: user.id,
        name: name ?? design.name ?? `${design.color} ${design.fabric}`,
        config: design,
      };
      const { data, error } = await supabase.from("designs").insert(payload).select().single();
      if (error || !data) return null;
      const saved: SavedDesign = {
        id: data.id,
        name: data.name,
        design: data.config as DesignConfig,
        created_at: data.created_at,
        updated_at: data.created_at,
      };
      setSavedDesigns((prev) => [saved, ...prev]);
      return saved;
    },
    [design, user]
  );

  const loadDesign = useCallback(
    (id: string) => {
      const found = savedDesigns.find((s) => s.id === id);
      if (found) setDesignState(found.design);
    },
    [savedDesigns]
  );

  const duplicateDesign = useCallback(
    async (id: string) => {
      const found = savedDesigns.find((s) => s.id === id);
      if (!found) return saveDesign();
      return saveDesign(`${found.name} (نسخة)`);
    },
    [savedDesigns, saveDesign]
  );

  const deleteDesign = useCallback(async (id: string) => {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.from("designs").delete().eq("id", id);
    setSavedDesigns((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const setMeasurements = useCallback(
    async (m: Measurements | null) => {
      const supabase = getBrowserSupabase();
      if (!supabase || !user || !m) {
        setMeasurementsState(m);
        return;
      }
      const payload = {
        user_id: user.id,
        height: m.height,
        chest: m.chest,
        waist: m.waist,
        shoulder: m.shoulder,
        sleeve: m.sleeve,
        dishdasha_length: m.dishdasha_length,
        confidence: m.confidence,
        is_ai_estimate: m.is_ai_estimate,
      };
      const { data, error } = m.id
        ? await supabase.from("measurements").update(payload).eq("id", m.id).select().single()
        : await supabase.from("measurements").insert(payload).select().single();
      if (!error && data) {
        setMeasurementsState({ ...m, id: data.id, user_id: user.id, created_at: data.created_at });
      } else {
        setMeasurementsState(m);
      }
    },
    [user]
  );

  const deleteMeasurements = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (supabase && measurements?.id) {
      await supabase.from("measurements").delete().eq("id", measurements.id);
    }
    setMeasurementsState(null);
  }, [measurements]);

  const toggleFavoriteTailor = useCallback(
    async (id: string) => {
      const supabase = getBrowserSupabase();
      if (!supabase || !user) return;
      if (favoriteTailorIds.includes(id)) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("tailor_id", id);
        setFavoriteTailorIds((prev) => prev.filter((x) => x !== id));
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, tailor_id: id });
        setFavoriteTailorIds((prev) => [...prev, id]);
      }
    },
    [user, favoriteTailorIds]
  );

  const addOrder = useCallback(
    async (order: Omit<Order, "id" | "created_at" | "updated_at">) => {
      const supabase = getBrowserSupabase();
      if (!supabase || !user) return null;

      let designId: string | null = null;
      const { data: designRow } = await supabase
        .from("designs")
        .insert({ user_id: user.id, name: order.design.name ?? "طلب", config: order.design })
        .select("id")
        .single();
      designId = designRow?.id ?? null;

      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_id: order.customer_id,
          tailor_id: order.tailor_id,
          design_id: designId,
          measurement_id: measurements?.id ?? null,
          status: order.status,
          total_price: order.total_price,
          delivery_days: order.delivery_days,
          delivery_address: order.delivery_address,
          customer_name: order.customer_name,
          payment_status: "pending",
        })
        .select("*, designs(config), measurements(*)")
        .single();

      if (error || !data) return null;

      await supabase.from("order_status_history").insert({
        order_id: data.id,
        status: order.status,
        note: "Order created",
      });

      const mapped = mapOrder(data as Record<string, unknown>);
      setOrders((prev) => [mapped, ...prev]);

      await supabase.from("notifications").insert({
        user_id: user.id,
        title_ar: "طلب جديد",
        title_en: "New order",
        message_ar: `تم إنشاء طلب #${data.id.slice(0, 8)}`,
        message_en: `Order #${data.id.slice(0, 8)} created`,
      });

      return mapped;
    },
    [user, measurements]
  );

  const updateOrder = useCallback(
    async (id: string, updates: Partial<Order>) => {
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.total_price !== undefined) dbUpdates.total_price = updates.total_price;

      const { data, error } = await supabase
        .from("orders")
        .update(dbUpdates)
        .eq("id", id)
        .select("*, designs(config), measurements(*)")
        .single();

      if (error || !data) return;

      if (updates.status) {
        await supabase.from("order_status_history").insert({
          order_id: id,
          status: updates.status,
          note: "Status updated",
        });
      }

      const mapped = mapOrder(data as Record<string, unknown>);
      setOrders((prev) => prev.map((o) => (o.id === id ? mapped : o)));
    },
    []
  );

  const reorderFromOrder = useCallback(
    async (orderId: string): Promise<Order | null> => {
      const source = orders.find((o) => o.id === orderId);
      if (!source || !user) return null;
      setDesignState(source.design);
      if (source.measurements) setMeasurementsState(source.measurements);
      setSelectedTailorIdState(source.tailor_id);
      return addOrder({
        customer_id: user.id,
        tailor_id: source.tailor_id,
        design: source.design,
        measurements: source.measurements,
        status: "received",
        total_price: source.total_price,
        delivery_days: source.delivery_days,
        delivery_address: source.delivery_address,
        customer_name: source.customer_name,
      });
    },
    [orders, user, addOrder]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const updateInventoryItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.from("inventory").update(updates).eq("id", id);
    setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, "id">) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data } = await supabase.from("inventory").insert(item).select().single();
    if (data) setInventory((prev) => [...prev, data as InventoryItem]);
  }, []);

  const deleteInventoryItem = useCallback(async (id: string) => {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.from("inventory").delete().eq("id", id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addProduct = useCallback(
    async (product: Omit<TailorProduct, "id" | "created_at">) => {
      const supabase = getBrowserSupabase();
      if (!supabase) return null;
      const { data } = await supabase.from("products").insert(product).select().single();
      if (!data) return null;
      const p = data as TailorProduct;
      setProducts((prev) => [p, ...prev]);
      return p;
    },
    []
  );

  const updateProduct = useCallback(async (id: string, updates: Partial<TailorProduct>) => {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.from("products").update(updates).eq("id", id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const addCampaign = useCallback(async (c: Omit<MarketingCampaign, "id" | "created_at">) => {
    setCampaigns((prev) => [{ ...c, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev]);
    return { ...c, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  }, []);

  const updateCampaign = useCallback(async (id: string, updates: Partial<MarketingCampaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const addAgentLog = useCallback((entry: Omit<AgentLogEntry, "id" | "created_at">) => {
    setAgentLogs((prev) => [{ ...entry, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev].slice(0, 30));
  }, []);

  const approveAgentLog = useCallback((id: string) => {
    setAgentLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: "approved" as const } : l)));
  }, []);

  const recordStyleEvent = useCallback((event: Omit<StylePreferenceEvent, "timestamp">) => {
    setStyleEvents((prev) => [{ ...event, timestamp: new Date().toISOString() }, ...prev].slice(0, 100));
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        design,
        setDesign,
        resetDesign,
        savedDesigns,
        saveDesign,
        loadDesign,
        duplicateDesign,
        deleteDesign,
        measurements,
        setMeasurements,
        deleteMeasurements,
        selectedTailorId,
        setSelectedTailorId: setSelectedTailorIdState,
        favoriteTailorIds,
        toggleFavoriteTailor,
        orders,
        addOrder,
        updateOrder,
        reorderFromOrder,
        notifications,
        markNotificationRead,
        inventory,
        updateInventoryItem,
        addInventoryItem,
        deleteInventoryItem,
        products,
        addProduct,
        updateProduct,
        campaigns,
        addCampaign,
        updateCampaign,
        agentLogs,
        addAgentLog,
        approveAgentLog,
        styleEvents,
        recordStyleEvent,
        tryOnPreview,
        setTryOnPreview: setTryOnPreviewState,
        pendingIntentDesign,
        setPendingIntentDesign,
        dataLoading,
        refreshData,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AppStateProvider>
          <MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>
            {children}
          </MotionConfig>
        </AppStateProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
