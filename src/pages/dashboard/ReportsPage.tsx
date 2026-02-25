import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ReportsPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        const { data } = await supabase.from("orders").select("*").eq("shop_id", shop.id);
        setOrders(data || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const paidOrders = orders.filter(o => o.status === "paid");
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);

  // Build chart data based on period
  const chartData = (() => {
    const days = period === "daily" ? 7 : period === "weekly" ? 4 : 6;
    const data: { label: string; revenue: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      if (period === "daily") d.setDate(d.getDate() - i);
      else if (period === "weekly") d.setDate(d.getDate() - i * 7);
      else d.setMonth(d.getMonth() - i);
      
      const label = period === "monthly"
        ? d.toLocaleDateString("en-KE", { month: "short" })
        : d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
      
      const matching = paidOrders.filter(o => {
        const od = new Date(o.created_at);
        if (period === "daily") return od.toDateString() === d.toDateString();
        if (period === "weekly") {
          const weekStart = new Date(d); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
          return od >= weekStart && od < weekEnd;
        }
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      });
      
      data.push({ label, revenue: matching.reduce((s, o) => s + o.total, 0), orders: matching.length });
    }
    return data;
  })();

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Reports</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">Sales and performance reports</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: "Total Revenue", value: `KSh ${totalRevenue.toLocaleString()}`, color: "text-primary", bg: "bg-accent" },
          { icon: ShoppingBag, label: "Paid Orders", value: paidOrders.length, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: TrendingUp, label: "Avg Order", value: `KSh ${paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length).toLocaleString() : 0}`, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
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

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">Sales Report</h3>
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            {(["daily", "weekly", "monthly"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-semibold capitalize transition-all ${period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        {chartData.some(d => d.revenue > 0) ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`KSh ${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground font-body">No data for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
