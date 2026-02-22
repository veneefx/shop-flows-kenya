import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X, Clock, Store, User, Crown, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      // Check admin role
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { setLoading(false); return; }
      setIsAdmin(true);

      // Fetch all subscriptions
      const { data: subData } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
      
      // Fetch profiles for each
      if (subData) {
        const enriched = await Promise.all(subData.map(async (s: any) => {
          const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("user_id", s.user_id).maybeSingle();
          return { ...s, profile };
        }));
        setSubs(enriched);
      }

      // Fetch all shops
      const { data: shopData } = await supabase.from("shops").select("*").order("created_at", { ascending: false });
      setShops(shopData || []);
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

    // Update profile plan
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
  const display = tab === "pending" ? pending : subs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{pending.length} pending approvals · {shops.length} total shops</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all ${tab === "pending" ? "bg-primary text-primary-foreground shadow-brand" : "bg-card border border-border text-muted-foreground"}`}>
          Pending ({pending.length})
        </button>
        <button onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all ${tab === "all" ? "bg-primary text-primary-foreground shadow-brand" : "bg-card border border-border text-muted-foreground"}`}>
          All Subscriptions
        </button>
      </div>

      {/* Subscription list */}
      <div className="space-y-3">
        {display.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground">No {tab} subscriptions</p>
          </div>
        ) : display.map(sub => (
          <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-5">
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
              <div className="text-right">
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
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase">Plan</p>
                <p className="font-display font-semibold text-foreground capitalize">{sub.plan}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase">Amount</p>
                <p className="font-display font-semibold text-foreground">KSh {(sub.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase">Date</p>
                <p className="font-display font-semibold text-foreground">{new Date(sub.created_at).toLocaleDateString("en-KE")}</p>
              </div>
            </div>

            {sub.payment_proof && (
              <div className="mt-3">
                <a href={sub.payment_proof} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-display font-semibold">View Payment Proof →</a>
              </div>
            )}

            {sub.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => approve(sub)} disabled={processing === sub.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm hover:bg-brand-light transition-all disabled:opacity-60">
                  {processing === sub.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                </button>
                <button onClick={() => reject(sub)} disabled={processing === sub.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-60">
                  <X size={14} /> Reject
                </button>
              </div>
            )}

            {sub.expires_at && (
              <p className="text-xs text-muted-foreground font-body mt-3">Expires: {new Date(sub.expires_at).toLocaleDateString("en-KE")}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Shops overview */}
      <div>
        <h2 className="font-display font-bold text-foreground mb-4">All Shops ({shops.length})</h2>
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
      </div>
    </div>
  );
};

export default AdminPage;
