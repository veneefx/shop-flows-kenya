import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Phone, ShoppingBag, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Customer {
  customer_phone: string;
  customer_name: string | null;
  order_count: number;
  total_spent: number;
  last_order: string;
}

const CustomersPage = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        const { data: orders } = await supabase.from("orders").select("customer_phone, customer_name, total, created_at").eq("shop_id", shop.id);
        if (orders) {
          const map: Record<string, Customer> = {};
          orders.forEach(o => {
            if (!map[o.customer_phone]) {
              map[o.customer_phone] = { customer_phone: o.customer_phone, customer_name: o.customer_name, order_count: 0, total_spent: 0, last_order: o.created_at };
            }
            map[o.customer_phone].order_count++;
            map[o.customer_phone].total_spent += o.total;
            if (new Date(o.created_at) > new Date(map[o.customer_phone].last_order)) {
              map[o.customer_phone].last_order = o.created_at;
            }
          });
          setCustomers(Object.values(map).sort((a, b) => b.total_spent - a.total_spent));
        }
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const filtered = customers.filter(c =>
    (c.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    c.customer_phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Customers</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{customers.length} unique customers</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total Customers", value: customers.length, color: "text-primary", bg: "bg-accent" },
          { icon: ShoppingBag, label: "Total Orders", value: customers.reduce((s, c) => s + c.order_count, 0), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: TrendingUp, label: "Total Revenue", value: `KSh ${customers.reduce((s, c) => s + c.total_spent, 0).toLocaleString()}`, color: "text-primary", bg: "bg-accent" },
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

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-foreground">No customers yet</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Customers appear once they place orders</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border bg-secondary/50">
            {["Customer", "Orders", "Total Spent", "Last Order"].map(h => (
              <p key={h} className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          {filtered.map((c, i) => (
            <motion.div key={c.customer_phone} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="grid grid-cols-4 gap-4 items-center px-5 py-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-display font-bold text-xs">{(c.customer_name || c.customer_phone)[0].toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm text-foreground truncate">{c.customer_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1"><Phone size={10} />{c.customer_phone}</p>
                </div>
              </div>
              <p className="font-display font-semibold text-sm text-foreground">{c.order_count}</p>
              <p className="font-display font-bold text-sm text-primary">KSh {c.total_spent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-body">{new Date(c.last_order).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
