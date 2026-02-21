import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package, Percent } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ["hsl(142 71% 45%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(0 72% 51%)"];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        const [{ data: o }, { data: p }] = await Promise.all([
          supabase.from("orders").select("*").eq("shop_id", shop.id),
          supabase.from("products").select("*").eq("shop_id", shop.id),
        ]);
        setOrders(o || []);
        setProducts(p || []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  // Derived metrics
  const paidOrders = orders.filter(o => o.status === "paid");
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const avgOrder = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const conversionRate = totalOrders > 0 ? ((paidOrders.length / totalOrders) * 100).toFixed(1) : "0";

  // Revenue by day (last 30 days)
  const last30: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last30[d.toLocaleDateString("en-KE", { day: "numeric", month: "short" })] = 0;
  }
  paidOrders.forEach(o => {
    const key = new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
    if (key in last30) last30[key] += o.total;
  });
  const revenueData = Object.entries(last30).map(([day, revenue]) => ({ day, revenue })).slice(-14);

  // Orders by status
  const statusData = [
    { name: "Paid", value: paidOrders.length },
    { name: "Pending", value: orders.filter(o => o.status === "pending").length },
    { name: "Failed", value: orders.filter(o => o.status === "failed").length },
    { name: "Cancelled", value: orders.filter(o => o.status === "cancelled").length },
  ].filter(d => d.value > 0);

  // Top products
  const productSales: Record<string, { name: string; revenue: number; units: number }> = {};
  paidOrders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: any) => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, revenue: 0, units: 0 };
      productSales[item.name].revenue += (item.price || 0) * (item.qty || item.quantity || 1);
      productSales[item.name].units += item.qty || item.quantity || 1;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const stats = [
    { icon: DollarSign, label: "Total Revenue", value: `KSh ${totalRevenue.toLocaleString()}`, color: "text-primary", bg: "bg-accent" },
    { icon: ShoppingBag, label: "Total Orders", value: totalOrders, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { icon: TrendingUp, label: "Avg Order Value", value: `KSh ${Math.round(avgOrder).toLocaleString()}`, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { icon: Percent, label: "Conversion Rate", value: `${conversionRate}%`, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { icon: Package, label: "Total Products", value: products.length, color: "text-primary", bg: "bg-accent" },
    { icon: Users, label: "Unique Customers", value: new Set(orders.map(o => o.customer_phone)).size, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { icon: TrendingUp, label: "Paid Orders", value: paidOrders.length, color: "text-primary", bg: "bg-accent" },
    { icon: TrendingDown, label: "Failed Orders", value: orders.filter(o => o.status === "failed").length, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-xl bg-card border border-border animate-pulse" />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">{[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Analytics</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Detailed performance insights for your store</p>
      </div>

      {/* KPI Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-card-custom hover:-translate-y-0.5 transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-foreground">Revenue (Last 14 Days)</h3>
              <p className="text-xs text-muted-foreground font-body mt-0.5">Daily revenue in KES</p>
            </div>
            <BarChart3 size={18} className="text-primary" />
          </div>
          {revenueData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`KSh ${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142 71% 45%)" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center">
              <p className="text-muted-foreground text-sm font-body">No revenue data yet — orders will show here</p>
            </div>
          )}
        </motion.div>

        {/* Orders by status pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <h3 className="font-display font-bold text-foreground mb-4">Orders by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center">
              <p className="text-muted-foreground text-sm font-body text-center">No order data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-card-custom">
        <h3 className="font-display font-bold text-foreground mb-5">Top Products by Revenue</h3>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-xs text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-sm font-display font-bold text-primary ml-2">KSh {p.revenue.toLocaleString()}</p>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${(p.revenue / topProducts[0].revenue) * 100}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{p.units} units sold</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm font-body text-center py-8">No product sales data yet</p>
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
