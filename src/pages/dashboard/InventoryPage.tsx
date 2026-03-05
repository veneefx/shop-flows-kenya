import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Boxes, Search, AlertTriangle, Package, TrendingDown, ArrowUpDown, Plus, Minus, Camera, X, ScanLine, Loader2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { getPreferredCameraId, requestNativeCameraPermission } from "@/lib/barcodeScanner";
import { logActivity } from "@/lib/activity";

const InventoryPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [shopId, setShopId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; name: string; stock: number; delta: string; reason: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase.from("products").select("*").eq("shop_id", shop.id).order("name");
        setProducts(data || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const startScanner = useCallback(async () => {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode("inventory-scanner");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decodedText) => {
          const found = products.find(p => p.sku === decodedText);
          if (found) {
            setSearch(decodedText);
            setAdjusting({ id: found.id, name: found.name, stock: found.stock, delta: "", reason: "" });
            toast({ title: `Found: ${found.name}`, description: `Current stock: ${found.stock}` });
          } else {
            setSearch(decodedText);
            toast({ title: "Product not found", description: `No product with SKU: ${decodedText}`, variant: "destructive" });
          }
          stopScanner();
        },
        () => {}
      );
    } catch {
      toast({ title: "Camera error", variant: "destructive" });
      setScanning(false);
    }
  }, [products]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const handleAdjust = async () => {
    if (!adjusting || !adjusting.delta) return;
    setSaving(true);
    const delta = parseInt(adjusting.delta);
    const newStock = Math.max(0, adjusting.stock + delta);
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", adjusting.id);
    setSaving(false);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === adjusting.id ? { ...p, stock: newStock } : p));
      toast({ title: `Stock updated: ${adjusting.name}`, description: `${adjusting.stock} → ${newStock} (${delta > 0 ? "+" : ""}${delta})` });
      setAdjusting(null);
    } else {
      toast({ title: "Error updating stock", variant: "destructive" });
    }
  };

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStock = products.filter(p => p.stock === 0);
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase()))
    .filter(p => filter === "all" ? true : filter === "low" ? (p.stock > 0 && p.stock <= 5) : p.stock === 0);

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Inventory</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{products.length} products · Stock value: KSh {totalValue.toLocaleString()}</p>
        </div>
        <button onClick={scanning ? stopScanner : startScanner}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${scanning ? "bg-red-500 text-white" : "bg-secondary text-foreground hover:bg-accent"}`}>
          {scanning ? <X size={16} /> : <Camera size={16} />}
          {scanning ? "Stop" : "Scan Barcode"}
        </button>
      </div>

      {/* Scanner */}
      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <ScanLine size={16} className="text-primary animate-pulse" />
                <p className="text-sm font-display font-semibold text-foreground">Point camera at barcode to adjust stock</p>
              </div>
              <div id="inventory-scanner" className="rounded-xl overflow-hidden" style={{ maxHeight: 280 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-border bg-secondary/50">
            {["Product", "SKU", "Stock", "Price", "Value", "Action"].map(h => (
              <p key={h} className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="grid grid-cols-6 gap-4 items-center px-5 py-3 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
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
              <button onClick={() => setAdjusting({ id: p.id, name: p.name, stock: p.stock, delta: "", reason: "" })}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-display font-semibold hover:bg-primary/20 transition-all w-fit">
                <Edit2 size={10} /> Adjust
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {adjusting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAdjusting(null)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">Adjust Stock</h2>
                <button onClick={() => setAdjusting(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="text-center py-2">
                <p className="font-display font-semibold text-foreground">{adjusting.name}</p>
                <p className="text-2xl font-display font-black text-primary mt-1">{adjusting.stock} units</p>
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Adjustment (+ to add, - to remove)
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAdjusting(prev => prev ? { ...prev, delta: String((parseInt(prev.delta) || 0) - 1) } : null)}
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"><Minus size={16} /></button>
                  <input type="number" value={adjusting.delta} onChange={e => setAdjusting(prev => prev ? { ...prev, delta: e.target.value } : null)}
                    className="flex-1 px-4 py-3 rounded-xl bg-background border border-input text-center text-lg font-display font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button onClick={() => setAdjusting(prev => prev ? { ...prev, delta: String((parseInt(prev.delta) || 0) + 1) } : null)}
                    className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"><Plus size={16} /></button>
                </div>
                {adjusting.delta && (
                  <p className="text-xs text-center text-muted-foreground font-body mt-2">
                    New stock: <span className="font-display font-bold text-foreground">{Math.max(0, adjusting.stock + (parseInt(adjusting.delta) || 0))}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Reason (optional)</label>
                <input value={adjusting.reason} onChange={e => setAdjusting(prev => prev ? { ...prev, reason: e.target.value } : null)} placeholder="e.g. New delivery, damaged, audit..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={handleAdjust} disabled={saving || !adjusting.delta}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpDown size={16} />}
                {saving ? "Updating..." : "Update Stock"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
