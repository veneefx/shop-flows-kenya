import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  Banknote, Smartphone, Receipt, Loader2, WifiOff, Wifi,
  CloudUpload, Camera, X, Tag, CheckCircle, AlertCircle, Package
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { requestNativeCameraPermission, getPreferredCameraId } from "@/lib/barcodeScanner";
import ReceiptGenerator from "@/components/receipt/ReceiptGenerator";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface AppliedPromo {
  id: string;
  name: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

const SalesPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [payMethod, setPayMethod] = useState<"cash" | "mpesa">("cash");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [manualDiscount, setManualDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [lastSubtotal, setLastSubtotal] = useState(0);
  const [lastDiscount, setLastDiscount] = useState(0);

  // Barcode scanner
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState("");

  const { isOnline, pendingCount, saveOfflineOrder, syncOrders, syncing } = useOfflineSync();

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase
        .from("shops").select("*").eq("user_id", user.id)
        .order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        setShopData(shop);
        const { data } = await supabase
          .from("products").select("*").eq("shop_id", shop.id).eq("is_active", true);
        setProducts(data || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const addToCart = useCallback((p: any) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === p.id);
      if (exists) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, image: p.images?.[0] }];
    });
    toast({ title: `Added: ${p.name}`, description: `KSh ${Number(p.price).toLocaleString()}` });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const promoDiscount = appliedPromo ? appliedPromo.discountAmount : 0;
  const totalDiscount = manualDiscount + promoDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

  // Fuzzy search
  const filtered = products.filter(p => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const words = q.split(/\s+/);
    const target = `${p.name} ${p.sku || ""} ${p.category || ""} ${p.brand || ""}`.toLowerCase();
    return words.every(w => target.includes(w));
  });

  // Barcode scanner
  const startScanner = useCallback(async () => {
    setScannerError("");
    try {
      await requestNativeCameraPermission();
      setScanning(true);
      await new Promise(r => setTimeout(r, 150));
      const el = document.getElementById("pos-barcode-scanner");
      if (!el) { setScanning(false); return; }
      const cameraId = await getPreferredCameraId();
      const scanner = new Html5Qrcode("pos-barcode-scanner");
      scannerRef.current = scanner;
      await scanner.start(
        cameraId,
        { fps: 15, qrbox: { width: 280, height: 120 } },
        (decodedText) => {
          const found = products.find(
            p => p.sku === decodedText ||
              p.name.toLowerCase() === decodedText.toLowerCase() ||
              p.name.toLowerCase().includes(decodedText.toLowerCase())
          );
          if (found) {
            addToCart(found);
            stopScanner();
          } else {
            setSearch(decodedText);
            stopScanner();
            toast({ title: "Barcode scanned", description: `Searching: ${decodedText}` });
          }
        },
        () => {}
      );
    } catch (err: any) {
      setScanning(false);
      const msg = err?.message || "Camera error";
      setScannerError(
        msg.includes("Permission") || msg.includes("permission")
          ? "Camera permission denied. Please allow camera access in your browser settings and try again."
          : msg.includes("No camera") || msg.includes("no camera")
          ? "No camera found on this device."
          : `Scanner error: ${msg}`
      );
    }
  }, [products, addToCart]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Apply promo code
  const applyPromo = async () => {
    if (!promoInput.trim() || !shopId) return;
    setPromoError("");
    setPromoLoading(true);
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("shop_id", shopId)
      .eq("coupon_code", promoInput.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    setPromoLoading(false);
    if (error || !data) {
      setPromoError("Invalid or expired promo code.");
      return;
    }
    if (data.ends_at && new Date(data.ends_at) < new Date()) {
      setPromoError("This promo code has expired.");
      return;
    }
    if (data.max_uses && data.used_count >= data.max_uses) {
      setPromoError("This promo code has reached its usage limit.");
      return;
    }
    let discountAmount = 0;
    if (data.discount_type === "percentage") {
      discountAmount = Math.round((subtotal * data.discount_value) / 100);
    } else {
      discountAmount = Math.min(data.discount_value, subtotal);
    }
    setAppliedPromo({
      id: data.id,
      name: data.name,
      code: data.coupon_code,
      discountType: data.discount_type as "fixed" | "percentage",
      discountValue: data.discount_value,
      discountAmount,
    });
    toast({ title: `✅ Promo applied: ${data.name}`, description: `Saving KSh ${discountAmount.toLocaleString()}` });
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const resetCart = () => {
    setCart([]);
    setCustomerPhone("");
    setCustomerName("");
    setManualDiscount(0);
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const placeOrder = async () => {
    if (!shopId || cart.length === 0) return;
    if (!customerPhone.trim()) {
      toast({ title: "Enter customer phone", variant: "destructive" });
      return;
    }
    setPlacing(true);
    const orderData = {
      shop_id: shopId,
      customer_phone: customerPhone,
      customer_name: customerName || null,
      total,
      status: payMethod === "cash" ? "paid" : "pending",
      items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty })),
      notes: [
        manualDiscount > 0 ? `Manual Discount: KSh ${manualDiscount}` : null,
        appliedPromo ? `Promo: ${appliedPromo.code} (-KSh ${appliedPromo.discountAmount})` : null,
      ].filter(Boolean).join(" | ") || null,
    };

    if (!isOnline) {
      const offlineOrder = saveOfflineOrder(orderData);
      setLastSubtotal(subtotal);
      setLastDiscount(totalDiscount);
      setLastOrder({ ...orderData, id: offlineOrder.id, created_at: offlineOrder.created_at });
      setShowReceipt(true);
      resetCart();
      setPlacing(false);
      return;
    }

    const { data, error } = await supabase.from("orders").insert(orderData).select().single();
    setPlacing(false);
    if (!error && data) {
      setLastSubtotal(subtotal);
      setLastDiscount(totalDiscount);
      setLastOrder(data);
      setShowReceipt(true);
      toast({ title: "✅ Order placed!", description: `KSh ${total.toLocaleString()} — ${payMethod.toUpperCase()}` });
      resetCart();
    } else {
      toast({ title: "Error placing order", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4 h-[calc(100vh-120px)]">
      <div className="bg-card rounded-2xl border border-border animate-pulse" />
      <div className="bg-card rounded-2xl border border-border animate-pulse" />
    </div>
  );

  if (!shopId) return (
    <div className="text-center py-20">
      <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-4" />
      <p className="font-display font-semibold text-foreground">No store found</p>
      <p className="text-sm text-muted-foreground font-body mt-1">Go to Settings to set up your store first</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-2xl text-foreground">Sales Terminal</h1>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-semibold ${isOnline ? "bg-accent text-primary" : "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400"}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? "Online" : "Offline"}
          </div>
          {pendingCount > 0 && (
            <button onClick={syncOrders} disabled={syncing || !isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-display font-semibold disabled:opacity-50">
              {syncing ? <Loader2 size={12} className="animate-spin" /> : <CloudUpload size={12} />}
              {pendingCount} pending
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* LEFT: Product Grid */}
        <div className="bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
          {/* Search + Scanner */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products, SKU, or category..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={scanning ? stopScanner : startScanner}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${scanning ? "bg-red-500 text-white hover:bg-red-600" : "bg-primary text-primary-foreground hover:opacity-90 shadow-brand"}`}
              >
                {scanning ? <X size={16} /> : <Camera size={16} />}
                <span className="hidden sm:inline">{scanning ? "Stop" : "Scan"}</span>
              </button>
            </div>

            {/* Scanner UI */}
            <AnimatePresence>
              {scanning && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary bg-black">
                    <div id="pos-barcode-scanner" className="w-full" style={{ minHeight: 200 }} />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-64 h-20 border-2 border-primary rounded-lg" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span className="inline-block bg-black/70 text-white text-xs px-3 py-1 rounded-full font-body">
                        Point camera at barcode — auto-detects in &lt;1s
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {scannerError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-body">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{scannerError}</span>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground font-body">
                <Package size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-display font-semibold text-foreground">No products found</p>
                <p className="text-sm mt-1">Try a different search or add products in the Products section</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(p => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(p)}
                    className="bg-background border border-border rounded-xl p-3 text-left hover:border-primary/40 hover:shadow-[0_4px_16px_-4px_hsl(142_71%_45%/0.2)] transition-all duration-200 group"
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-accent flex items-center justify-center mb-2">
                        <ShoppingCart size={20} className="text-primary/50" />
                      </div>
                    )}
                    <p className="font-display font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="font-display font-black text-sm text-primary mt-0.5">KSh {Number(p.price).toLocaleString()}</p>
                    {p.stock !== undefined && (
                      <p className={`text-[10px] font-body mt-0.5 ${p.stock < 5 ? "text-red-500" : "text-muted-foreground"}`}>
                        {p.stock < 5 ? `⚠ ${p.stock} left` : `${p.stock} in stock`}
                      </p>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" /> Cart
              {cart.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {cart.reduce((s, c) => s + c.qty, 0)}
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button onClick={resetCart} className="text-xs text-muted-foreground hover:text-destructive font-display font-semibold transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-body">
                <ShoppingCart size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Tap a product or scan a barcode</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-primary font-bold">KSh {(item.price * item.qty).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{item.qty} × KSh {item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                      <Minus size={11} />
                    </button>
                    <span className="w-6 text-center text-xs font-display font-bold text-foreground">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                      <Plus size={11} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Area */}
          <div className="p-3 border-t border-border space-y-2.5">
            {/* Customer Info */}
            <input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Customer phone *"
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />

            {/* Promo Code */}
            {!appliedPromo ? (
              <div className="space-y-1">
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                      onKeyDown={e => e.key === "Enter" && applyPromo()}
                      placeholder="Promo code"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-input text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring uppercase"
                    />
                  </div>
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-display font-semibold hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {promoLoading ? <Loader2 size={12} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {promoError && <p className="text-[10px] text-destructive font-body">{promoError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-xs font-display font-semibold text-green-700 dark:text-green-400">{appliedPromo.code}</p>
                    <p className="text-[10px] text-green-600 dark:text-green-500 font-body">-KSh {appliedPromo.discountAmount.toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={removePromo} className="text-green-600 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Manual Discount */}
            <input
              type="number"
              value={manualDiscount || ""}
              onChange={e => setManualDiscount(Math.max(0, Number(e.target.value)))}
              placeholder="Manual discount (KSh)"
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />

            {/* Payment Method */}
            <div className="flex gap-2">
              {([["cash", Banknote, "Cash"], ["mpesa", Smartphone, "M-Pesa"]] as const).map(([key, Icon, label]) => (
                <button
                  key={key}
                  onClick={() => setPayMethod(key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display font-semibold transition-all ${payMethod === key ? "bg-primary text-primary-foreground shadow-brand" : "bg-secondary text-foreground hover:bg-accent"}`}
                >
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            {/* M-Pesa Info from Settings */}
            {payMethod === "mpesa" && (shopData?.receipt_paybill || shopData?.receipt_till) && (
              <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-center space-y-0.5">
                {shopData.receipt_show_paybill && shopData.receipt_paybill && (
                  <p className="text-xs font-display font-bold text-green-800 dark:text-green-300">
                    Paybill: {shopData.receipt_paybill}
                    {shopData.receipt_paybill_account && ` · A/C: ${shopData.receipt_paybill_account}`}
                  </p>
                )}
                {shopData.receipt_show_till && shopData.receipt_till && (
                  <p className="text-xs font-display font-bold text-green-800 dark:text-green-300">
                    Till: {shopData.receipt_till}
                  </p>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1 pt-1 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-body">Subtotal</span>
                <span className="font-display font-semibold text-foreground">KSh {subtotal.toLocaleString()}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-body">Promo ({appliedPromo.code})</span>
                  <span className="font-display font-semibold text-green-600">-KSh {appliedPromo.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {manualDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 font-body">Manual Discount</span>
                  <span className="font-display font-semibold text-red-400">-KSh {manualDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-dashed border-border">
                <span className="text-sm font-display font-bold text-foreground">Total</span>
                <span className="text-sm font-display font-black text-primary">KSh {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={placeOrder}
              disabled={placing || cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-50"
            >
              {placing ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
              {placing ? "Processing..." : isOnline ? "Complete Sale" : "Save Offline"}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <ReceiptGenerator
          data={{
            orderId: lastOrder.id || "offline",
            shopName: shopData?.shop_name || "My Store",
            shopLogo: shopData?.receipt_logo_url || shopData?.logo_url || undefined,
            shopPaybill: shopData?.receipt_show_paybill ? shopData?.receipt_paybill || undefined : undefined,
            shopPaybillAccount: shopData?.receipt_paybill_account || undefined,
            shopTill: shopData?.receipt_show_till ? shopData?.receipt_till || undefined : undefined,
            shopSlogan: shopData?.receipt_slogan || undefined,
            shopIntroText: shopData?.receipt_intro_text || undefined,
            shopThankYou: shopData?.receipt_thank_you || undefined,
            shopLocation: shopData?.description || undefined,
            items: (lastOrder.items as any[]).map((i: any) => ({ name: i.name, price: i.price, qty: i.qty })),
            subtotal: lastSubtotal,
            discount: lastDiscount,
            total: lastOrder.total,
            paymentMethod: payMethod,
            customerName: lastOrder.customer_name || undefined,
            customerPhone: lastOrder.customer_phone,
            date: new Date(lastOrder.created_at || Date.now()),
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};

export default SalesPage;
