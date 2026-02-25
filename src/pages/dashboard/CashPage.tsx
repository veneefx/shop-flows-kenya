import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CashPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ cashIn: 0, cashOut: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        const today = new Date().toISOString().split("T")[0];
        const { data: orders } = await supabase.from("orders").select("total, status, created_at").eq("shop_id", shop.id);
        const todayPaid = (orders || []).filter(o => o.status === "paid" && o.created_at.startsWith(today));
        const cashIn = todayPaid.reduce((s, o) => s + o.total, 0);
        setStats({ cashIn, cashOut: 0, balance: cashIn });
      }
      setLoading(false);
    };
    init();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Cash Management</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Track daily cash flow and reconciliation</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: ArrowUpCircle, label: "Cash In (Today)", value: `KSh ${stats.cashIn.toLocaleString()}`, color: "text-primary", bg: "bg-accent" },
          { icon: ArrowDownCircle, label: "Cash Out (Today)", value: `KSh ${stats.cashOut.toLocaleString()}`, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
          { icon: Wallet, label: "Net Balance", value: `KSh ${stats.balance.toLocaleString()}`, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
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

      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <DollarSign size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="font-display font-semibold text-foreground">Cash flow from paid orders</p>
        <p className="text-sm text-muted-foreground font-body mt-1">Process sales through the POS to see cash activity here</p>
      </div>
    </div>
  );
};

export default CashPage;
