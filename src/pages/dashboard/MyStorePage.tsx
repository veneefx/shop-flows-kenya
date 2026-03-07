import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store, Package, Globe, Copy, Eye, ShoppingCart,
  ExternalLink, TrendingUp, CheckCircle2, QrCode, Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const MyStorePage = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: s } = await supabase
        .from("shops").select("*").eq("user_id", user.id)
        .order("created_at").limit(1).maybeSingle();
      if (s) {
        setShop(s);
        const [{ data: p }, { data: o }] = await Promise.all([
          supabase.from("products").select("*").eq("shop_id", s.id).eq("is_active", true).limit(8),
          supabase.from("orders").select("id, total, status, created_at").eq("shop_id", s.id).order("created_at", { ascending: false }).limit(100),
        ]);
        setProducts(p || []);
        setOrders(o || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const storeUrl = shop ? `${window.location.origin}/store/${shop.slug}` : "";

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "✅ Store URL copied!", description: "Share it on WhatsApp, Instagram, or anywhere!" });
  };

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shop?.shop_name, url: storeUrl });
      } catch {}
    } else {
      copyUrl();
    }
  };

  const totalRevenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const paidOrders = orders.filter(o => o.status === "paid").length;
  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status === "paid";
  }).length;

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 rounded-xl bg-card border border-border animate-pulse" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />)}
      </div>
    </div>
  );

  if (!shop) return (
    <div className="text-center py-20">
      <Store size={40} className="text-muted-foreground mx-auto mb-4" />
      <p className="font-display font-semibold text-foreground">No store found</p>
      <p className="text-sm text-muted-foreground font-body mt-1">Go to Settings to set up your store</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">{shop.shop_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${shop.is_active ? "bg-primary" : "bg-red-500"}`} />
            <p className="text-muted-foreground font-body text-sm">{shop.is_active ? "Store is live" : "Store is offline"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={shareUrl}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-display font-semibold text-sm hover:bg-accent transition-all">
            <Share2 size={15} /> Share
          </button>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all">
            <ExternalLink size={15} /> View Live Store
          </a>
        </div>
      </div>

      {/* Store URL */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={15} className="text-primary" />
          <p className="font-display font-semibold text-sm text-foreground">Your Public Store URL</p>
        </div>
        <div className="flex items-center gap-2 bg-background rounded-xl px-4 py-3 border border-input">
          <code className="text-xs font-mono text-primary flex-1 break-all">{storeUrl}</code>
          <button onClick={() => setShowQr(!showQr)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Show QR code">
            <QrCode size={15} />
          </button>
          <button onClick={copyUrl}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Copy URL">
            <Copy size={15} />
          </button>
        </div>
        {showQr && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(storeUrl)}`}
              alt="QR Code"
              className="w-44 h-44 rounded-xl border border-border"
            />
            <p className="text-xs text-muted-foreground font-body">Scan to open store</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground font-body mt-2">
          Share this link on WhatsApp, Instagram, Facebook, and anywhere your customers are
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Active Products", value: products.length, color: "text-primary", bg: "bg-accent" },
          { icon: ShoppingCart, label: "Total Orders", value: paidOrders, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: TrendingUp, label: "This Month", value: `${thisMonth} orders`, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
          { icon: CheckCircle2, label: "Total Revenue", value: `KSh ${totalRevenue.toLocaleString()}`, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 border border-border hover:border-primary/20 transition-colors">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="font-display font-bold text-lg text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Product Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">Store Products Preview</h3>
          <a href="/dashboard/products" className="text-xs text-primary font-display font-semibold hover:underline flex items-center gap-1">
            <Eye size={12} /> Manage Products
          </a>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Package size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-sm text-foreground">No active products</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Add products in the Products section</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_16px_-4px_hsl(142_71%_45%/0.15)] transition-all">
                <div className="h-36 bg-secondary">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={24} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-display font-semibold text-xs text-foreground truncate">{p.name}</p>
                  <p className="font-display font-bold text-primary text-sm mt-1">KSh {Number(p.price).toLocaleString()}</p>
                  <p className={`text-[10px] font-body mt-0.5 ${p.stock < 5 ? "text-red-500" : "text-muted-foreground"}`}>
                    {p.stock < 5 ? `⚠ ${p.stock} left` : `${p.stock} in stock`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStorePage;
