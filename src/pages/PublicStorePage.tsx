import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, Package, X, Plus, Minus,
  ChevronLeft, Phone, User, CreditCard, CheckCircle, Loader2, Tag,
  Store as StoreIcon, Heart, Star, ChevronRight, ArrowRight,
  Menu, MapPin, Truck, Building, Mail, MessageCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

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

const CART_STORAGE_KEY = "duka-cart";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);

  // Cart state — persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "done">("cart");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"within" | "partner" | "pickup">("within");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash" | "card">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [promoCode, setPromoCode] = useState("");
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

  // Auto-slide hero videos every 5 seconds
  const featuredWithVideos = products.filter(p => p.is_featured && p.video_url);
  const featuredHeroItems = featuredWithVideos.length > 0 ? featuredWithVideos : products.filter(p => p.is_featured).slice(0, 10);

  useEffect(() => {
    if (featuredHeroItems.length <= 1) return;
    const timer = setInterval(() => setHeroSlide(prev => (prev + 1) % featuredHeroItems.length), 5000);
    return () => clearInterval(timer);
  }, [featuredHeroItems.length]);

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
  const shippingFee = shippingMethod === "within" ? 300 : shippingMethod === "partner" ? 500 : 0;
  const grandTotal = cartTotal + shippingFee;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (!customerPhone) { toast({ title: "Phone number required", variant: "destructive" }); return; }
    if (cart.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    if (paymentMethod === "card") {
      const msg = `Hi! I'd like to pay KSh ${grandTotal.toLocaleString()} by card for my order from ${shop.shop_name}. Name: ${customerFirstName} ${customerLastName}, Phone: ${customerPhone}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      return;
    }
    setSubmitting(true);
    const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, size: i.size, color: i.color }));
    const { data: order, error } = await supabase.from("orders").insert({
      shop_id: shop.id, customer_name: `${customerFirstName} ${customerLastName}`.trim() || null,
      customer_phone: customerPhone, items, total: grandTotal, status: "pending",
      notes: `${paymentMethod === "cash" ? "Cash on delivery" : "M-Pesa"} | Shipping: ${shippingMethod}${transactionCode ? ` | TxCode: ${transactionCode}` : ""}`,
    }).select().single();

    if (error) { toast({ title: "Error placing order", variant: "destructive" }); setSubmitting(false); return; }

    if (paymentMethod === "mpesa" && !transactionCode) {
      const phone = mpesaPhone || customerPhone;
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lipana-stk-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ phone, amount: grandTotal, orderId: order.id, shopId: shop.id }),
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

  // Shared navbar component
  const StoreNavbar = ({ onBack }: { onBack?: () => void }) => (
    <>
      {/* Top announcement */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs text-white" style={{ backgroundColor: themeColor === "#22c55e" ? "#1a1a2e" : themeColor }}>
        <span className="truncate">{shop?.description || "Welcome to our store"}</span>
        <span className="hidden sm:inline">Free shipping on orders over KSh 5,000</span>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="w-full flex items-center justify-between px-4 lg:px-8 py-3">
          {/* Left: menu + logo */}
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden">
              <Menu size={22} className="text-gray-700" />
            </button>
            {onBack ? (
              <button onClick={onBack} className="flex items-center gap-2 font-bold text-lg text-gray-900 hover:opacity-70">
                {shop?.logo_url ? <img src={shop.logo_url} alt="" className="h-7 object-contain" /> : null}
                <span className="uppercase tracking-tight">{shop?.shop_name}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {shop?.logo_url ? <img src={shop.logo_url} alt="" className="h-7 object-contain" /> : null}
                <span className="font-bold text-lg text-gray-900 uppercase tracking-tight">{shop?.shop_name}</span>
              </div>
            )}
          </div>

          {/* Center: search */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products"
                className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-100 text-sm border-none focus:outline-none focus:ring-1 focus:ring-gray-300" />
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
              <Heart size={16} /> <span className="hidden lg:inline">Wishlist</span>
            </button>
            <button className="hidden sm:flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
              <User size={16} /> <span className="hidden lg:inline">Account</span>
            </button>
            <button onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }} className="relative flex items-center gap-1">
              <ShoppingCart size={20} className="text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: themeColor }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Category nav — desktop */}
        <div className="hidden lg:flex w-full gap-6 px-8 pb-2 overflow-x-auto text-xs font-semibold uppercase tracking-wide text-gray-500">
          <button onClick={() => { setCategory("all"); setSelectedProduct(null); }} className={`whitespace-nowrap pb-1 transition-colors ${category === "all" ? "text-gray-900 border-b-2 border-gray-900" : "hover:text-gray-900"}`}>ALL</button>
          {categories.filter(c => c !== "all").map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setSelectedProduct(null); }} className={`whitespace-nowrap pb-1 transition-colors ${category === cat ? "text-gray-900 border-b-2 border-gray-900" : "hover:text-gray-900"}`}>{cat}</button>
          ))}
          <button className="whitespace-nowrap pb-1 text-gray-400 hover:text-gray-900 transition-colors">About</button>
          <button className="whitespace-nowrap pb-1 text-gray-400 hover:text-gray-900 transition-colors">Contact</button>
          <button className="whitespace-nowrap pb-1 text-gray-400 hover:text-gray-900 transition-colors">Track Order</button>
        </div>
      </header>

      {/* Mobile collapsible nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 h-full w-72 z-50 bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img src={logoImg} alt="Duka Langu" className="w-6 h-6" />
                  <span className="font-bold text-sm">{shop?.shop_name}</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
              </div>
              {/* Mobile search */}
              <div className="p-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setMobileMenuOpen(false); }} placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-100 text-sm border-none focus:outline-none" />
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 space-y-1">
                <button onClick={() => { setCategory("all"); setSelectedProduct(null); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-50">All Products</button>
                {categories.filter(c => c !== "all").map(cat => (
                  <button key={cat} onClick={() => { setCategory(cat); setSelectedProduct(null); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50 capitalize">{cat}</button>
                ))}
                <div className="border-t border-gray-100 my-3" />
                <button className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50">About Us</button>
                <button className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Contact</button>
                <button className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Track Order</button>
                <button className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Shipping & Returns</button>
              </nav>
              <div className="p-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">Powered by <span className="font-semibold" style={{ color: themeColor }}>Duka Langu</span></p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 size={32} className="animate-spin" style={{ color: themeColor }} />
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="font-bold text-2xl text-gray-900">Store Not Found</h1>
          <p className="text-gray-500 mt-2">This store doesn't exist or is currently offline.</p>
        </div>
      </div>
      <StoreFooter themeColor="#22c55e" shopName="" />
    </div>
  );

  // Product detail view
  if (selectedProduct) {
    const p = selectedProduct;
    const related = products.filter(x => x.id !== p.id && (!x.is_adult || ageVerified)).slice(0, 8);
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <StoreNavbar onBack={() => setSelectedProduct(null)} />

        {/* Breadcrumb */}
        <div className="w-full px-4 lg:px-8 py-3 text-xs text-gray-500">
          <button onClick={() => setSelectedProduct(null)} className="hover:text-gray-900">Home</button>
          <span className="mx-2">›</span>
          {p.category && <><button onClick={() => { setCategory(p.category!); setSelectedProduct(null); }} className="hover:text-gray-900">{p.category}</button><span className="mx-2">›</span></>}
          <span className="text-gray-900">{p.name}</span>
        </div>

        {/* Product detail */}
        <div className="flex-1 w-full px-4 lg:px-8 pb-12">
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
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus size={14} /></button>
                <span className="font-bold min-w-[2rem] text-center text-lg">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus size={14} /></button>
              </div>

              {/* Sizes */}
              {p.sizes && p.sizes.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {p.sizes.map(s => (
                      <button key={s} onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedSize === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-700 hover:border-gray-500"}`}>{s}</button>
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
                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? "border-gray-900 ring-2 ring-gray-400" : "border-gray-300"}`}
                        style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { addToCart(p, selectedSize, selectedColor); setCartOpen(true); setCheckoutStep("cart"); }}
                  className="flex-1 py-3.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  ⚡ BUY NOW
                </button>
                <button onClick={() => addToCart(p, selectedSize, selectedColor)}
                  className="flex-1 py-3.5 rounded-lg border-2 font-bold text-sm transition-all hover:bg-gray-50" style={{ borderColor: themeColor, color: themeColor }}>
                  🛒 ADD TO CART
                </button>
              </div>

              {/* Description */}
              {p.description && (
                <div className="mt-6 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</div>
              )}

              <div className="mt-6 space-y-2 text-sm text-gray-500">
                <p className="flex items-center gap-2"><Truck size={14} /> Free delivery on orders above KSh 5,000</p>
                {p.stock > 0 ? <p className="flex items-center gap-2 text-green-600">✅ In stock ({p.stock} available)</p> : <p className="text-red-500">❌ Out of stock</p>}
              </div>
            </div>
          </div>

          {/* You might also like */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold text-gray-900 mb-6">YOU MIGHT ALSO LIKE</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {related.map(r => (
                  <div key={r.id} className="group cursor-pointer" onClick={() => { setSelectedProduct(r); setSelectedSize(""); setSelectedColor(""); setQty(1); window.scrollTo(0, 0); }}>
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                      {r.images?.[0] ? <img src={r.images[0]} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-200" /></div>}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: themeColor }}>KSh {r.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <StoreFooter themeColor={themeColor} shopName={shop.shop_name} description={shop.description} />

        {/* Cart + Floating */}
        <CheckoutPanel cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep}
          customerFirstName={customerFirstName} setCustomerFirstName={setCustomerFirstName} customerLastName={customerLastName} setCustomerLastName={setCustomerLastName}
          customerEmail={customerEmail} setCustomerEmail={setCustomerEmail} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
          shippingMethod={shippingMethod} setShippingMethod={setShippingMethod}
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} mpesaPhone={mpesaPhone} setMpesaPhone={setMpesaPhone}
          transactionCode={transactionCode} setTransactionCode={setTransactionCode}
          emailUpdates={emailUpdates} setEmailUpdates={setEmailUpdates} promoCode={promoCode} setPromoCode={setPromoCode}
          submitting={submitting} placeOrder={placeOrder} removeFromCart={removeFromCart} updateCartQty={updateCartQty}
          cartTotal={cartTotal} shippingFee={shippingFee} grandTotal={grandTotal} cartCount={cartCount} themeColor={themeColor} />

        <FloatingCartButton cartCount={cartCount} cartTotal={cartTotal} themeColor={themeColor} onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }} show={cartCount > 0 && !cartOpen} />
      </div>
    );
  }

  // ======== MAIN STORE VIEW ========
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StoreNavbar />

      {/* Mobile search */}
      <div className="md:hidden px-4 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products"
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-gray-100 text-sm border-none focus:outline-none focus:ring-1 focus:ring-gray-300" />
        </div>
      </div>

      {/* Hero / Featured — auto-sliding video/image carousel */}
      {featuredHeroItems.length > 0 && category === "all" && !search && (
        <section className="w-full px-4 lg:px-8 pt-6">
          <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ minHeight: 360 }}>
            <AnimatePresence mode="wait">
              {featuredHeroItems[heroSlide] && (
                <motion.div key={heroSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                  className="absolute inset-0">
                  {featuredHeroItems[heroSlide].video_url ? (
                    <video src={featuredHeroItems[heroSlide].video_url!} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : featuredHeroItems[heroSlide].images?.[0] ? (
                    <img src={featuredHeroItems[heroSlide].images![0]} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 lg:p-10 z-10">
              <p className="text-white text-xs font-semibold uppercase tracking-wider mb-1">FEATURED</p>
              <h2 className="text-white text-2xl lg:text-4xl font-black uppercase">{featuredHeroItems[heroSlide]?.name}</h2>
              {featuredHeroItems[heroSlide]?.description && <p className="text-white/80 text-sm mt-1 max-w-md line-clamp-2">{featuredHeroItems[heroSlide].description}</p>}
              <button onClick={() => { setSelectedProduct(featuredHeroItems[heroSlide]); window.scrollTo(0, 0); }}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-colors w-fit">
                SHOP NOW <ArrowRight size={14} />
              </button>
            </div>
            {/* Slide indicators */}
            {featuredHeroItems.length > 1 && (
              <div className="absolute bottom-3 right-4 z-10 flex gap-1.5">
                {featuredHeroItems.map((_, i) => (
                  <button key={i} onClick={() => setHeroSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === heroSlide ? "bg-white w-6" : "bg-white/50"}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trending */}
      {category === "all" && !search && (
        <section className="w-full px-4 lg:px-8 pt-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">TRENDING THIS WEEK</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.filter(p => !p.is_adult || ageVerified).slice(0, 5).map(p => (
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
        <section className="w-full px-4 lg:px-8 pt-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">SHOP BY CATEGORY</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
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

      {/* All products grid — full width */}
      <section className="flex-1 w-full px-4 lg:px-8 pt-10 pb-24">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>BUY NOW</button>
                  <button onClick={e => { e.stopPropagation(); addToCart(p); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all hover:bg-gray-50" style={{ borderColor: themeColor, color: themeColor }}>ADD TO CART</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <StoreFooter themeColor={themeColor} shopName={shop.shop_name} description={shop.description} />

      {/* Checkout Panel */}
      <CheckoutPanel cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep}
        customerFirstName={customerFirstName} setCustomerFirstName={setCustomerFirstName} customerLastName={customerLastName} setCustomerLastName={setCustomerLastName}
        customerEmail={customerEmail} setCustomerEmail={setCustomerEmail} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
        shippingMethod={shippingMethod} setShippingMethod={setShippingMethod}
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} mpesaPhone={mpesaPhone} setMpesaPhone={setMpesaPhone}
        transactionCode={transactionCode} setTransactionCode={setTransactionCode}
        emailUpdates={emailUpdates} setEmailUpdates={setEmailUpdates} promoCode={promoCode} setPromoCode={setPromoCode}
        submitting={submitting} placeOrder={placeOrder} removeFromCart={removeFromCart} updateCartQty={updateCartQty}
        cartTotal={cartTotal} shippingFee={shippingFee} grandTotal={grandTotal} cartCount={cartCount} themeColor={themeColor} />

      <FloatingCartButton cartCount={cartCount} cartTotal={cartTotal} themeColor={themeColor} onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }} show={cartCount > 0 && !cartOpen} />

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

// ===== Store Footer =====
const StoreFooter = ({ themeColor, shopName, description }: { themeColor: string; shopName: string; description?: string }) => (
  <footer className="border-t border-gray-200 py-8 px-4 lg:px-8 mt-auto">
    <div className="w-full grid sm:grid-cols-3 gap-6 mb-6">
      <div>
        <p className="font-bold text-gray-900 text-lg">{shopName}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm mb-2">Quick Links</p>
        <div className="space-y-1 text-sm text-gray-500">
          <p className="hover:text-gray-900 cursor-pointer">About Us</p>
          <p className="hover:text-gray-900 cursor-pointer">Contact</p>
          <p className="hover:text-gray-900 cursor-pointer">Shipping & Returns</p>
          <p className="hover:text-gray-900 cursor-pointer">Track Order</p>
        </div>
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm mb-2">Legal</p>
        <div className="space-y-1 text-sm text-gray-500">
          <p className="hover:text-gray-900 cursor-pointer">Privacy Policy</p>
          <p className="hover:text-gray-900 cursor-pointer">Terms of Service</p>
          <p className="hover:text-gray-900 cursor-pointer">Refund Policy</p>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100 pt-4 text-center">
      <p className="text-xs text-gray-400">Built & Maintained by <a href="https://veedigitalsolutions.online" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: themeColor }}>veedigitalsolutions.online</a></p>
    </div>
  </footer>
);

// ===== Floating Cart Button =====
const FloatingCartButton = ({ cartCount, cartTotal, themeColor, onClick, show }: { cartCount: number; cartTotal: number; themeColor: string; onClick: () => void; show: boolean }) => (
  show ? (
    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-bold text-sm shadow-2xl"
      style={{ backgroundColor: themeColor }}>
      <ShoppingCart size={20} />
      <span>{cartCount} items</span>
      <span className="border-l border-white/30 pl-3">KSh {cartTotal.toLocaleString()}</span>
    </motion.button>
  ) : null
);

// ===== Full Checkout Panel (hiii-style inspired) =====
interface CheckoutPanelProps {
  cart: CartItem[]; cartOpen: boolean; setCartOpen: (v: boolean) => void;
  checkoutStep: "cart" | "checkout" | "done"; setCheckoutStep: (v: "cart" | "checkout" | "done") => void;
  customerFirstName: string; setCustomerFirstName: (v: string) => void;
  customerLastName: string; setCustomerLastName: (v: string) => void;
  customerEmail: string; setCustomerEmail: (v: string) => void;
  customerPhone: string; setCustomerPhone: (v: string) => void;
  shippingMethod: "within" | "partner" | "pickup"; setShippingMethod: (v: "within" | "partner" | "pickup") => void;
  paymentMethod: "mpesa" | "cash" | "card"; setPaymentMethod: (v: "mpesa" | "cash" | "card") => void;
  mpesaPhone: string; setMpesaPhone: (v: string) => void;
  transactionCode: string; setTransactionCode: (v: string) => void;
  emailUpdates: boolean; setEmailUpdates: (v: boolean) => void;
  promoCode: string; setPromoCode: (v: string) => void;
  submitting: boolean; placeOrder: () => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  updateCartQty: (id: string, delta: number, size?: string, color?: string) => void;
  cartTotal: number; shippingFee: number; grandTotal: number; cartCount: number; themeColor: string;
}

const CheckoutPanel = ({ cart, cartOpen, setCartOpen, checkoutStep, setCheckoutStep,
  customerFirstName, setCustomerFirstName, customerLastName, setCustomerLastName,
  customerEmail, setCustomerEmail, customerPhone, setCustomerPhone,
  shippingMethod, setShippingMethod, paymentMethod, setPaymentMethod,
  mpesaPhone, setMpesaPhone, transactionCode, setTransactionCode,
  emailUpdates, setEmailUpdates, promoCode, setPromoCode,
  submitting, placeOrder, removeFromCart, updateCartQty,
  cartTotal, shippingFee, grandTotal, cartCount, themeColor }: CheckoutPanelProps) => (
  <AnimatePresence>
    {cartOpen && (
      <>
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCartOpen(false)} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col bg-white shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {checkoutStep === "checkout" && (
                <button onClick={() => setCheckoutStep("cart")} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 mr-1"><ChevronLeft size={16} /></button>
              )}
              <h2 className="font-bold text-gray-900 text-lg">
                {checkoutStep === "cart" && "Your Cart"}
                {checkoutStep === "checkout" && "Complete your order"}
                {checkoutStep === "done" && "Order Confirmed!"}
              </h2>
            </div>
            <button onClick={() => setCartOpen(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1">
              {checkoutStep === "checkout" ? "Edit Cart 🛒" : ""} <X size={18} />
            </button>
          </div>

          {/* ===== CART VIEW ===== */}
          {checkoutStep === "cart" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="font-bold text-gray-900 text-lg">Your cart is empty</p>
                    <p className="text-sm text-gray-500 mt-1">Browse products and add them here</p>
                  </div>
                ) : cart.map(item => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={24} className="text-gray-300 m-auto mt-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      {(item.size || item.color) && <p className="text-xs text-gray-500 mt-0.5">{[item.size, item.color].filter(Boolean).join(" / ")}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">KSh {item.price.toLocaleString()} each</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateCartQty(item.id, -1, item.size, item.color)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus size={12} /></button>
                        <span className="font-bold text-sm min-w-[1.5rem] text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1, item.size, item.color)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Plus size={12} /></button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: themeColor }}>KSh {(item.price * item.qty).toLocaleString()}</p>
                      <button onClick={() => removeFromCart(item.id, item.size, item.color)} className="text-red-400 hover:text-red-600 mt-1 text-xs">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 space-y-4 bg-gray-50/50">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal ({cartCount} items)</span>
                    <span className="font-semibold">KSh {cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => setCheckoutStep("checkout")}
                    className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-lg" style={{ backgroundColor: themeColor }}>
                    Proceed to Checkout →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== CHECKOUT VIEW (hiii-style) ===== */}
          {checkoutStep === "checkout" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* CHECKOUT heading */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CHECKOUT</p>
                  </div>

                  {/* CONTACT SECTION */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CONTACT</p>
                    <p className="text-sm font-semibold text-gray-900 mb-4">Who is receiving the order?</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">First name</label>
                        <input value={customerFirstName} onChange={e => setCustomerFirstName(e.target.value)} placeholder="First name"
                          className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Last name</label>
                        <input value={customerLastName} onChange={e => setCustomerLastName(e.target.value)} placeholder="Last name"
                          className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                        <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="you@example.com" type="email"
                          className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                        <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+254 700 000 000" type="tel"
                          className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={emailUpdates} onChange={e => setEmailUpdates(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300" style={{ accentColor: themeColor }} />
                      <span className="text-xs text-gray-500">Email me with updates and offers</span>
                    </label>
                  </div>

                  {/* SHIPPING METHOD */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">SHIPPING METHOD</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button onClick={() => setShippingMethod("within")}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${shippingMethod === "within" ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}>
                        <Truck size={18} className="text-gray-600" />
                        <p className="text-xs font-semibold text-gray-900">Within Nairobi</p>
                        <p className="text-[10px] text-gray-400">KSh 300 · 1-2 days</p>
                      </button>
                      <button onClick={() => setShippingMethod("partner")}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${shippingMethod === "partner" ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}>
                        <Building size={18} className="text-gray-600" />
                        <p className="text-xs font-semibold text-gray-900">Partner Delivery</p>
                        <p className="text-[10px] text-gray-400">KSh 500 · Pickup/Matatu</p>
                      </button>
                    </div>
                    <button onClick={() => setShippingMethod("pickup")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${shippingMethod === "pickup" ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}>
                      <MapPin size={18} className="text-gray-600" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-900">Shop Pickup</p>
                        <p className="text-[10px] text-gray-400">Free · Collect from store</p>
                      </div>
                    </button>
                  </div>

                  {/* PAYMENT */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">PAYMENT</p>
                      <p className="text-[10px] text-gray-400">We support multiple attempts per checkout.</p>
                    </div>
                    <div className="space-y-2">
                      <button onClick={() => setPaymentMethod("mpesa")}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${paymentMethod === "mpesa" ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "mpesa" ? "border-gray-900" : "border-gray-300"}`}>
                          {paymentMethod === "mpesa" && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">M-Pesa STK Push <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 ml-1 font-bold">Fastest</span></p>
                          <p className="text-xs text-gray-500">We will prompt your phone to confirm the payment.</p>
                        </div>
                      </button>
                      <button onClick={() => setPaymentMethod("cash")}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${paymentMethod === "cash" ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cash" ? "border-gray-900" : "border-gray-300"}`}>
                          {paymentMethod === "cash" && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                          <p className="text-xs text-gray-500">Pay when you receive your order.</p>
                        </div>
                      </button>
                      <button onClick={() => setPaymentMethod("card")}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${paymentMethod === "card" ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "card" ? "border-gray-900" : "border-gray-300"}`}>
                          {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Card Payment</p>
                          <p className="text-xs text-gray-500">We'll redirect you to WhatsApp to complete.</p>
                        </div>
                      </button>
                    </div>

                    {paymentMethod === "mpesa" && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">M-Pesa Number (if different)</label>
                          <input value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="Leave blank to use phone above" type="tel"
                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                        </div>
                        <div className="text-center text-xs text-gray-400">— or pay manually —</div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">M-Pesa Transaction Code (Copy & Pay)</label>
                          <input value={transactionCode} onChange={e => setTransactionCode(e.target.value.toUpperCase())} placeholder="e.g. SJK3HDKF7S"
                            className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 uppercase tracking-wider font-mono" />
                          <p className="text-[10px] text-gray-400 mt-1">Send to provided number, paste code above for verification.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ORDER SUMMARY */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ORDER SUMMARY</p>
                      <span className="text-xs text-gray-400">{cartCount} items</span>
                    </div>
                    <div className="space-y-3 mb-4">
                      {cart.map(item => (
                        <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-100">
                            {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate font-medium">{item.name}</p>
                            {(item.size || item.color) && <p className="text-[10px] text-gray-400">{[item.size, item.color].filter(Boolean).join(" / ")}</p>}
                            <p className="text-[10px] text-gray-400">× {item.qty}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">KSh {(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5 text-sm border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>KSh {cartTotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{shippingFee > 0 ? `KSh ${shippingFee.toLocaleString()}` : "Free"}</span></div>
                      <div className="flex justify-between text-gray-500"><span>Tax</span><span>KSh 0.00</span></div>
                      <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span style={{ color: themeColor }}>KSh {grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* PROMO CODE */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Promo coupon</p>
                    <div className="flex gap-2">
                      <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Promo code"
                        className="flex-1 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <button className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all">Apply</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <button onClick={placeOrder} disabled={submitting || !customerPhone}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 shadow-lg" style={{ backgroundColor: themeColor }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? "Processing..." : `Pay now · KSh ${grandTotal.toLocaleString()}`}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">You will see a confirmation once payment succeeds. Do not close this tab.</p>
              </div>
            </div>
          )}

          {/* ===== DONE ===== */}
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
                  : paymentMethod === "card"
                  ? "You'll be contacted via WhatsApp to complete your card payment."
                  : "Your cash order has been placed! The seller will contact you to arrange delivery."}
              </p>
              <button onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }}
                className="mt-6 px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg" style={{ backgroundColor: themeColor }}>
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
