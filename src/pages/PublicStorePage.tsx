import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, Package, X, Plus, Minus,
  ChevronLeft, Phone, User, CreditCard, CheckCircle, Loader2, Tag,
  Store as StoreIcon, Heart, Star, ChevronRight, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  size?: string;
  color?: string;
}

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
  is_featured: boolean | null;
  video_url: string | null;
  is_adult: boolean | null;
}

const CART_STORAGE_KEY = "vee-cart";

const PublicStorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [qty, setQty] = useState(1);

  // Cart state — persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "done">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ageVerified, setAgeVerified] = useState<boolean>(() => {
    try { return localStorage.getItem("vee-age-verified") === "true"; } catch { return false; }
  });
  const [showAgeGate, setShowAgeGate] = useState(false);

  // Persist cart
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!slug) return;
    const init = async () => {
      const { data: s } = await supabase.from("shops").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (!s) { setLoading(false); return; }
      setShop(s);
      const { data: p } = await supabase.from("products").select("*").eq("shop_id", s.id).eq("is_active", true).order("created_at", { ascending: false });
      setProducts((p as Product[]) || []);
      setLoading(false);
    };
    init();
  }, [slug]);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const featured = products.filter(p => p.is_featured);
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || p.category === category;
    const matchAge = ageVerified || !p.is_adult;
    return matchSearch && matchCat && matchAge;
  });

  const addToCart = useCallback((product: Product, size?: string, color?: string) => {
    const key = `${product.id}-${size || ""}-${color || ""}`;
    setCart(prev => {
      const existing = prev.find(i => `${i.id}-${i.size || ""}-${i.color || ""}` === key);
      if (existing) return prev.map(i => `${i.id}-${i.size || ""}-${i.color || ""}` === key ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, qty, image: product.images?.[0], size, color }];
    });
    toast({ title: `${product.name} added to cart` });
    setQty(1);
  }, [qty]);

  const removeFromCart = (id: string, size?: string, color?: string) => {
    const key = `${id}-${size || ""}-${color || ""}`;
    setCart(prev => prev.filter(i => `${i.id}-${i.size || ""}-${i.color || ""}` !== key));
  };
  const updateCartQty = (id: string, delta: number, size?: string, color?: string) => {
    const key = `${id}-${size || ""}-${color || ""}`;
    setCart(prev => prev.map(i => `${i.id}-${i.size || ""}-${i.color || ""}` === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (!customerPhone) { toast({ title: "Phone number required", variant: "destructive" }); return; }
    if (cart.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    setSubmitting(true);
    const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, size: i.size, color: i.color }));
    const { data: order, error } = await supabase.from("orders").insert({
      shop_id: shop.id, customer_name: customerName || null, customer_phone: customerPhone,
      items, total: cartTotal, status: "pending",
      notes: paymentMethod === "cash" ? "Cash on delivery" : "M-Pesa STK Push",
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
        if (!resp.ok) toast({ title: data.error || "M-Pesa prompt failed", variant: "destructive" });
        else toast({ title: "M-Pesa prompt sent! Check your phone." });
      } catch { toast({ title: "STK push failed", variant: "destructive" }); }
    }

    setSubmitting(false);
    setCheckoutStep("done");
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const themeColor = shop?.theme_color || "#22c55e";

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 size={32} className="animate-spin" style={{ color: themeColor }} />
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-center px-4">
      <div>
        <Package size={48} className="text-gray-300 mx-auto mb-4" />
        <h1 className="font-bold text-2xl text-gray-900">Store Not Found</h1>
        <p className="text-gray-500 mt-2">This store doesn't exist or is currently offline.</p>
      </div>
    </div>
  );

  // Product detail view
  if (selectedProduct) {
    const p = selectedProduct;
    const related = products.filter(x => x.id !== p.id).slice(0, 8);
    return (
      <div className="min-h-screen bg-white">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ backgroundColor: themeColor, color: "white" }}>
            <span>{shop.description || "Welcome to our store"}</span>
            <span>Track My Order</span>
          </div>
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
            <button onClick={() => setSelectedProduct(null)} className="font-bold text-lg text-gray-900 hover:opacity-70 transition-opacity">
              {shop.shop_name}
            </button>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products"
                  className="pl-9 pr-4 py-2 rounded-full bg-gray-100 text-sm border-none focus:outline-none focus:ring-1 focus:ring-gray-300 w-48" />
              </div>
              <button onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }} className="relative">
                <ShoppingCart size={22} className="text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: themeColor }}>{cartCount}</span>
                )}
              </button>
            </div>
          </div>
          {/* Category nav */}
          <div className="max-w-7xl mx-auto flex gap-6 px-4 pb-2 overflow-x-auto text-xs font-semibold uppercase tracking-wide text-gray-500">
            {categories.filter(c => c !== "all").slice(0, 6).map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); setSelectedProduct(null); }} className="hover:text-gray-900 whitespace-nowrap pb-1 transition-colors">{cat}</button>
            ))}
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-gray-500">
          <button onClick={() => setSelectedProduct(null)} className="hover:text-gray-900">Home</button>
          <span className="mx-2">›</span>
          {p.category && <><button onClick={() => { setCategory(p.category!); setSelectedProduct(null); }} className="hover:text-gray-900">{p.category}</button><span className="mx-2">›</span></>}
          <span className="text-gray-900">{p.name}</span>
        </div>

        {/* Product detail */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package size={64} className="text-gray-200" /></div>
                )}
              </div>
              {p.images && p.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {p.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-16 h-16 rounded border border-gray-200 object-cover cursor-pointer hover:border-gray-400 transition-colors" />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
              {p.brand && <p className="text-sm text-gray-500 mt-1">{p.brand}</p>}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-yellow-400 fill-yellow-400" />)}</div>
                <span className="text-xs text-gray-500">(0) reviews</span>
                <button className="ml-auto"><Heart size={18} className="text-gray-400 hover:text-red-500 transition-colors" /></button>
              </div>
              <p className="text-2xl font-bold mt-4" style={{ color: themeColor }}>KSh {p.price.toLocaleString()}</p>

              {/* Quantity */}
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus size={14} /></button>
                <span className="font-bold min-w-[2rem] text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus size={14} /></button>
              </div>

              {/* Sizes */}
              {p.sizes && p.sizes.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {p.sizes.map(s => (
                      <button key={s} onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1.5 rounded border text-sm font-medium transition-all ${selectedSize === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-700 hover:border-gray-500"}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {p.colors && p.colors.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {p.colors.map(c => (
                      <button key={c} onClick={() => setSelectedColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor === c ? "border-gray-900 ring-2 ring-gray-400" : "border-gray-300"}`}
                        style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { addToCart(p, selectedSize, selectedColor); setCartOpen(true); setCheckoutStep("cart"); }}
                  className="flex-1 py-3 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  ⚡ BUY NOW
                </button>
                <button onClick={() => addToCart(p, selectedSize, selectedColor)}
                  className="flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-all hover:bg-gray-50" style={{ borderColor: themeColor, color: themeColor }}>
                  🛒 ADD TO CART
                </button>
              </div>

              {/* Description */}
              {p.description && (
                <div className="mt-6 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</div>
              )}

              <div className="mt-6 space-y-2 text-sm text-gray-500">
                <p className="flex items-center gap-2">📍 Available in stores</p>
                {p.stock > 0 ? <p className="flex items-center gap-2 text-green-600">✅ In stock ({p.stock} available)</p> : <p className="text-red-500">❌ Out of stock</p>}
              </div>
            </div>
          </div>

          {/* You might also like */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold text-gray-900 mb-6">YOU MIGHT ALSO LIKE</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {related.map(r => (
                  <div key={r.id} className="group cursor-pointer" onClick={() => { setSelectedProduct(r); setSelectedSize(""); setSelectedColor(""); setQty(1); window.scrollTo(0, 0); }}>
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                      {r.images?.[0] ? <img src={r.images[0]} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-200" /></div>}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    {r.colors && r.colors.length > 0 && (
                      <div className="flex gap-1 mt-1">{r.colors.slice(0, 5).map(c => <div key={c} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />)}</div>
                    )}
                    <p className="text-sm font-bold mt-1" style={{ color: themeColor }}>KSh {r.price.toLocaleString()}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={e => { e.stopPropagation(); addToCart(r); }}
                        className="flex-1 py-1.5 rounded text-xs font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>BUY NOW</button>
                      <button onClick={e => { e.stopPropagation(); addToCart(r); }}
                        className="flex-1 py-1.5 rounded text-xs font-semibold border transition-all hover:bg-gray-50" style={{ borderColor: themeColor, color: themeColor }}>ADD TO CART</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-6 px-4 text-center">
          <p className="text-xs text-gray-400">Powered by <a href="/" className="font-semibold hover:underline" style={{ color: themeColor }}>Vee Digital Solutions</a></p>
        </footer>

        {/* Cart Panel */}
        <CartPanel cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep}
          customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} mpesaPhone={mpesaPhone} setMpesaPhone={setMpesaPhone}
          submitting={submitting} placeOrder={placeOrder} removeFromCart={removeFromCart} updateCartQty={updateCartQty}
          cartTotal={cartTotal} cartCount={cartCount} themeColor={themeColor} />

        {/* Floating cart */}
        {cartCount > 0 && !cartOpen && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
            onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold text-sm shadow-2xl"
            style={{ backgroundColor: themeColor }}>
            <ShoppingCart size={18} />{cartCount} items · KSh {cartTotal.toLocaleString()}
          </motion.button>
        )}
      </div>
    );
  }

  // ======== MAIN STORE VIEW (hiii-style inspired) ========
  return (
    <div className="min-h-screen bg-white">
      {/* Top announcement bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-white" style={{ backgroundColor: themeColor === "#22c55e" ? "#1a1a2e" : themeColor }}>
        <span>{shop.description || "Welcome to our store"}</span>
        <span>Track My Order</span>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.shop_name} className="h-8 object-contain" />
            ) : (
              <span className="font-bold text-xl text-gray-900 uppercase tracking-tight">{shop.shop_name}</span>
            )}
          </div>
          <div className="flex-1 max-w-md mx-6 hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products"
                className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-100 text-sm border-none focus:outline-none focus:ring-1 focus:ring-gray-300" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }} className="relative">
              <ShoppingCart size={22} className="text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: themeColor }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
        {/* Category nav */}
        <div className="max-w-7xl mx-auto flex gap-6 px-4 pb-2 overflow-x-auto text-xs font-semibold uppercase tracking-wide text-gray-500">
          <button onClick={() => setCategory("all")} className={`whitespace-nowrap pb-1 transition-colors ${category === "all" ? "text-gray-900" : "hover:text-gray-900"}`}>ALL</button>
          {categories.filter(c => c !== "all").map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`whitespace-nowrap pb-1 transition-colors ${category === cat ? "text-gray-900" : "hover:text-gray-900"}`}>{cat}</button>
          ))}
        </div>
      </header>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products"
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-gray-100 text-sm border-none focus:outline-none focus:ring-1 focus:ring-gray-300" />
        </div>
      </div>

      {/* Hero / Featured banner */}
      {featured.length > 0 && category === "all" && !search && (
        <section className="max-w-7xl mx-auto px-4 pt-6">
          <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ minHeight: 320 }}>
            {featured[0].video_url ? (
              <video src={featured[0].video_url} className="w-full h-80 object-cover" autoPlay muted loop playsInline />
            ) : featured[0].images?.[0] ? (
              <img src={featured[0].images[0]} alt={featured[0].name} className="w-full h-80 object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
              <p className="text-white text-sm font-semibold uppercase tracking-wider mb-1">FEATURED</p>
              <h2 className="text-white text-3xl font-black uppercase">{featured[0].name}</h2>
              {featured[0].description && <p className="text-white/80 text-sm mt-1 max-w-md">{featured[0].description}</p>}
              <button onClick={() => { setSelectedProduct(featured[0]); window.scrollTo(0, 0); }}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-colors w-fit">
                SHOP NOW <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Trending section */}
      {category === "all" && !search && (
        <section className="max-w-7xl mx-auto px-4 pt-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">TRENDING</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 4).map(p => (
              <div key={p.id} className="group cursor-pointer" onClick={() => { setSelectedProduct(p); setSelectedSize(""); setSelectedColor(""); setQty(1); window.scrollTo(0, 0); }}>
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2 relative">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={40} className="text-gray-200" /></div>}
                </div>
                <p className="text-sm text-gray-900 font-medium truncate">{p.name}</p>
                <p className="text-sm font-bold" style={{ color: themeColor }}>KSh {p.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shop by category */}
      {category === "all" && !search && categories.length > 2 && (
        <section className="max-w-7xl mx-auto px-4 pt-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">SHOP BY CATEGORY</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.filter(c => c !== "all").map(cat => {
              const catProduct = products.find(p => p.category === cat);
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="relative rounded-lg overflow-hidden h-36 group">
                  {catProduct?.images?.[0] ? (
                    <img src={catProduct.images[0]} alt={cat} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-sm uppercase tracking-wider">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* All products grid */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {category === "all" ? "ALL PRODUCTS" : category?.toUpperCase()}
          </h2>
          <span className="text-xs text-gray-400">{filtered.length} products</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-semibold text-gray-900">No products found</p>
            <p className="text-sm text-gray-500 mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="group cursor-pointer" onClick={() => {
                  if (p.is_adult && !ageVerified) { setShowAgeGate(true); return; }
                  setSelectedProduct(p); setSelectedSize(""); setSelectedColor(""); setQty(1); window.scrollTo(0, 0);
                }}>
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2 relative">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={40} className="text-gray-200" /></div>}
                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/70 px-3 py-1 rounded-full">OUT OF STOCK</span>
                    </div>
                  )}
                  <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Heart size={18} className="text-gray-500 hover:text-red-500" /></button>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                {p.colors && p.colors.length > 0 && (
                  <div className="flex gap-1 mt-1">{p.colors.slice(0, 5).map(c => <div key={c} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />)}</div>
                )}
                <p className="text-sm font-bold mt-1" style={{ color: themeColor }}>KSh {p.price.toLocaleString()}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={e => { e.stopPropagation(); addToCart(p); setCartOpen(true); setCheckoutStep("cart"); }}
                    className="flex-1 py-1.5 rounded text-xs font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>BUY NOW</button>
                  <button onClick={e => { e.stopPropagation(); addToCart(p); }}
                    className="flex-1 py-1.5 rounded text-xs font-semibold border transition-all hover:bg-gray-50" style={{ borderColor: themeColor, color: themeColor }}>ADD TO CART</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-bold text-gray-900 text-lg">{shop.shop_name}</p>
          {shop.description && <p className="text-sm text-gray-500 mt-1">{shop.description}</p>}
          <p className="text-xs text-gray-400 mt-4">Powered by <a href="/" className="font-semibold hover:underline" style={{ color: themeColor }}>Vee Digital Solutions</a></p>
        </div>
      </footer>

      {/* Cart Panel */}
      <CartPanel cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep}
        customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} mpesaPhone={mpesaPhone} setMpesaPhone={setMpesaPhone}
        submitting={submitting} placeOrder={placeOrder} removeFromCart={removeFromCart} updateCartQty={updateCartQty}
        cartTotal={cartTotal} cartCount={cartCount} themeColor={themeColor} />

      {/* Floating cart */}
      {cartCount > 0 && !cartOpen && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold text-sm shadow-2xl"
          style={{ backgroundColor: themeColor }}>
          <ShoppingCart size={18} />{cartCount} items · KSh {cartTotal.toLocaleString()}
        </motion.button>
      )}

      {/* 18+ Age Gate Modal */}
      <AnimatePresence>
        {showAgeGate && (
          <>
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setShowAgeGate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[60] inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
                <div className="text-5xl mb-4">🔞</div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Age Verification</h2>
                <p className="text-sm text-gray-500 mb-6">This product is restricted to adults only. Are you 18 years or older?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowAgeGate(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all">
                    Under 18
                  </button>
                  <button onClick={() => { setAgeVerified(true); localStorage.setItem("vee-age-verified", "true"); setShowAgeGate(false); }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>
                    I'm 18+
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ===== Cart/Checkout Panel =====
interface CartPanelProps {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  checkoutStep: "cart" | "checkout" | "done";
  setCheckoutStep: (v: "cart" | "checkout" | "done") => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  paymentMethod: "mpesa" | "cash";
  setPaymentMethod: (v: "mpesa" | "cash") => void;
  mpesaPhone: string;
  setMpesaPhone: (v: string) => void;
  submitting: boolean;
  placeOrder: () => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  updateCartQty: (id: string, delta: number, size?: string, color?: string) => void;
  cartTotal: number;
  cartCount: number;
  themeColor: string;
}

const CartPanel = ({ cart, cartOpen, setCartOpen, checkoutStep, setCheckoutStep,
  customerName, setCustomerName, customerPhone, setCustomerPhone,
  paymentMethod, setPaymentMethod, mpesaPhone, setMpesaPhone,
  submitting, placeOrder, removeFromCart, updateCartQty,
  cartTotal, cartCount, themeColor }: CartPanelProps) => (
  <AnimatePresence>
    {cartOpen && (
      <>
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCartOpen(false)} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {checkoutStep !== "cart" && checkoutStep !== "done" && (
                <button onClick={() => setCheckoutStep("cart")} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 mr-1"><ChevronLeft size={16} /></button>
              )}
              <h2 className="font-bold text-gray-900">
                {checkoutStep === "cart" && "Your Cart"}
                {checkoutStep === "checkout" && "Checkout"}
                {checkoutStep === "done" && "Order Placed!"}
              </h2>
            </div>
            <button onClick={() => setCartOpen(false)}><X size={18} className="text-gray-400 hover:text-gray-900" /></button>
          </div>

          {/* Cart items */}
          {checkoutStep === "cart" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">Your cart is empty</p>
                    <p className="text-sm text-gray-500 mt-1">Browse products and add them here</p>
                  </div>
                ) : cart.map(item => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-14 h-14 rounded-lg bg-white overflow-hidden flex-shrink-0">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-300 m-auto mt-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      {(item.size || item.color) && <p className="text-xs text-gray-500">{[item.size, item.color].filter(Boolean).join(" / ")}</p>}
                      <p className="text-xs text-gray-500">KSh {item.price.toLocaleString()} each</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => updateCartQty(item.id, -1, item.size, item.color)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus size={12} /></button>
                        <span className="font-bold text-sm min-w-[1rem] text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1, item.size, item.color)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Plus size={12} /></button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: themeColor }}>KSh {(item.price * item.qty).toLocaleString()}</p>
                      <button onClick={() => removeFromCart(item.id, item.size, item.color)} className="text-red-400 hover:text-red-600 mt-1"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 space-y-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span style={{ color: themeColor }}>KSh {cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => setCheckoutStep("checkout")}
                    className="w-full py-3.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>
                    Proceed to Checkout →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Checkout */}
          {checkoutStep === "checkout" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Order summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-2">Order Summary · {cartCount} items</p>
                  {cart.map(item => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-white overflow-hidden flex-shrink-0">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{item.name} × {item.qty}</p>
                        {(item.size || item.color) && <p className="text-xs text-gray-400">{[item.size, item.color].filter(Boolean).join(" / ")}</p>}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">KSh {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span style={{ color: themeColor }}>KSh {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-3">
                  <p className="font-semibold text-xs text-gray-500 uppercase tracking-wide">CONTACT</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your name"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Phone *</label>
                      <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+254 7XX XXX XXX" type="tel"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-3">
                  <p className="font-semibold text-xs text-gray-500 uppercase tracking-wide">PAYMENT</p>
                  <div className="space-y-2">
                    <button onClick={() => setPaymentMethod("mpesa")}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === "mpesa" ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "mpesa" ? "border-gray-900" : "border-gray-300"}`}>
                        {paymentMethod === "mpesa" && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">M-Pesa STK Push <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 ml-1">Fastest</span></p>
                        <p className="text-xs text-gray-500">We will prompt your phone to confirm the payment.</p>
                      </div>
                    </button>
                    <button onClick={() => setPaymentMethod("cash")}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === "cash" ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cash" ? "border-gray-900" : "border-gray-300"}`}>
                        {paymentMethod === "cash" && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                        <p className="text-xs text-gray-500">Pay when you receive your order.</p>
                      </div>
                    </button>
                  </div>
                  {paymentMethod === "mpesa" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">M-Pesa Number (if different from above)</label>
                      <input value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="Leave blank to use phone above" type="tel"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button onClick={placeOrder} disabled={submitting || !customerPhone}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: themeColor }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {submitting ? "Processing..." : "Pay now"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">You will see a confirmation once payment succeeds.</p>
              </div>
            </div>
          )}

          {/* Done */}
          {checkoutStep === "done" && (
            <div className="flex flex-col flex-1 items-center justify-center p-8 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: themeColor + "22" }}>
                <CheckCircle size={40} style={{ color: themeColor }} />
              </motion.div>
              <h2 className="font-black text-2xl text-gray-900 mb-2">Order Placed!</h2>
              <p className="text-gray-500 leading-relaxed">
                {paymentMethod === "mpesa"
                  ? "Check your phone for the M-Pesa payment prompt. Your order will be confirmed once payment is received."
                  : "Your cash order has been placed! The seller will contact you to arrange delivery."}
              </p>
              <button onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }}
                className="mt-6 px-6 py-3 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: themeColor }}>
                Continue Shopping
              </button>
            </div>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default PublicStorePage;
