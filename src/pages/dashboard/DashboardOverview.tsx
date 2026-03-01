import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, DollarSign, Clock,
  Package, Users, Store, AlertCircle, ArrowUpRight,
  Wallet, BarChart3, Zap
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const statusStyle: Record<string, string> = {
  paid: "bg-primary/15 text-primary",
  pending: "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400",
  failed: "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400",
  delivered: "bg-primary/15 text-primary",
  cancelled: "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400",
};

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, orders: 0, todayRevenue: 0, pendingOrders: 0, productCount: 0, customerCount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sold: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const [{ data: shop }, { data: prof }] = await Promise.all([
        supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle(),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setProfile(prof);
      if (!shop) { setLoading(false); return; }

      const [{ data: orders }, { data: products }, { count: customerCount }] = await Promise.all([
        supabase.from("orders").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, price, stock").eq("shop_id", shop.id),
        supabase.from("credit_accounts").select("*", { count: "exact", head: true }).eq("shop_id", shop.id),
      ]);
      const allOrders = orders || [];
      const allProducts = products || [];

      const today = new Date().toISOString().split("T")[0];
      const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
      const todayRevenue = allOrders.filter(o => o.created_at.startsWith(today)).reduce((s, o) => s + Number(o.total), 0);
      const pendingOrders = allOrders.filter(o => o.status === "pending").length;

      setStats({ revenue: totalRevenue, orders: allOrders.length, todayRevenue, pendingOrders, productCount: allProducts.length, customerCount: customerCount || 0 });
      setRecentOrders(allOrders.slice(0, 6));

      // Top products from order items
      const productSales: Record<string, { sold: number; revenue: number }> = {};
      allOrders.forEach(o => {
        const items = (o.items as any[]) || [];
        items.forEach((item: any) => {
          const key = item.name || "Unknown";
          if (!productSales[key]) productSales[key] = { sold: 0, revenue: 0 };
          productSales[key].sold += item.qty || 1;
          productSales[key].revenue += (item.price || 0) * (item.qty || 1);
        });
      });
      setTopProducts(
        Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );

      // Last 7 days chart
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      const chart = days.map(day => ({
        day: new Date(day).toLocaleDateString("en-KE", { weekday: "short" }),
        revenue: allOrders.filter(o => o.created_at.startsWith(day)).reduce((s, o) => s + Number(o.total), 0),
        orders: allOrders.filter(o => o.created_at.startsWith(day)).length,
      }));
      setChartData(chart);
      setLoading(false);
    };
    init();
  }, [user]);

  const statCards = [
    { icon: DollarSign, label: "Total Revenue", value: `KSh ${stats.revenue.toLocaleString()}`, color: "text-primary", bg: "bg-accent", change: "+12%" },
    { icon: ShoppingBag, label: "Total Orders", value: String(stats.orders), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", change: `${stats.pendingOrders} pending` },
    { icon: Zap, label: "Today's Revenue", value: `KSh ${stats.todayRevenue.toLocaleString()}`, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", change: "today" },
    { icon: Package, label: "Products", value: String(stats.productCount), color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", change: "active" },
    { icon: Users, label: "Credit Customers", value: String(stats.customerCount), color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10", change: "accounts" },
    { icon: AlertCircle, label: "Pending Orders", value: String(stats.pendingOrders), color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", change: "action needed" },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-xl bg-card border border-border animate-pulse" />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Welcome back, {profile?.full_name || "there"}! Here's your business at a glance.</p>
      </div>

      {profile?.plan === "trial" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary/10 border border-primary/30 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Store size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Free Trial Active</p>
              <p className="text-sm text-muted-foreground font-body">
                {profile.trial_ends_at ? `Ends ${new Date(profile.trial_ends_at).toLocaleDateString("en-KE")}` : "Upgrade to unlock all features"}
              </p>
            </div>
          </div>
          <a href="/dashboard/upgrade" className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all">
            Upgrade Now
          </a>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-card-custom hover:shadow-xl-custom hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon size={18} className={s.color} />
                </div>
                <span className="text-[10px] text-muted-foreground font-body px-2 py-0.5 rounded-full bg-secondary">{s.change}</span>
              </div>
              <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <h3 className="font-display font-bold text-foreground mb-1">Revenue This Week</h3>
          <p className="text-xs text-muted-foreground font-body mb-6">Daily revenue trend (KES)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`KSh ${v.toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142 71% 45%)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-foreground">Top Products</h3>
            <BarChart3 size={16} className="text-muted-foreground" />
          </div>
          {topProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-body">Sales data will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center text-xs font-display font-bold text-muted-foreground">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{p.sold} sold</p>
                  </div>
                  <p className="text-sm font-display font-bold text-primary">KSh {p.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Orders + Quick Actions */}
      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-3 bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-foreground">Recent Orders</h3>
            <a href="/dashboard/orders" className="text-xs text-primary font-display font-semibold hover:underline flex items-center gap-1">View all <ArrowUpRight size={12} /></a>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-body">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-sm text-foreground truncate">{order.customer_name || order.customer_phone}</p>
                    <p className="text-xs text-muted-foreground font-body">{new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-sm text-foreground">KSh {Number(order.total).toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-display font-medium ${statusStyle[order.status] || "bg-secondary text-muted-foreground"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <h3 className="font-display font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/dashboard/sales", icon: ShoppingBag, label: "New Sale", color: "bg-primary/10 text-primary" },
              { href: "/dashboard/products", icon: Package, label: "Add Product", color: "bg-blue-500/10 text-blue-500" },
              { href: "/dashboard/orders", icon: Clock, label: "Orders", color: "bg-orange-500/10 text-orange-500" },
              { href: "/dashboard/reports", icon: TrendingUp, label: "Reports", color: "bg-purple-500/10 text-purple-500" },
              { href: "/dashboard/credit", icon: Wallet, label: "Credit", color: "bg-pink-500/10 text-pink-500" },
              { href: "/dashboard/store", icon: Store, label: "My Store", color: "bg-teal-500/10 text-teal-500" },
            ].map(a => {
              const Icon = a.icon;
              return (
                <a key={a.label} href={a.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all group">
                  <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-display font-semibold text-foreground">{a.label}</span>
                </a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardOverview;
