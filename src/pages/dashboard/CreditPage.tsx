import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Users, AlertCircle, Plus, X, Banknote, Smartphone, Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface CreditAccount {
  id: string;
  customer_name: string;
  customer_phone: string;
  credit_limit: number;
  balance: number;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  notes: string | null;
  created_at: string;
}

const CreditPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [payForm, setPayForm] = useState<{ accountId: string; amount: string; method: string; notes: string } | null>(null);

  const [form, setForm] = useState({ name: "", phone: "", limit: "", notes: "" });

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase.from("credit_accounts").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false });
        setAccounts((data as CreditAccount[]) || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const handleCreate = async () => {
    if (!shopId || !form.name || !form.phone) {
      toast({ title: "Name and phone required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("credit_accounts").insert({
      shop_id: shopId,
      customer_name: form.name,
      customer_phone: form.phone,
      credit_limit: parseFloat(form.limit) || 0,
      balance: 0,
      notes: form.notes || null,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setAccounts(prev => [data as CreditAccount, ...prev]);
      setForm({ name: "", phone: "", limit: "", notes: "" });
      setShowForm(false);
      toast({ title: "Credit account created!" });
    } else {
      toast({ title: "Error creating account", variant: "destructive" });
    }
  };

  const loadPayments = async (accountId: string) => {
    if (expandedId === accountId) { setExpandedId(null); return; }
    setExpandedId(accountId);
    if (!payments[accountId]) {
      const { data } = await supabase.from("credit_payments").select("*").eq("credit_account_id", accountId).order("created_at", { ascending: false });
      setPayments(prev => ({ ...prev, [accountId]: (data as Payment[]) || [] }));
    }
  };

  const recordPayment = async () => {
    if (!payForm || !payForm.amount) return;
    setSaving(true);
    const amount = parseFloat(payForm.amount);
    const { data, error } = await supabase.from("credit_payments").insert({
      credit_account_id: payForm.accountId,
      amount,
      method: payForm.method,
      notes: payForm.notes || null,
    }).select().single();

    if (!error && data) {
      // Update balance
      const account = accounts.find(a => a.id === payForm.accountId);
      if (account) {
        const newBalance = Math.max(0, account.balance - amount);
        await supabase.from("credit_accounts").update({ balance: newBalance }).eq("id", payForm.accountId);
        setAccounts(prev => prev.map(a => a.id === payForm.accountId ? { ...a, balance: newBalance } : a));
      }
      setPayments(prev => ({ ...prev, [payForm.accountId]: [data as Payment, ...(prev[payForm.accountId] || [])] }));
      setPayForm(null);
      toast({ title: "Payment recorded!" });
    }
    setSaving(false);
  };

  const addCredit = async (accountId: string) => {
    const amountStr = prompt("Enter credit amount (KSh):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    const newBalance = account.balance + amount;
    if (account.credit_limit > 0 && newBalance > account.credit_limit) {
      toast({ title: "Exceeds credit limit!", variant: "destructive" });
      return;
    }
    await supabase.from("credit_accounts").update({ balance: newBalance }).eq("id", accountId);
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: newBalance } : a));
    toast({ title: `KSh ${amount.toLocaleString()} credit added` });
  };

  const totalOutstanding = accounts.reduce((s, a) => s + a.balance, 0);
  const overdue = accounts.filter(a => a.balance > 0 && a.credit_limit > 0 && a.balance >= a.credit_limit);
  const filtered = accounts.filter(a =>
    a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    a.customer_phone.includes(search)
  );

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Credit Management</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">Track customer credit balances and payments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all">
          <Plus size={16} /> New Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Credit Customers", value: String(accounts.length), color: "text-primary", bg: "bg-accent" },
          { icon: Wallet, label: "Outstanding Balance", value: `KSh ${totalOutstanding.toLocaleString()}`, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
          { icon: AlertCircle, label: "At Limit", value: String(overdue.length), color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
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

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {/* Accounts list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Wallet size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-semibold text-foreground">No credit accounts yet</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Click "New Account" to start tracking credit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((acc, i) => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl border border-border overflow-hidden">
              <button onClick={() => loadPayments(acc.id)} className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-primary text-sm">{acc.customer_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-foreground">{acc.customer_name}</p>
                  <p className="text-xs text-muted-foreground font-body">{acc.customer_phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-display font-black text-base ${acc.balance > 0 ? "text-orange-500" : "text-primary"}`}>
                    KSh {acc.balance.toLocaleString()}
                  </p>
                  {acc.credit_limit > 0 && (
                    <p className="text-[10px] text-muted-foreground font-body">Limit: KSh {acc.credit_limit.toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); addCredit(acc.id); }}
                    className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-display font-semibold hover:bg-orange-500/20">+Credit</button>
                  <button onClick={(e) => { e.stopPropagation(); setPayForm({ accountId: acc.id, amount: "", method: "cash", notes: "" }); }}
                    className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-display font-semibold hover:bg-primary/20">Pay</button>
                </div>
                {expandedId === acc.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {/* Payment history */}
              <AnimatePresence>
                {expandedId === acc.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment History</p>
                      {(payments[acc.id] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground font-body py-2">No payments recorded yet</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {(payments[acc.id] || []).map(p => (
                            <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/50">
                              <div className="flex items-center gap-2">
                                {p.method === "mpesa" ? <Smartphone size={12} className="text-primary" /> : <Banknote size={12} className="text-primary" />}
                                <span className="text-xs font-body text-foreground">KSh {p.amount.toLocaleString()}</span>
                                {p.notes && <span className="text-[10px] text-muted-foreground">— {p.notes}</span>}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-body">{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Account Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">New Credit Account</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              {[
                { label: "Customer Name *", key: "name", placeholder: "John Kamau" },
                { label: "Phone *", key: "phone", placeholder: "0712345678" },
                { label: "Credit Limit (KSh)", key: "limit", placeholder: "10000 (0 = unlimited)", type: "number" },
                { label: "Notes", key: "notes", placeholder: "Optional notes..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input type={f.type || "text"} value={form[f.key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
              <button onClick={handleCreate} disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? "Creating..." : "Create Account"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {payForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPayForm(null)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">Record Payment</h2>
                <button onClick={() => setPayForm(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Amount (KSh) *</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="e.g. 5000"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex gap-2">
                {[["cash", "Cash"], ["mpesa", "M-Pesa"]].map(([key, label]) => (
                  <button key={key} onClick={() => setPayForm({ ...payForm, method: key })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-display font-semibold transition-all ${payForm.method === key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Notes</label>
                <input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Optional..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={recordPayment} disabled={saving || !payForm.amount}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                {saving ? "Recording..." : "Record Payment"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditPage;
