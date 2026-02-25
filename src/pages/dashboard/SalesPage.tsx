import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Receipt, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string; name: string; price: number; qty: number; image?: string;
}

const SalesPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [payMethod, setPayMethod] = useState<"cash" | "mpesa">("cash");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase.from("products").select("*").eq("shop_id", shop.id).eq("is_active", true);
        setProducts(data || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const addToCart = (p: any) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === p.id);
      if (exists) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, image: p.images?.[0] }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const placeOrder = async () => {
    if (!shopId || cart.length === 0) return;
    if (!customerPhone.trim()) { toast({ title: "Enter customer phone", variant: "destructive" }); return; }
    setPlacing(true);
    const { error } = await supabase.from("orders").insert({
      shop_id: shopId,
      customer_phone: customerPhone,
      customer_name: customerName || null,
      total,
      status: payMethod === "cash" ? "paid" : "pending",
      items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty })),
      notes: discount > 0 ? `Discount: KSh ${discount}` : null,
    });
    setPlacing(false);
    if (!error) {
      toast({ title: "✅ Order placed!", description: `KSh ${total.toLocaleString()} — ${payMethod.toUpperCase()}` });
      setCart([]); setCustomerPhone(""); setCustomerName(""); setDiscount(0);
    } else {
      toast({ title: "Error placing order", variant: "destructive" });
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-black text-2xl text-foreground">Sales Terminal</h1>
          <span className="text-xs text-muted-foreground font-body">{products.length} products</span>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products or scan barcode..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filtered.map(p => (
            <motion.button key={p.id} whileTap={{ scale: 0.95 }} onClick={() => addToCart(p)}
              className="bg-card rounded-xl border border-border p-3 text-left hover:border-primary/50 hover:shadow-md transition-all group">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt="" className="w-full h-20 object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full h-20 rounded-lg bg-secondary flex items-center justify-center mb-2">
                  <ShoppingCart size={20} className="text-muted-foreground" />
                </div>
              )}
              <p className="font-display font-semibold text-xs text-foreground truncate">{p.name}</p>
              <p className="font-display font-bold text-sm text-primary mt-0.5">KSh {p.price.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground font-body">{p.stock} in stock</p>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-sm text-muted-foreground font-body">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart panel */}
      <div className="w-80 xl:w-96 flex-shrink-0 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary" />
          <h2 className="font-display font-bold text-sm text-foreground">Cart ({cart.length})</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-body">Tap products to add</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-semibold text-foreground truncate">{item.name}</p>
                <p className="text-xs text-primary font-display font-bold">KSh {(item.price * item.qty).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-background flex items-center justify-center hover:bg-accent transition-colors"><Minus size={12} /></button>
                <span className="w-6 text-center text-xs font-display font-bold text-foreground">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-background flex items-center justify-center hover:bg-accent transition-colors"><Plus size={12} /></button>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        {/* Checkout area */}
        <div className="p-3 border-t border-border space-y-2">
          <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Customer phone *"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional)"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <input type="number" value={discount || ""} onChange={e => setDiscount(Number(e.target.value))} placeholder="Discount (KSh)"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />

          <div className="flex gap-2">
            {([["cash", Banknote, "Cash"], ["mpesa", Smartphone, "M-Pesa"]] as const).map(([key, Icon, label]) => (
              <button key={key} onClick={() => setPayMethod(key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display font-semibold transition-all ${payMethod === key ? "bg-primary text-primary-foreground shadow-brand" : "bg-secondary text-foreground"}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          <div className="flex justify-between py-2 border-t border-border">
            <span className="text-xs text-muted-foreground font-body">Subtotal</span>
            <span className="text-xs font-display font-semibold text-foreground">KSh {subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-xs text-red-400 font-body">Discount</span>
              <span className="text-xs font-display font-semibold text-red-400">-KSh {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-sm font-display font-bold text-foreground">Total</span>
            <span className="text-sm font-display font-black text-primary">KSh {total.toLocaleString()}</span>
          </div>

          <button onClick={placeOrder} disabled={placing || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-50">
            {placing ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
            {placing ? "Processing..." : "Complete Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
