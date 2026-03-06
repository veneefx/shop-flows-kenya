import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Wallet, Plus, X, Loader2, TrendingUp, Clock, Banknote, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CashEntry {
  id: string;
  type: "in" | "out";
  amount: number;
  method: string;
  description: string;
  created_at: string;
}

const CashPage = () => {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCashOut, setShowCashOut] = useState(false);
  const [cashOutForm, setCashOutForm] = useState({ amount: "", description: "", method: "cash" });
  const [manualEntries, setManualEntries] = useState<CashEntry[]>([]);
  const [openingFloat, setOpeningFloat] = useState(0);
  const [editFloat, setEditFloat] = useState(false);
  const [floatInput, setFloatInput] = useState("");
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        const { data: o } = await supabase.from("orders").select("total, status, created_at").eq("shop_id", shop.id);
        setOrders(o || []);
      }
      // Load persisted float
      const saved = localStorage.getItem("cash_float");
      if (saved) setOpeningFloat(parseFloat(saved));
      const savedEntries = localStorage.getItem("cash_entries");
      if (savedEntries) setManualEntries(JSON.parse(savedEntries));
      setLoading(false);
    };
    init();
  }, [user]);

  const getDateRange = () => {
    const now = new Date();
    if (period === "today") return now.toISOString().split("T")[0];
    if (period === "week") { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; }
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  };

  const startDate = getDateRange();
  const paidOrders = orders.filter(o => o.status === "paid" && o.created_at >= startDate);
  const cashIn = paidOrders.reduce((s, o) => s + o.total, 0);
  const periodEntries = manualEntries.filter(e => e.created_at >= startDate);
  const manualCashOut = periodEntries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0);
  const manualCashIn = periodEntries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0);
  const totalIn = cashIn + manualCashIn;
  const totalOut = manualCashOut;
  const netBalance = openingFloat + totalIn - totalOut;

  // Chart data (last 7 days)
  const chartData = (() => {
    const days: Record<string, { day: string; income: number; expense: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days[key] = { day: d.toLocaleDateString("en-KE", { weekday: "short" }), income: 0, expense: 0 };
    }
    paidOrders.forEach(o => { const k = o.created_at.split("T")[0]; if (days[k]) days[k].income += o.total; });
    manualEntries.forEach(e => { const k = e.created_at.split("T")[0]; if (days[k]) { if (e.type === "in") days[k].income += e.amount; else days[k].expense += e.amount; } });
    return Object.values(days);
  })();

  const handleCashOut = () => {
    const amount = parseFloat(cashOutForm.amount);
    if (!amount || amount <= 0) return;
    const entry: CashEntry = {
      id: Date.now().toString(),
      type: "out",
      amount,
      method: cashOutForm.method,
      description: cashOutForm.description || "Cash withdrawal",
      created_at: new Date().toISOString(),
    };
    const updated = [entry, ...manualEntries];
    setManualEntries(updated);
    localStorage.setItem("cash_entries", JSON.stringify(updated));
    setCashOutForm({ amount: "", description: "", method: "cash" });
    setShowCashOut(false);
    toast({ title: `KSh ${amount.toLocaleString()} recorded as cash out` });
  };

  const saveFloat = () => {
    const v = parseFloat(floatInput);
    if (isNaN(v)) return;
    setOpeningFloat(v);
    localStorage.setItem("cash_float", String(v));
    setEditFloat(false);
    toast({ title: "Opening float updated" });
  };

  // Combined transaction log
  const allTransactions = [
    ...paidOrders.map(o => ({ id: o.created_at, type: "in" as const, amount: o.total, desc: "Sale payment", method: "mpesa", time: o.created_at })),
    ...manualEntries.map(e => ({ id: e.id, type: e.type, amount: e.amount, desc: e.description, method: e.method, time: e.created_at })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Cash Management</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">Track cash flow, float, and reconciliation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCashOut(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600 transition-all">
            <ArrowDownCircle size={14} /> Cash Out
          </button>
          <button onClick={() => { setFloatInput(String(openingFloat)); setEditFloat(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border font-display font-semibold text-sm text-foreground hover:border-primary/30 transition-all">
            <Wallet size={14} /> Set Float
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {(["today", "week", "month"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-xs font-display font-semibold capitalize transition-all ${period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: Wallet, label: "Opening Float", value: `KSh ${openingFloat.toLocaleString()}`, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: ArrowUpCircle, label: "Cash In", value: `KSh ${totalIn.toLocaleString()}`, color: "text-primary", bg: "bg-accent" },
          { icon: ArrowDownCircle, label: "Cash Out", value: `KSh ${totalOut.toLocaleString()}`, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
          { icon: TrendingUp, label: "Net Balance", value: `KSh ${netBalance.toLocaleString()}`, color: netBalance >= 0 ? "text-primary" : "text-red-500", bg: netBalance >= 0 ? "bg-accent" : "bg-red-50 dark:bg-red-500/10" },
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

      {/* Chart */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-display font-bold text-foreground mb-4">Cash Flow (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="income" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#incGrad)" name="Income" />
            <Area type="monotone" dataKey="expense" stroke="hsl(0 72% 51%)" strokeWidth={2} fill="transparent" name="Expense" strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Log */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-display font-bold text-sm text-foreground">Recent Transactions</h3>
        </div>
        {allTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-body">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {allTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === "in" ? "bg-primary/10" : "bg-red-500/10"}`}>
                    {t.type === "in" ? <ArrowUpCircle size={14} className="text-primary" /> : <ArrowDownCircle size={14} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">{t.desc}</p>
                    <p className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                      {t.method === "mpesa" ? <Smartphone size={9} /> : <Banknote size={9} />}
                      {t.method} · {new Date(t.time).toLocaleString("en-KE", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <span className={`font-display font-bold text-sm ${t.type === "in" ? "text-primary" : "text-red-500"}`}>
                  {t.type === "in" ? "+" : "-"}KSh {t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cash Out Modal */}
      <AnimatePresence>
        {showCashOut && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCashOut(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">Record Cash Out</h2>
                <button onClick={() => setShowCashOut(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Amount (KSh) *</label>
                <input type="number" value={cashOutForm.amount} onChange={e => setCashOutForm({ ...cashOutForm, amount: e.target.value })} placeholder="e.g. 5000"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Reason</label>
                <input value={cashOutForm.description} onChange={e => setCashOutForm({ ...cashOutForm, description: e.target.value })} placeholder="e.g. Supplier payment"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={handleCashOut}
                className="w-full py-3 rounded-xl bg-red-500 text-white font-display font-bold text-sm hover:bg-red-600 flex items-center justify-center gap-2">
                <ArrowDownCircle size={16} /> Record Cash Out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set Float Modal */}
      <AnimatePresence>
        {editFloat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditFloat(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground">Set Opening Float</h2>
              <input type="number" value={floatInput} onChange={e => setFloatInput(e.target.value)} placeholder="e.g. 10000"
                className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={saveFloat}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 flex items-center justify-center gap-2">
                <Wallet size={16} /> Save Float
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashPage;
