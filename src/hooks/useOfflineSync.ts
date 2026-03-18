import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OfflineOrder {
  id: string;
  shop_id: string;
  customer_phone: string;
  customer_name: string | null;
  total: number;
  status: string;
  items: any[];
  notes: string | null;
  created_at: string;
}

const STORAGE_KEY = "vee_offline_orders";

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOrders, setPendingOrders] = useState<OfflineOrder[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Load pending orders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setPendingOrders(JSON.parse(stored));
  }, []);

  // Save to localStorage whenever pendingOrders changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  // Listen for online/offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => {
      setIsOnline(false);
      toast({ title: "📡 You're offline", description: "Orders will be saved locally and synced when back online." });
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOrders.length > 0) {
      syncOrders();
    }
  }, [isOnline]);

  const saveOfflineOrder = useCallback((order: Omit<OfflineOrder, "id" | "created_at">) => {
    const offlineOrder: OfflineOrder = {
      ...order,
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    setPendingOrders(prev => [...prev, offlineOrder]);
    toast({ title: "💾 Order saved offline", description: `Will sync when internet returns. ${pendingOrders.length + 1} pending.` });
    return offlineOrder;
  }, [pendingOrders.length]);

  const syncOrders = useCallback(async () => {
    if (pendingOrders.length === 0 || syncing) return;
    setSyncing(true);
    let synced = 0;
    const remaining: OfflineOrder[] = [];

    for (const order of pendingOrders) {
      const { error } = await supabase.from("orders").insert({
        shop_id: order.shop_id,
        customer_phone: order.customer_phone,
        customer_name: order.customer_name,
        total: order.total,
        status: order.status,
        items: order.items,
        notes: order.notes ? `${order.notes} [Offline: ${order.created_at}]` : `[Offline: ${order.created_at}]`,
      });
      if (error) {
        remaining.push(order);
      } else {
        synced++;
        // Update stock for each item
        for (const item of order.items) {
          const { data: product } = await supabase.from("products").select("stock, quantity").eq("id", item.product_id || item.id).single();
          if (product) {
            const newStock = Math.max(0, (product.stock ?? product.quantity ?? 0) - (item.qty || item.quantity || 1));
            await supabase.from("products").update({ stock: newStock, quantity: newStock }).eq("id", item.product_id || item.id);
          }
        }
      }
    }

    setPendingOrders(remaining);
    setSyncing(false);
    if (synced > 0) {
      toast({ title: `✅ ${synced} order${synced > 1 ? "s" : ""} synced!`, description: remaining.length > 0 ? `${remaining.length} still pending` : "All caught up!" });
    }
  }, [pendingOrders, syncing]);

  return { isOnline, pendingOrders, syncing, saveOfflineOrder, syncOrders, pendingCount: pendingOrders.length };
};
