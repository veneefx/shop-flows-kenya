import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Banknote, Smartphone,
  Receipt, Loader2, Camera, X, Tag, AlertCircle, Package, Volume2, ArrowLeft
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";
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
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [payMethod, setPayMethod] = useState<"cash" | "mpesa" | "card" | "credit">("cash");
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    // Subscribe to product changes
    if (shopId) {
      const subscription = supabase
        .channel(`products-${shopId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `shop_id=eq.${shopId}` }, () => {
          init();
        })
        .subscribe();
      return () => { subscription.unsubscribe(); };
    }
  }, [user, shopId]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const playBeep = () => {
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const addToCart = useCallback((p: any) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === p.id);
      if (exists) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, image: p.images?.[0] }];
    });
    playBeep();
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

  // Barcode scanner - OPTIMIZED FOR SPEED
  const startScanner = useCallback(async () => {
    setScannerError("");
    try {
      setScanning(true);
      await new Promise(r => setTimeout(r, 150));
      const el = document.getElementById("pos-barcode-scanner");
      if (!el) { setScanning(false); return; }
      
      const scanner = new Html5Qrcode("pos-barcode-scanner");
      scannerRef.current = scanner;
      
      // Get rear camera
      const cameras = await Html5Qrcode.getCameras();
      const rearCamera = cameras.find(c => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("rear")) || cameras[cameras.length - 1];
      
      await scanner.start(
        rearCamera?.id || cameras[0]?.id,
        { fps: 30, qrbox: { width: 300, height: 150 } },
        (decodedText) => {
          const found = products.find(
            p => p.sku === decodedText ||
              p.name.toLowerCase() === decodedText.toLowerCase() ||
              p.name.toLowerCase().includes(decodedText.toLowerCase())
          );
          if (found) {
            addToCart(found);
            stopScanner();
          }
        },
        (error) => {}
      );
    } catch (err: any) {
      setScannerError(err.message || "Camera error");
      setScanning(false);
    }
  }, [products, addToCart]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {}
    }
    setScanning(false);
  }, []);

  // Promo code validation
  const applyPromo = useCallback(async () => {
    if (!promoInput.trim() || !shopId) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("shop_id", shopId)
        .eq("code", promoInput.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setPromoError("Invalid promo code");
        setPromoLoading(false);
        return;
      }

      if (data.ends_at && new Date(data.ends_at) < new Date()) {
        setPromoError("Promo code expired");
        setPromoLoading(false);
        return;
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setPromoError("Promo code limit reached");
        setPromoLoading(false);
        return;
      }

      let discountAmount = 0;
      if (data.discount_type === "percentage") {
        discountAmount = (subtotal * data.discount_value) / 100;
      } else {
        discountAmount = data.discount_value;
      }

      setAppliedPromo({
        id: data.id,
        name: data.name,
        code: data.code,
        discountType: data.discount_type,
        discountValue: data.discount_value,
        discountAmount,
      });
      toast({ title: "Promo applied!", description: `Discount: KSh ${discountAmount.toLocaleString()}` });
    } catch (err) {
      setPromoError("Error applying promo");
    }
    setPromoLoading(false);
  }, [promoInput, shopId, subtotal]);

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
  };

  // Place order
  const placeOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        shop_id: shopId,
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone || "N/A",
        items: cart.map(c => ({ product_id: c.id, quantity: c.qty, price: c.price })),
        subtotal_amount: subtotal,
        discount_amount: totalDiscount,
        total_amount: total,
        total: total, // Keep for backward compatibility
        payment_method: payMethod,
        status: payMethod === "credit" ? "pending" : "paid",
      };

      if (isOnline) {
        const { data, error } = await supabase.from("orders").insert([orderData]).select().single();
        if (error) throw error;
        setLastOrder(data);
      } else {
        await saveOfflineOrder(orderData);
        setLastOrder(orderData);
      }

      setLastSubtotal(subtotal);
      setLastDiscount(totalDiscount);
      setShowReceipt(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setManualDiscount(0);
      setAppliedPromo(null);
      setPromoInput("");

      toast({ title: "Sale completed!", description: `Total: KSh ${total.toLocaleString()}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setPlacing(false);
  }, [cart, shopId, subtotal, totalDiscount, total, payMethod, customerName, customerPhone, isOnline, saveOfflineOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Audio for beep */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==" />

      {/* Header with Back Button */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-full px-4 lg:px-6 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors text-foreground font-display font-semibold text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </motion.button>
          <h1 className="font-display font-black text-lg text-foreground">POS - Sales Terminal</h1>
          <div className="w-12" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 lg:p-6 overflow-hidden">
        {/* LEFT: Products Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search & Scan */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scanning ? stopScanner : startScanner}
              disabled={loading}
              className={`px-4 py-2.5 rounded-lg font-display font-semibold text-sm flex items-center gap-2 transition-colors ${
                scanning
                  ? "bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Camera size={16} />
              {scanning ? "Stop" : "Scan"}
            </motion.button>
          </div>

          {/* Scanner Modal */}
          <AnimatePresence>
            {scanning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mb-4 p-4 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-foreground">Scanning...</h3>
                  <button onClick={stopScanner} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
                <div id="pos-barcode-scanner" className="w-full h-64 rounded-lg bg-black" />
                {scannerError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{scannerError}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((product) => (
                <motion.button
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(product)}
                  className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all text-left"
                >
                  {product.images?.[0] && (
                    <img src={product.images[0]} alt={product.name} className="w-full h-24 object-cover rounded mb-2" />
                  )}
                  <p className="text-xs font-display font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">Stock: {product.quantity || 0}</p>
                  <p className="text-sm font-display font-black text-primary">KSh {Number(product.price).toLocaleString()}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart & Checkout */}
        <div className="w-80 flex flex-col bg-card rounded-xl border border-border p-4 shadow-lg">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Shopping Cart</h2>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div key={item.id} layout className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">KSh {Number(item.price).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 rounded bg-secondary hover:bg-accent">
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-xs font-display font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 rounded bg-secondary hover:bg-accent">
                      <Plus size={12} />
                    </button>
                    <button onClick={() => removeItem(item.id)} className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Promo Code */}
          <div className="mb-4 p-3 rounded-lg bg-background">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                className="flex-1 px-2 py-1.5 rounded text-xs bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={applyPromo}
                disabled={promoLoading}
                className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-display font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {promoLoading ? <Loader2 size={12} className="animate-spin" /> : "Apply"}
              </button>
            </div>
            {appliedPromo && (
              <div className="flex items-center justify-between p-2 rounded bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-600 dark:text-green-400 font-display font-semibold">{appliedPromo.code}</p>
                <button onClick={removePromo} className="text-green-600 dark:text-green-400 hover:text-green-700">
                  <X size={12} />
                </button>
              </div>
            )}
            {promoError && <p className="text-xs text-red-600 dark:text-red-400">{promoError}</p>}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-4 p-3 rounded-lg bg-background border border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-display font-semibold">KSh {subtotal.toLocaleString()}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                <span>Discount:</span>
                <span className="font-display font-semibold">-KSh {totalDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-display font-black border-t border-border pt-2">
              <span>TOTAL:</span>
              <span className="text-primary">KSh {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4 space-y-2">
            <p className="text-xs font-display font-semibold text-muted-foreground">Payment Method:</p>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "mpesa", "card", "credit"] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPayMethod(method)}
                  className={`px-3 py-2 rounded-lg text-xs font-display font-semibold transition-colors ${
                    payMethod === method
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-accent"
                  }`}
                >
                  {method === "cash" && "💵 Cash"}
                  {method === "mpesa" && "📱 M-Pesa"}
                  {method === "card" && "💳 Card"}
                  {method === "credit" && "📝 Credit"}
                </button>
              ))}
            </div>
          </div>

          {/* M-Pesa Info */}
          {payMethod === "mpesa" && shopData?.mpesa_paybill && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs">
              <p className="font-display font-semibold text-blue-600 dark:text-blue-400 mb-1">M-Pesa Payment</p>
              <p className="text-muted-foreground">Paybill: <span className="font-display font-bold">{shopData.mpesa_paybill}</span></p>
              {shopData.mpesa_account && <p className="text-muted-foreground">Account: <span className="font-display font-bold">{shopData.mpesa_account}</span></p>}
              {shopData.mpesa_till && <p className="text-muted-foreground">Till: <span className="font-display font-bold">{shopData.mpesa_till}</span></p>}
            </div>
          )}

          {/* Complete Sale Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={placeOrder}
            disabled={placing || cart.length === 0}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-black text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {placing ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
            {placing ? "Processing..." : "Complete Sale"}
          </motion.button>

          {/* Offline Sync Status */}
          {!isOnline && (
            <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-600 dark:text-orange-400 text-center">
              Offline mode - {pendingCount} pending
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <ReceiptGenerator
                  order={lastOrder}
                  shopName={shopData?.shop_name}
                  shopLogo={shopData?.logo_url}
                  shopIntroText={shopData?.intro_text}
                  shopThankYou={shopData?.thank_you_text}
                  shopPaybillAccount={shopData?.mpesa_paybill}
                  shopPaybillNumber={shopData?.mpesa_account}
                  shopTillNumber={shopData?.mpesa_till}
                />
                <button
                  onClick={() => setShowReceipt(false)}
                  className="w-full mt-4 py-2 rounded-lg bg-secondary hover:bg-accent text-foreground font-display font-semibold text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesPage;
