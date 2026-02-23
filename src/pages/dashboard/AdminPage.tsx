import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X, Clock, Store, User, Crown, Loader2, DollarSign, Users, ShoppingBag, TrendingUp, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const [tab, setTab] = useState<"overview" | "pending" | "all" | "shops">("overview");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { setLoading(false); return; }
      setIsAdmin(true);

      const [subRes, shopRes, orderRes, profileRes] = await Promise.all([
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("shops").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
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
  const recentOrders = orders.slice(0, 8);

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
    return Object.entries(days).map(([date, count]) => ({ date, signups: count }));
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{pending.length} pending · {shops.length} shops · {profiles.length} users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["overview", "pending", "all", "shops"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all capitalize ${tab === t ? "bg-primary text-primary-foreground shadow-brand" : "bg-card border border-border text-muted-foreground"}`}>
            {t === "pending" ? `Pending (${pending.length})` : t === "all" ? "All Subs" : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} color="text-green-500" />
            <StatCard icon={Users} label="Active Users" value={profiles.length.toString()} color="text-blue-500" />
            <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length.toString()} color="text-purple-500" />
            <StatCard icon={Store} label="Active Shops" value={shops.filter(s => s.is_active).length.toString()} color="text-orange-500" />
          </div>

          {/* Charts + Recent orders */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Signups (Last 14 Days)</h3>
              <p className="text-xs text-muted-foreground font-body mb-4">New user registrations</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signupChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Line type="monotone" dataKey="signups" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-sm text-foreground">Recent Orders</h3>
                <span className="text-xs text-muted-foreground">{orders.length} total</span>
              </div>
              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-display font-semibold text-foreground text-xs">{o.customer_name || o.customer_phone}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-KE")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-xs text-foreground">KSh {(o.total || 0).toLocaleString()}</p>
                      <span className={`text-[10px] font-display font-semibold ${o.status === "paid" || o.status === "completed" ? "text-green-500" : o.status === "pending" ? "text-yellow-500" : "text-red-500"}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No orders yet</p>}
              </div>
            </div>
          </div>

          {/* Quick pending */}
          {pending.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-display font-bold text-sm text-foreground mb-4">⚡ Pending Approvals ({pending.length})</h3>
              <div className="space-y-3">
                {pending.slice(0, 3).map(sub => (
                  <SubCard key={sub.id} sub={sub} processing={processing} onApprove={approve} onReject={reject} />
                ))}
              </div>
            </div>
          )}
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
            <div key={shop.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                {shop.logo_url ? (
                  <img src={shop.logo_url} alt="" className="w-10 h-10 rounded-xl object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: shop.theme_color || "#22c55e" }}>
                    <Store size={18} className="text-white" />
                  </div>
                )}
                <div>
                  <p className="font-display font-bold text-sm text-foreground">{shop.shop_name}</p>
                  <p className="text-xs text-muted-foreground font-body">/store/{shop.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-display font-semibold ${shop.is_active ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-100 text-red-700"}`}>
                  {shop.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-muted-foreground font-body">{new Date(shop.created_at).toLocaleDateString("en-KE")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Stat card component
const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-card rounded-2xl border border-border p-5">
    <Icon size={20} className={`${color} mb-2`} />
    <p className="font-display font-black text-xl text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground font-body">{label}</p>
  </div>
);

// Subscription card component
const SubCard = ({ sub, processing, onApprove, onReject }: { sub: Sub; processing: string | null; onApprove: (s: Sub) => void; onReject: (s: Sub) => void }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <User size={18} className="text-primary" />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-foreground">{sub.profile?.email || "Unknown"}</p>
          <p className="text-xs text-muted-foreground font-body">{sub.profile?.full_name || "No name"}</p>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display font-semibold ${
        sub.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400" :
        sub.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
      }`}>
        {sub.status === "pending" && <Clock size={10} />}
        {sub.status === "active" && <Check size={10} />}
        {sub.status === "rejected" && <X size={10} />}
        {sub.status}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
      <div><p className="text-xs text-muted-foreground font-body uppercase">Plan</p><p className="font-display font-semibold text-foreground capitalize">{sub.plan}</p></div>
      <div><p className="text-xs text-muted-foreground font-body uppercase">Amount</p><p className="font-display font-semibold text-foreground">KSh {(sub.amount || 0).toLocaleString()}</p></div>
      <div><p className="text-xs text-muted-foreground font-body uppercase">Date</p><p className="font-display font-semibold text-foreground">{new Date(sub.created_at).toLocaleDateString("en-KE")}</p></div>
    </div>
    {sub.payment_proof && (
      <div className="mt-3"><a href={sub.payment_proof} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-display font-semibold">View Payment Proof →</a></div>
    )}
    {sub.status === "pending" && (
      <div className="flex gap-2 mt-4">
        <button onClick={() => onApprove(sub)} disabled={processing === sub.id}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60">
          {processing === sub.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
        </button>
        <button onClick={() => onReject(sub)} disabled={processing === sub.id}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-60">
          <X size={14} /> Reject
        </button>
      </div>
    )}
    {sub.expires_at && <p className="text-xs text-muted-foreground font-body mt-3">Expires: {new Date(sub.expires_at).toLocaleDateString("en-KE")}</p>}
  </motion.div>
);

export default AdminPage;
