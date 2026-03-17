import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X, Clock, Store, User, Crown, Loader2, DollarSign, Users, ShoppingBag, TrendingUp, BarChart3, Eye, EyeOff, Filter, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Sub {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount: number | null;
  payment_proof: string | null;
  created_at: string;
  expires_at: string | null;
  approved_at: string | null;
  profile?: { full_name: string | null; email: string | null };
}

const AdminPage = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "orders" | "pending" | "all" | "shops">("overview");
  const [orderFilter, setOrderFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { setLoading(false); return; }
      setIsAdmin(true);

      const [subRes, shopRes, orderRes, profileRes] = await Promise.all([
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("shops").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      ]);

      if (subRes.data) {
        const enriched = await Promise.all(subRes.data.map(async (s: any) => {
          const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("user_id", s.user_id).maybeSingle();
          return { ...s, profile };
        }));
        setSubs(enriched);
      }
      setShops(shopRes.data || []);
      setOrders(orderRes.data || []);
      setProfiles(profileRes.data || []);
      setLoading(false);
    };
    init();
  }, [user]);

  const approve = async (sub: Sub) => {
    setProcessing(sub.id);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await supabase.from("subscriptions").update({
      status: "active", approved_at: new Date().toISOString(),
      approved_by: user!.id, expires_at: expiresAt.toISOString(),
    }).eq("id", sub.id);
    await supabase.from("profiles").update({ plan: sub.plan }).eq("user_id", sub.user_id);
    setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: "active", approved_at: new Date().toISOString(), expires_at: expiresAt.toISOString() } : s));
    setProcessing(null);
    toast({ title: `${sub.profile?.email || "User"} approved for ${sub.plan}` });
  };

  const reject = async (sub: Sub) => {
    setProcessing(sub.id);
    await supabase.from("subscriptions").update({ status: "rejected" }).eq("id", sub.id);
    setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: "rejected" } : s));
    setProcessing(null);
    toast({ title: "Subscription rejected" });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: `Order status updated to ${newStatus}` });
    } catch (err) {
      toast({ title: "Failed to update order", variant: "destructive" });
    }
  };

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  if (!isAdmin) return (
    <div className="text-center py-20">
      <Shield size={40} className="text-muted-foreground mx-auto mb-4" />
      <p className="font-display font-semibold text-foreground">Admin Access Required</p>
      <p className="text-sm text-muted-foreground font-body mt-1">You don't have admin privileges.</p>
    </div>
  );

  const pending = subs.filter(s => s.status === "pending");
  const activeSubs = subs.filter(s => s.status === "active");
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const paidOrders = orders.filter(o => o.status === "paid" || o.status === "completed");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const failedOrders = orders.filter(o => o.status === "failed" || o.status === "cancelled");

  // Filter orders based on filter and search
  const filteredOrders = orders.filter(o => {
    const matchesFilter = orderFilter === "all" || 
      (orderFilter === "paid" && (o.status === "paid" || o.status === "completed")) ||
      (orderFilter === "pending" && o.status === "pending") ||
      (orderFilter === "failed" && (o.status === "failed" || o.status === "cancelled"));
    
    const matchesSearch = searchTerm === "" || 
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_phone?.includes(searchTerm) ||
      o.id.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  // Revenue chart data (last 14 days)
  const revenueChart = (() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" })] = 0;
    }
    orders.forEach(o => {
      if (o.status === "paid" || o.status === "completed") {
        const d = new Date(o.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
        if (d in days) days[d] += o.total || 0;
      }
    });
    return Object.entries(days).map(([date, revenue]) => ({ date, revenue }));
  })();

  // Signup chart data (last 14 days)
  const signupChart = (() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" })] = 0;
    }
    profiles.forEach(p => {
      const d = new Date(p.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
      if (d in days) days[d]++;
    });
    return Object.entries(days).map(([date, signups]) => ({ date, signups }));
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-3xl lg:text-4xl text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground font-body text-sm mt-2">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-display font-semibold text-foreground">Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-border pb-4">
        {(["overview", "orders", "pending", "all", "shops"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-display font-semibold transition-all capitalize border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "pending" ? `Pending (${pending.length})` : t === "all" ? "All Subs" : t === "orders" ? "Orders" : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              icon={DollarSign} 
              label="Total Revenue" 
              value={`KSh ${totalRevenue.toLocaleString()}`} 
              subtext={`${paidOrders.length} paid orders`}
              color="bg-green-500/10 text-green-600 dark:text-green-400" 
            />
            <MetricCard 
              icon={ShoppingBag} 
              label="Total Orders" 
              value={orders.length.toString()} 
              subtext={`${pendingOrders.length} pending`}
              color="bg-blue-500/10 text-blue-600 dark:text-blue-400" 
            />
            <MetricCard 
              icon={Users} 
              label="Active Users" 
              value={profiles.length.toString()} 
              subtext={`${activeSubs.length} subscribed`}
              color="bg-purple-500/10 text-purple-600 dark:text-purple-400" 
            />
            <MetricCard 
              icon={Store} 
              label="Active Shops" 
              value={shops.filter(s => s.is_active).length.toString()} 
              subtext={`${shops.length} total`}
              color="bg-orange-500/10 text-orange-600 dark:text-orange-400" 
            />
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground">Revenue Trend</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">Last 14 days</p>
                </div>
                <TrendingUp size={20} className="text-green-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Signups Chart */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground">New Signups</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">Last 14 days</p>
                </div>
                <Users size={20} className="text-blue-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={signupChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {pending.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-200 dark:border-yellow-500/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-yellow-900 dark:text-yellow-400">⚡ Pending Approvals</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-body mt-1">{pending.length} subscription{pending.length !== 1 ? 's' : ''} awaiting approval</p>
                </div>
              </div>
              <div className="space-y-3">
                {pending.slice(0, 3).map(sub => (
                  <SubCard key={sub.id} sub={sub} processing={processing} onApprove={approve} onReject={reject} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === "orders" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex gap-2">
              {(["all", "paid", "pending", "failed"] as const).map(f => (
                <button key={f} onClick={() => setOrderFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all capitalize ${orderFilter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                  {f === "paid" ? "Paid" : f === "pending" ? "Pending" : f === "failed" ? "Failed" : "All"}
                </button>
              ))}
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
              <Search size={16} className="text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by name, phone, or order ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left font-display font-semibold text-foreground">Order ID</th>
                    <th className="px-6 py-4 text-left font-display font-semibold text-foreground">Customer</th>
                    <th className="px-6 py-4 text-left font-display font-semibold text-foreground">Amount</th>
                    <th className="px-6 py-4 text-left font-display font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left font-display font-semibold text-foreground">Date</th>
                    <th className="px-6 py-4 text-left font-display font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-body">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-display font-semibold text-foreground text-xs">{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-display font-semibold text-foreground text-sm">{order.customer_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground font-body">{order.customer_phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-display font-bold text-foreground">KSh {(order.total || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-display font-semibold ${
                            order.status === "paid" || order.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                            order.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400" :
                            "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-body">{new Date(order.created_at).toLocaleDateString("en-KE")}</td>
                        <td className="px-6 py-4">
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded bg-muted border border-border text-foreground font-display font-semibold cursor-pointer hover:border-primary transition-colors"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PENDING / ALL TABS */}
      {(tab === "pending" || tab === "all") && (
        <div className="space-y-3">
          {(tab === "pending" ? pending : subs).length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground">No {tab} subscriptions</p>
            </div>
          ) : (tab === "pending" ? pending : subs).map(sub => (
            <SubCard key={sub.id} sub={sub} processing={processing} onApprove={approve} onReject={reject} />
          ))}
        </div>
      )}

      {/* SHOPS TAB */}
      {tab === "shops" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map(shop => (
            <div key={shop.id} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                {shop.logo_url ? (
                  <img src={shop.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: shop.theme_color || "#22c55e" }}>
                    <Store size={20} className="text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-display font-bold text-foreground">{shop.shop_name}</p>
                  <p className="text-xs text-muted-foreground font-body">/store/{shop.slug}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full font-display font-semibold ${shop.is_active ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"}`}>
                    {shop.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">{new Date(shop.created_at).toLocaleDateString("en-KE")}</span>
                </div>
                {shop.description && <p className="text-xs text-muted-foreground font-body line-clamp-2">{shop.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, subtext, color }: { icon: any; label: string; value: string; subtext: string; color: string }) => (
  <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} mb-4`}>
      <Icon size={24} />
    </div>
    <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">{label}</p>
    <p className="font-display font-black text-2xl text-foreground mt-2">{value}</p>
    <p className="text-xs text-muted-foreground font-body mt-1">{subtext}</p>
  </div>
);

// Subscription Card Component
const SubCard = ({ sub, processing, onApprove, onReject }: { sub: Sub; processing: string | null; onApprove: (s: Sub) => void; onReject: (s: Sub) => void }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-all">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <User size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-display font-bold text-foreground">{sub.profile?.email || "Unknown"}</p>
          <p className="text-xs text-muted-foreground font-body">{sub.profile?.full_name || "No name"}</p>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-display font-semibold ${
        sub.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400" :
        sub.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
      }`}>
        {sub.status === "pending" && <Clock size={12} />}
        {sub.status === "active" && <Check size={12} />}
        {sub.status === "rejected" && <X size={12} />}
        {sub.status}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
      <div><p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Plan</p><p className="font-display font-semibold text-foreground capitalize mt-1">{sub.plan}</p></div>
      <div><p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Amount</p><p className="font-display font-semibold text-foreground mt-1">KSh {(sub.amount || 0).toLocaleString()}</p></div>
      <div><p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Date</p><p className="font-display font-semibold text-foreground mt-1">{new Date(sub.created_at).toLocaleDateString("en-KE")}</p></div>
    </div>
    {sub.payment_proof && (
      <div className="mb-4"><a href={sub.payment_proof} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-display font-semibold">View Payment Proof →</a></div>
    )}
    {sub.status === "pending" && (
      <div className="flex gap-2">
        <button onClick={() => onApprove(sub)} disabled={processing === sub.id}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex-1">
          {processing === sub.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
        </button>
        <button onClick={() => onReject(sub)} disabled={processing === sub.id}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-60 flex-1">
          <X size={14} /> Reject
        </button>
      </div>
    )}
    {sub.expires_at && <p className="text-xs text-muted-foreground font-body mt-4">Expires: {new Date(sub.expires_at).toLocaleDateString("en-KE")}</p>}
  </motion.div>
);

export default AdminPage;
