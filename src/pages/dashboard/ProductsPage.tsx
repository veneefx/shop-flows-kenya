import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Plus, Search, Edit2, Trash2, Eye, EyeOff,
  Save, X, ChevronLeft, Loader2, Tag, Upload, Star, Camera, ScanLine
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  description: string | null;
  images: string[] | null;
  is_active: boolean | null;
  shop_id: string;
  sizes: string[] | null;
  colors: string[] | null;
  brand: string | null;
  sku: string | null;
  weight: string | null;
  is_featured: boolean | null;
  video_url: string | null;
  is_adult: boolean | null;
}

const ProductsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "", price: "", stock: "", category: "", description: "", image_url: "", is_active: true,
    sizes: "", colors: "", brand: "", sku: "", weight: "", is_featured: false,
    video_url: "", is_adult: false,
  });

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (!shop) { setLoading(false); return; }
      setShopId(shop.id);
      const { data } = await supabase.from("products").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false });
      setProducts((data as Product[]) || []);
      setLoading(false);
    };
    init();
  }, [user]);

  // Barcode scanner
  const startScanner = useCallback(async () => {
    // Request camera permission using browser-native getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(t => t.stop()); // Release immediately, html5-qrcode will re-acquire
    } catch (err) {
      toast({ title: "Camera permission denied", description: "Please enable camera in your browser settings (Site Settings → Camera → Allow).", variant: "destructive" });
      return;
    }

    setScanning(true);
    try {
      const scanner = new Html5Qrcode("barcode-scanner");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decodedText) => {
          const found = products.find(p => p.sku === decodedText || p.name.toLowerCase().includes(decodedText.toLowerCase()));
          if (found) {
            setSearch(decodedText);
            toast({ title: `Found: ${found.name}`, description: `SKU: ${found.sku || "N/A"} — Stock: ${found.stock}` });
          } else {
            setForm(prev => ({ ...prev, sku: decodedText }));
            setShowForm(true);
            toast({ title: "New barcode scanned", description: `SKU: ${decodedText} — Create a new product` });
          }
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      toast({ title: "Camera error", description: "Could not start camera scanner.", variant: "destructive" });
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

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", price: "", stock: "", category: "", description: "", image_url: "", is_active: true, sizes: "", colors: "", brand: "", sku: "", weight: "", is_featured: false, video_url: "", is_adult: false });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, price: String(p.price), stock: String(p.stock),
      category: p.category || "", description: p.description || "",
      image_url: p.images?.[0] || "", is_active: p.is_active ?? true,
      sizes: (p.sizes || []).join(", "), colors: (p.colors || []).join(", "),
      brand: p.brand || "", sku: p.sku || "", weight: p.weight || "",
      is_featured: p.is_featured ?? false,
      video_url: p.video_url || "", is_adult: p.is_adult ?? false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!shopId || !form.name || !form.price) {
      toast({ title: "Missing fields", description: "Name and price are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const sizesArr = form.sizes ? form.sizes.split(",").map(s => s.trim()).filter(Boolean) : [];
    const colorsArr = form.colors ? form.colors.split(",").map(s => s.trim()).filter(Boolean) : [];
    const payload = {
      name: form.name, price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0,
      category: form.category || null, description: form.description || null,
      images: form.image_url ? [form.image_url] : [], is_active: form.is_active, shop_id: shopId,
      sizes: sizesArr, colors: colorsArr, brand: form.brand || null,
      sku: form.sku || null, weight: form.weight || null, is_featured: form.is_featured,
      video_url: form.video_url || null, is_adult: form.is_adult,
    };
    if (editProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editProduct.id);
      if (!error) {
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...payload } : p));
        toast({ title: "Product updated!" });
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (!error && data) {
        setProducts(prev => [data as Product, ...prev]);
        toast({ title: "Product added!" });
      }
    }
    setSaving(false);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({ title: "Product deleted" });
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const toggleFeatured = async (p: Product) => {
    await supabase.from("products").update({ is_featured: !p.is_featured }).eq("id", p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_featured: !x.is_featured } : x));
    toast({ title: p.is_featured ? "Removed from featured" : "Marked as featured!" });
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Products</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{products.length} products in your store</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={scanning ? stopScanner : startScanner}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${scanning ? "bg-red-500 text-white" : "bg-secondary text-foreground hover:bg-accent"}`}>
            {scanning ? <X size={16} /> : <Camera size={16} />}
            {scanning ? "Stop Scan" : "Scan Barcode"}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Barcode Scanner */}
      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="bg-card rounded-2xl border border-border p-4 relative">
              <div className="flex items-center gap-2 mb-3">
                <ScanLine size={16} className="text-primary animate-pulse" />
                <p className="text-sm font-display font-semibold text-foreground">Point camera at barcode</p>
              </div>
              <div id="barcode-scanner" ref={scannerContainerRef} className="rounded-xl overflow-hidden" style={{ maxHeight: 280 }} />
              <p className="text-xs text-muted-foreground font-body mt-2">Scans barcodes & QR codes. If product exists, it's highlighted. If new, a product form opens with SKU pre-filled.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name, category, or SKU..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4"><Package size={28} className="text-muted-foreground" /></div>
          <p className="font-display font-semibold text-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Click "Add Product" or scan a barcode to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border overflow-hidden group hover:border-primary/40 hover:shadow-brand transition-all duration-300">
              <div className="relative h-48 bg-secondary overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package size={40} className="text-muted-foreground/30" /></div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <button onClick={() => openEdit(p)} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"><Edit2 size={15} /></button>
                  <button onClick={() => toggleActive(p)} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">{p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  <button onClick={() => toggleFeatured(p)} className={`w-9 h-9 rounded-xl ${p.is_featured ? "bg-yellow-500/60" : "bg-white/20"} hover:bg-yellow-500/80 flex items-center justify-center text-white`}><Star size={15} /></button>
                  <button onClick={() => handleDelete(p.id)} className="w-9 h-9 rounded-xl bg-red-500/60 hover:bg-red-500/80 flex items-center justify-center text-white"><Trash2 size={15} /></button>
                </div>
                {!p.is_active && <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-orange-500/90 text-white text-xs font-display font-semibold">Hidden</div>}
                {p.is_featured && <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500/90 text-white text-xs font-display font-semibold flex items-center gap-1"><Star size={10} />Featured</div>}
                {p.category && <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/80 text-white text-xs font-display font-semibold flex items-center gap-1"><Tag size={10} />{p.category}</div>}
              </div>
              <div className="p-4">
                <h3 className="font-display font-bold text-sm text-foreground truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">{p.description || "No description"}</p>
                {p.sku && <p className="text-[10px] text-muted-foreground font-body mt-0.5">SKU: {p.sku}</p>}
                {((p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0)) && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {p.sizes && p.sizes.length > 0 && <span className="text-xs text-muted-foreground">{p.sizes.length} sizes</span>}
                    {p.colors && p.colors.length > 0 && (
                      <div className="flex gap-0.5">{p.colors.slice(0, 4).map(c => <div key={c} className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display font-black text-primary text-base">KSh {p.price.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-display font-semibold ${p.stock > 0 ? "bg-accent text-accent-foreground" : "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400"}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-full max-w-md bg-card border-l border-border flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent"><ChevronLeft size={16} /></button>
                <h2 className="font-display font-bold text-foreground">{editProduct ? "Edit Product" : "Add Product"}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="flex-1 p-6 space-y-4">
              {/* Image */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Product Image</label>
                {form.image_url && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-secondary mb-3">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><X size={14} /></button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground font-display font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-60">
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                  <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste image URL..."
                    className="flex-1 px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { toast({ title: "Image too large (max 5MB)", variant: "destructive" }); return; }
                  setUploading(true);
                  const ext = file.name.split(".").pop();
                  const path = `${shopId}/${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from("product-images").upload(path, file);
                  if (error) { toast({ title: "Upload failed", variant: "destructive" }); setUploading(false); return; }
                  const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
                  setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
                  setUploading(false);
                  toast({ title: "Image uploaded!" });
                }} />
              </div>

              {/* Basic fields */}
              {[
                { label: "Product Name *", key: "name", type: "text", placeholder: "e.g. Samsung Galaxy A55" },
                { label: "Price (KSh) *", key: "price", type: "number", placeholder: "e.g. 45000" },
                { label: "Stock Quantity", key: "stock", type: "number", placeholder: "e.g. 10" },
                { label: "Category", key: "category", type: "text", placeholder: "e.g. Electronics" },
                { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Samsung (optional)" },
                { label: "SKU / Barcode", key: "sku", type: "text", placeholder: "e.g. SKU-001 or scanned barcode" },
                { label: "Weight", key: "weight", type: "text", placeholder: "e.g. 500g (optional)" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form] as string}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}

              {/* Variants */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Sizes (comma separated)</label>
                <input value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })}
                  placeholder="e.g. S, M, L, XL"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Colors (comma separated)</label>
                <input value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })}
                  placeholder="e.g. #000000, #ff0000"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                {form.colors && (
                  <div className="flex gap-1 mt-2">
                    {form.colors.split(",").map(c => c.trim()).filter(Boolean).map(c => (
                      <div key={c} className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed product description..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-primary" : "bg-muted"} relative`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-display font-medium text-foreground">Visible in store</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                    className={`w-11 h-6 rounded-full transition-colors ${form.is_featured ? "bg-yellow-500" : "bg-muted"} relative`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_featured ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-display font-medium text-foreground">⭐ Featured product</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm({ ...form, is_adult: !form.is_adult })}
                    className={`w-11 h-6 rounded-full transition-colors ${form.is_adult ? "bg-red-500" : "bg-muted"} relative`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_adult ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-display font-medium text-foreground">🔞 Adult product (18+)</span>
                </label>
              </div>

              {form.is_featured && (
                <div>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Video Ad URL (optional)</label>
                  <input type="url" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })}
                    placeholder="Paste a video URL..."
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  {form.video_url && (
                    <video src={form.video_url} className="w-full h-32 rounded-xl mt-2 object-cover bg-black" muted autoPlay loop playsInline />
                  )}
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : editProduct ? "Update Product" : "Add Product"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
