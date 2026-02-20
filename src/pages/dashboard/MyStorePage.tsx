import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Package, Globe, Copy, Eye, Edit2, ShoppingCart, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const MyStorePage = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: s } = await supabase.from("shops").select("*").eq("user_id", user.id).single();
      if (s) {
        setShop(s);
        const { data: p } = await supabase.from("products").select("*").eq("shop_id", s.id).eq("is_active", true).limit(8);
        setProducts(p || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const storeUrl = shop ? `${window.location.origin}/store/${shop.slug}` : "";

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "Store URL copied!" });
  };

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  if (!shop) return (
    <div className="text-center py-20">
      <Store size={40} className="text-muted-foreground mx-auto mb-4" />
      <p className="font-display font-semibold text-foreground">No store found</p>
      <p className="text-sm text-muted-foreground font-body mt-1">Go to Settings to set up your store</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">My Store</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{shop.shop_name}</p>
        </div>
        <a href={storeUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all">
          <ExternalLink size={15} /> View Live Store
        </a>
      </div>

      {/* Store URL */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={15} className="text-primary" />
          <p className="font-display font-semibold text-sm text-foreground">Your Public Store URL</p>
        </div>
        <div className="flex items-center gap-2 bg-background rounded-xl px-4 py-3 border border-input">
          <code className="text-xs font-mono text-primary flex-1 break-all">{storeUrl}</code>
          <button onClick={copyUrl} className="flex-shrink-0 text-xs font-display font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            <Copy size={14} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-body mt-2">Share this link on social media, WhatsApp, and anywhere your customers are</p>
      </div>

      {/* Store stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Package, label: "Active Products", value: products.length, color: "text-primary", bg: "bg-accent" },
          { icon: Eye, label: "Store Status", value: shop.is_active ? "Live" : "Offline", color: shop.is_active ? "text-primary" : "text-red-500", bg: shop.is_active ? "bg-accent" : "bg-red-50 dark:bg-red-500/10" },
          { icon: ShoppingCart, label: "Theme Color", value: shop.theme_color || "#22c55e", color: "text-foreground", bg: "bg-secondary" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl p-5 border border-border">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="font-display font-bold text-lg text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Product preview grid */}
      <div>
        <h3 className="font-display font-bold text-foreground mb-4">Store Products Preview</h3>
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
                className="bg-card rounded-xl border border-border overflow-hidden">
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
                  <p className="font-display font-bold text-primary text-sm mt-1">KSh {p.price.toLocaleString()}</p>
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
