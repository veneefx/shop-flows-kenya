import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Boxes, Search, AlertTriangle, Package, TrendingDown, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const InventoryPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        const { data } = await supabase.from("products").select("*").eq("shop_id", shop.id).order("name");
        setProducts(data || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStock = products.filter(p => p.stock === 0);
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase()))
    .filter(p => filter === "all" ? true : filter === "low" ? (p.stock > 0 && p.stock <= 5) : p.stock === 0);

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Inventory</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{products.length} products · Stock value: KSh {totalValue.toLocaleString()}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Package, label: "Total Products", value: products.length, color: "text-primary", bg: "bg-accent" },
          { icon: AlertTriangle, label: "Low Stock", value: lowStock.length, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
          { icon: TrendingDown, label: "Out of Stock", value: outOfStock.length, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl p-5 border border-border">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-display font-semibold capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              {f === "out" ? "Out of Stock" : f === "low" ? "Low Stock" : "All"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Boxes size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-semibold text-foreground">No products found</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-border bg-secondary/50">
            {["Product", "SKU", "Stock", "Price", "Value"].map(h => (
              <p key={h} className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="grid grid-cols-5 gap-4 items-center px-5 py-3 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm font-display font-semibold text-foreground truncate">{p.name}</p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{p.sku || "—"}</p>
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-display font-semibold ${
                  p.stock === 0 ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" :
                  p.stock <= 5 ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" :
                  "bg-accent text-primary"
                }`}>{p.stock}</span>
              </div>
              <p className="text-sm font-display font-semibold text-foreground">KSh {p.price.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground font-body">KSh {(p.price * p.stock).toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
