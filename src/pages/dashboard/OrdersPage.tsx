import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Search, Eye, Check, X, Clock, Phone, User, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
  items: any;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400",
  paid: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400",
  cancelled: "bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400",
};

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase.from("orders").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false });
        setOrders(data || []);
        
        // Subscribe to real-time updates for this shop's orders
        const channel = supabase
          .channel(`orders-${shop.id}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "orders", filter: `shop_id=eq.${shop.id}` },
            (payload) => {
              const updatedOrder = payload.new;
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
              setSelectedOrder(prev => prev?.id === updatedOrder.id ? updatedOrder : prev);
            }
          )
          .subscribe();
        
        return () => {
          supabase.removeChannel(channel);
        };
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (!error) {
      // Real-time subscription will handle the update, but also update locally for immediate feedback
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      setSelectedOrder(prev => prev?.id === id ? { ...prev, status } : prev);
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) || o.id.includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const fmt = (d: string) => new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Orders</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, customers, phones..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} className="text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Orders will appear here when customers buy from your store</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}>
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-sm text-foreground">{order.customer_name || "Anonymous"}</p>
                  <span className="text-xs text-muted-foreground font-body">{order.customer_phone}</span>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{fmt(order.created_at)} · #{order.id.slice(0, 8)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display font-bold text-sm text-foreground">KSh {order.total.toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-display font-semibold ${statusColors[order.status] || statusColors.pending}`}>{order.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order detail side panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-full max-w-md bg-card border-l border-border flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-bold text-foreground">Order #{selectedOrder.id.slice(0, 8)}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 p-6 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                <User size={16} className="text-muted-foreground" />
                <div>
                  <p className="font-display font-semibold text-sm text-foreground">{selectedOrder.customer_name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1"><Phone size={11} />{selectedOrder.customer_phone}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-secondary space-y-2">
                <p className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Items</p>
                {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm font-body">
                    <span className="text-foreground">{item.name} × {item.qty || item.quantity || 1}</span>
                    <span className="text-muted-foreground">KSh {((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString()}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground font-body">No items data</p>}
                <div className="border-t border-border pt-2 flex justify-between font-display font-bold text-sm">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">KSh {selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="p-4 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground font-body">{selectedOrder.notes}</p>
                </div>
              )}
              <div>
                <p className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {["pending", "paid", "failed", "cancelled"].map(s => (
                    <button key={s} onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`py-2.5 rounded-xl text-sm font-display font-semibold capitalize transition-all ${
                        selectedOrder.status === s ? "bg-primary text-primary-foreground shadow-brand" : "bg-secondary text-foreground hover:bg-accent"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
