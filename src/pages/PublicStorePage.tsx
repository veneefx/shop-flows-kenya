import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, Package, Filter, X, Plus, Minus,
  ChevronLeft, Phone, User, CreditCard, CheckCircle, Loader2, Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

const PublicStorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "confirm" | "done">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const init = async () => {
      const { data: s } = await supabase.from("shops").select("*").eq("slug", slug).eq("is_active", true).single();
      if (!s) { setLoading(false); return; }
      setShop(s);
      const { data: p } = await supabase.from("products").select("*").eq("shop_id", s.id).eq("is_active", true).order("created_at", { ascending: false });
      setProducts(p || []);
      setLoading(false);
    };
    init();
  }, [slug]);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || p.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1, image: product.images?.[0] }];
    });
    toast({ title: `${product.name} added to cart` });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (!customerPhone) { toast({ title: "Phone number required", variant: "destructive" }); return; }
    if (cart.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    setSubmitting(true);
    const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
    const { data: order, error } = await supabase.from("orders").insert({
      shop_id: shop.id, customer_name: customerName || null, customer_phone: customerPhone,
      items, total: cartTotal, status: "pending", notes: paymentMethod === "cash" ? "Cash on delivery" : "M-Pesa STK Push",
    }).select().single();

    if (error) { toast({ title: "Error placing order", variant: "destructive" }); setSubmitting(false); return; }

    if (paymentMethod === "mpesa") {
      const phone = mpesaPhone || customerPhone;
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lipana-stk-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ phone, amount: cartTotal, orderId: order.id, shopId: shop.id }),
        });
        const data = await resp.json();
        if (!resp.ok) toast({ title: data.error || "M-Pesa prompt failed — check your Lipana keys", variant: "destructive" });
        else toast({ title: "M-Pesa prompt sent! Check your phone." });
      } catch { toast({ title: "STK push failed", variant: "destructive" }); }
    }

    setSubmitting(false);
    setCheckoutStep("done");
    setCart([]);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={32} className="text-primary animate-spin" />
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
      <div>
        <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
          <Package size={36} className="text-muted-foreground" />
        </div>
        <h1 className="font-display font-black text-2xl text-foreground">Store Not Found</h1>
        <p className="text-muted-foreground font-body mt-2">This store doesn't exist or is currently offline.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.shop_name} className="w-9 h-9 rounded-xl object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: shop.theme_color || "hsl(142 71% 45%)" }}>
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-base text-foreground">{shop.shop_name}</h1>
              {shop.description && <p className="text-xs text-muted-foreground font-body truncate max-w-48">{shop.description}</p>}
            </div>
          </div>
          <button onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all">
            <ShoppingCart size={16} />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-sm font-display font-semibold whitespace-nowrap capitalize transition-all ${
                    category === cat ? "bg-primary text-primary-foreground shadow-brand" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}>
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="font-display font-semibold text-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border overflow-hidden group hover:border-primary/40 hover:shadow-brand transition-all duration-400 cursor-pointer"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative h-52 bg-secondary overflow-hidden">
                  {product.images?.[0] ? (
                    <motion.img
                      src={product.images[0]} alt={product.name}
                      className="w-full h-full object-cover"
                      animate={hoveredProduct === product.id ? { scale: 1.08, rotateY: 3 } : { scale: 1, rotateY: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={48} className="text-muted-foreground/20" />
                    </div>
                  )}
                  {product.category && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-white text-xs font-display font-semibold flex items-center gap-1">
                      <Tag size={10} />{product.category}
                    </div>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-black/80 text-white text-sm font-display font-semibold">Out of Stock</span>
                    </div>
                  )}
                  {/* Quick add overlay on hover */}
                  <AnimatePresence>
                    {hoveredProduct === product.id && product.stock > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-3 left-3 right-3"
                      >
                        <button onClick={() => addToCart(product)}
                          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light transition-all">
                          Add to Cart
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-sm text-foreground">{product.name}</h3>
                  {product.description && <p className="text-xs text-muted-foreground font-body mt-0.5 line-clamp-2">{product.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display font-black text-primary text-base">KSh {product.price.toLocaleString()}</span>
                    {product.stock > 0 && (
                      <button onClick={() => addToCart(product)}
                        className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-display font-semibold text-xs hover:bg-primary hover:text-primary-foreground transition-all">
                        <Plus size={12} className="inline mr-1" />Add
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart button (bottom right) */}
      {cartCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-2xl hover:bg-brand-light transition-all"
          style={{ boxShadow: "0 8px 32px hsl(142 71% 45% / 0.5)" }}
        >
          <ShoppingCart size={18} />
          {cartCount} item{cartCount > 1 ? "s" : ""} · KSh {cartTotal.toLocaleString()}
        </motion.button>
      )}

      {/* Cart / Checkout slide panel */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-card border-l border-border"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  {checkoutStep !== "cart" && checkoutStep !== "done" && (
                    <button onClick={() => setCheckoutStep("cart")} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent mr-1">
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  <h2 className="font-display font-bold text-foreground">
                    {checkoutStep === "cart" && "Your Cart"}
                    {checkoutStep === "checkout" && "Checkout"}
                    {checkoutStep === "done" && "Order Placed!"}
                  </h2>
                </div>
                <button onClick={() => setCartOpen(false)}><X size={18} className="text-muted-foreground hover:text-foreground transition-colors" /></button>
              </div>

              {/* Cart step */}
              {checkoutStep === "cart" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {cart.length === 0 ? (
                      <div className="text-center py-16">
                        <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-3" />
                        <p className="font-display font-semibold text-foreground">Your cart is empty</p>
                        <p className="text-sm text-muted-foreground font-body mt-1">Browse products and add them here</p>
                      </div>
                    ) : cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                        <div className="w-14 h-14 rounded-xl bg-background overflow-hidden flex-shrink-0">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={20} className="text-muted-foreground m-auto mt-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-sm text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-body">KSh {item.price.toLocaleString()} each</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-background border border-input flex items-center justify-center hover:bg-accent transition-colors"><Minus size={12} /></button>
                            <span className="font-display font-bold text-sm text-foreground min-w-[1rem] text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-background border border-input flex items-center justify-center hover:bg-accent transition-colors"><Plus size={12} /></button>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-bold text-sm text-primary">KSh {(item.price * item.qty).toLocaleString()}</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition-colors mt-1"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                    <div className="p-6 border-t border-border space-y-4">
                      <div className="flex justify-between font-display font-bold text-lg">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">KSh {cartTotal.toLocaleString()}</span>
                      </div>
                      <button onClick={() => setCheckoutStep("checkout")}
                        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light transition-all">
                        Proceed to Checkout →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout step */}
              {checkoutStep === "checkout" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Order summary */}
                    <div className="bg-secondary rounded-xl p-4 space-y-2">
                      <p className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Order Summary</p>
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm font-body">
                          <span className="text-foreground">{item.name} × {item.qty}</span>
                          <span className="text-muted-foreground">KSh {(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex justify-between font-display font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">KSh {cartTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Customer details */}
                    <div className="space-y-3">
                      <p className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">Your Details</p>
                      <div>
                        <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5">Name (Optional)</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your name"
                            className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5">Phone Number *</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="07XX XXX XXX" type="tel"
                            className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div className="space-y-3">
                      <p className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">Payment Method</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["mpesa", "cash"] as const).map(method => (
                          <button key={method} onClick={() => setPaymentMethod(method)}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-display font-semibold text-sm transition-all ${
                              paymentMethod === method ? "border-primary bg-primary/10 text-primary shadow-brand" : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}>
                            <CreditCard size={18} />
                            {method === "mpesa" ? "M-Pesa" : "Cash on Delivery"}
                          </button>
                        ))}
                      </div>

                      {paymentMethod === "mpesa" && (
                        <div>
                          <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5">M-Pesa Number (if different)</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="Leave blank to use phone above" type="tel"
                              className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                          </div>
                          <p className="text-xs text-muted-foreground font-body mt-1">You'll receive a payment prompt on your phone</p>
                        </div>
                      )}
                    </div>

                    {/* Order policy */}
                    <div className="p-3 rounded-xl bg-accent text-xs text-muted-foreground font-body leading-relaxed">
                      <p className="font-display font-semibold text-foreground text-xs mb-1">Order Policy</p>
                      By placing this order, you agree that all sales are final. M-Pesa payments are processed instantly via Lipana. For cash orders, payment is due on delivery. Contact the store for cancellations within 2 hours of ordering.
                    </div>
                  </div>

                  <div className="p-6 border-t border-border">
                    <button onClick={placeOrder} disabled={submitting || !customerPhone}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light transition-all disabled:opacity-60">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      {submitting ? "Processing..." : paymentMethod === "mpesa" ? "Place Order & Send M-Pesa Prompt" : "Place Cash Order"}
                    </button>
                  </div>
                </div>
              )}

              {/* Done step */}
              {checkoutStep === "done" && (
                <div className="flex flex-col flex-1 items-center justify-center p-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-5">
                    <CheckCircle size={40} className="text-primary" />
                  </motion.div>
                  <h2 className="font-display font-black text-2xl text-foreground mb-2">Order Placed!</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    {paymentMethod === "mpesa"
                      ? "Check your phone for the M-Pesa payment prompt. Your order will be confirmed once payment is received."
                      : "Your cash order has been placed! The seller will contact you to arrange delivery."
                    }
                  </p>
                  <button onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }}
                    className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light transition-all">
                    Continue Shopping
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Store footer */}
      <div className="border-t border-border py-6 px-4 text-center">
        <p className="text-xs text-muted-foreground font-body">
          Powered by <a href="/" className="text-primary hover:underline font-semibold">Vee Digital Solutions</a>
        </p>
      </div>
    </div>
  );
};

// Add Store icon usage
const Store = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

export default PublicStorePage;
