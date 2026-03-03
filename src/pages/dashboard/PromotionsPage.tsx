import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Tag, Zap, Gift, Plus, X, Loader2, Trash2, Copy, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Promotion {
  id: string;
  type: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  coupon_code: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  discount: { icon: Tag, label: "Discount", color: "text-primary", bg: "bg-accent" },
  bundle: { icon: Gift, label: "Bundle", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
  flash_sale: { icon: Zap, label: "Flash Sale", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  coupon: { icon: Megaphone, label: "Coupon", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
};

const PromotionsPage = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [form, setForm] = useState({
    type: "discount", name: "", description: "", discount_type: "percentage",
    discount_value: "", min_order_amount: "", max_uses: "", coupon_code: "",
    ends_at: "",
  });

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase.from("promotions").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false });
        setPromotions((data as Promotion[]) || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(prev => ({ ...prev, coupon_code: code }));
  };

  const handleCreate = async () => {
    if (!shopId || !form.name || !form.discount_value) {
      toast({ title: "Name and discount value required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("promotions").insert({
      shop_id: shopId,
      type: form.type,
      name: form.name,
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      coupon_code: form.coupon_code || null,
      ends_at: form.ends_at || null,
      is_active: true,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setPromotions(prev => [data as Promotion, ...prev]);
      setShowForm(false);
      setForm({ type: "discount", name: "", description: "", discount_type: "percentage", discount_value: "", min_order_amount: "", max_uses: "", coupon_code: "", ends_at: "" });
      toast({ title: "Promotion created! 🎉" });
    } else {
      toast({ title: error?.message || "Error creating promotion", variant: "destructive" });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("promotions").update({ is_active: !current }).eq("id", id);
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
    toast({ title: current ? "Promotion paused" : "Promotion activated! ✅" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    await supabase.from("promotions").delete().eq("id", id);
    setPromotions(prev => prev.filter(p => p.id !== id));
    toast({ title: "Promotion deleted" });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Coupon code copied! 📋" });
  };

  const active = promotions.filter(p => p.is_active);
  const filtered = promotions
    .filter(p => filterType === "all" || p.type === filterType)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.coupon_code || "").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Promotions</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">Create discounts, bundles, flash sales & coupons</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all">
          <Plus size={16} /> New Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = promotions.filter(p => p.type === key && p.is_active).length;
          return (
            <div key={key} className="bg-card rounded-2xl p-5 border border-border">
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={cfg.color} />
              </div>
              <p className="font-display font-black text-2xl text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">Active {cfg.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search promotions or coupon codes..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2">
          {["all", "discount", "bundle", "flash_sale", "coupon"].map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              className={`px-3 py-2.5 rounded-xl text-xs font-display font-semibold capitalize transition-all ${filterType === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              {f === "flash_sale" ? "Flash Sale" : f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Megaphone size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-semibold text-foreground">No promotions yet</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Create your first promotion to drive sales</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((promo, i) => {
            const cfg = typeConfig[promo.type] || typeConfig.discount;
            const Icon = cfg.icon;
            const isExpired = promo.ends_at && new Date(promo.ends_at) < new Date();
            return (
              <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`bg-card rounded-2xl border border-border p-5 relative group ${!promo.is_active || isExpired ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(promo.id, promo.is_active)} className="text-muted-foreground hover:text-foreground">
                      {promo.is_active ? <ToggleRight size={20} className="text-primary" /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => handleDelete(promo.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-display font-bold text-sm text-foreground">{promo.name}</h3>
                {promo.description && <p className="text-xs text-muted-foreground font-body mt-0.5 line-clamp-2">{promo.description}</p>}

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-body">Value</span>
                    <span className="text-sm font-display font-black text-primary">
                      {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `KSh ${promo.discount_value.toLocaleString()}`} OFF
                    </span>
                  </div>
                  {promo.coupon_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-body">Code</span>
                      <button onClick={() => copyCode(promo.coupon_code!)} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs font-mono font-bold text-foreground hover:bg-accent transition-colors">
                        {promo.coupon_code} <Copy size={10} />
                      </button>
                    </div>
                  )}
                  {promo.max_uses && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-body">Uses</span>
                      <span className="text-xs font-display font-semibold text-foreground">{promo.used_count}/{promo.max_uses}</span>
                    </div>
                  )}
                  {promo.ends_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-body">{isExpired ? "Expired" : "Ends"}</span>
                      <span className={`text-xs font-display font-semibold ${isExpired ? "text-red-500" : "text-foreground"}`}>
                        {new Date(promo.ends_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-display font-semibold ${
                    isExpired ? "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400" :
                    promo.is_active ? "bg-accent text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {isExpired ? "Expired" : promo.is_active ? "Active" : "Paused"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">New Promotion</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>

              {/* Type selector */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(typeConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} onClick={() => setForm(prev => ({ ...prev, type: key }))}
                        className={`p-3 rounded-xl border text-center transition-all ${form.type === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <Icon size={18} className={`mx-auto ${cfg.color}`} />
                        <p className="font-display font-semibold text-[10px] text-foreground mt-1 capitalize">{cfg.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend Special 20% Off"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Discount Type</label>
                  <div className="flex gap-2">
                    {[["percentage", "%"], ["fixed", "KSh"]].map(([key, label]) => (
                      <button key={key} onClick={() => setForm(prev => ({ ...prev, discount_type: key }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-display font-semibold transition-all ${form.discount_type === key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Value *</label>
                  <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === "percentage" ? "e.g. 20" : "e.g. 500"}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Min Order (KSh)</label>
                  <input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              {(form.type === "coupon" || form.type === "discount") && (
                <div>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Coupon Code</label>
                  <div className="flex gap-2">
                    <input value={form.coupon_code} onChange={e => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20"
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-input text-sm font-mono font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase" />
                    <button onClick={generateCode} className="px-3 py-3 rounded-xl bg-secondary text-foreground text-xs font-display font-semibold hover:bg-accent transition-all">
                      Generate
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  {form.type === "flash_sale" ? "Sale Ends" : "Expires"} (optional)
                </label>
                <input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <button onClick={handleCreate} disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? "Creating..." : "Create Promotion"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromotionsPage;
