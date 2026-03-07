import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain, TrendingUp, Package, AlertTriangle, RefreshCw,
  BarChart3, Clock, Zap, ShoppingBag
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ["hsl(142 71% 45%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(0 72% 51%)", "hsl(190 80% 50%)", "hsl(340 75% 55%)", "hsl(60 70% 50%)", "hsl(160 60% 45%)", "hsl(20 85% 55%)"];

const AIInsightsPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const paidOrders = useMemo(() => orders.filter(o => o.status === "paid"), [orders]);

  // Sales forecast (simple moving average)
  const forecast = useMemo(() => {
    const daily: Record<string, number> = {};
    paidOrders.forEach(o => {
      const d = new Date(o.created_at).toISOString().split("T")[0];
      daily[d] = (daily[d] || 0) + Number(o.total);
    });
    const sorted = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));
    const last7 = sorted.slice(-7);
    const avg = last7.length > 0 ? last7.reduce((s, [, v]) => s + v, 0) / last7.length : 0;

    const result: { day: string; revenue: number; type: string }[] = [];
    last7.forEach(([d, v]) => result.push({ day: new Date(d).toLocaleDateString("en-KE", { weekday: "short", day: "numeric" }), revenue: v, type: "actual" }));
    for (let i = 1; i <= 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const variance = 0.8 + Math.random() * 0.4;
      result.push({ day: d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric" }), revenue: Math.round(avg * variance), type: "forecast" });
    }
    return result;
  }, [paidOrders]);

  // Best selling products
  const bestSellers = useMemo(() => {
    const sales: Record<string, { name: string; revenue: number; units: number }> = {};
    paidOrders.forEach(o => {
      ((o.items as any[]) || []).forEach((item: any) => {
        const key = item.name || "Unknown";
        if (!sales[key]) sales[key] = { name: key, revenue: 0, units: 0 };
        sales[key].revenue += (item.price || 0) * (item.qty || 1);
        sales[key].units += item.qty || 1;
      });
    });
    return Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [paidOrders]);

  // Slow moving products
  const slowMovers = useMemo(() => {
    const soldIds = new Set<string>();
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    paidOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo).forEach(o => {
      ((o.items as any[]) || []).forEach((item: any) => { if (item.id) soldIds.add(item.id); });
    });
    return products.filter(p => !soldIds.has(p.id) && p.stock > 0).map(p => ({
      name: p.name, stock: p.stock,
      daysSinceCreated: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    })).sort((a, b) => b.daysSinceCreated - a.daysSinceCreated).slice(0, 8);
  }, [products, paidOrders]);

  // Restock predictions
  const restockNeeded = useMemo(() => {
    const salesRate: Record<string, number> = {};
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    paidOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo).forEach(o => {
      ((o.items as any[]) || []).forEach((item: any) => {
        if (item.id) salesRate[item.id] = (salesRate[item.id] || 0) + (item.qty || 1);
      });
    });
    return products.filter(p => p.stock > 0 && salesRate[p.id]).map(p => {
      const monthlyRate = salesRate[p.id] || 0;
      const dailyRate = monthlyRate / 30;
      const daysLeft = dailyRate > 0 ? Math.round(p.stock / dailyRate) : 999;
      return { name: p.name, stock: p.stock, daysLeft, reorderQty: Math.max(10, Math.round(monthlyRate * 1.5)) };
    }).filter(p => p.daysLeft < 30).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 8);
  }, [products, paidOrders]);

  // Revenue heatmap
  const heatmap = useMemo(() => {
    const grid: Record<string, Record<string, number>> = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = ["6AM", "8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM"];
    days.forEach(d => { grid[d] = {}; hours.forEach(h => { grid[d][h] = 0; }); });
    paidOrders.forEach(o => {
      const d = new Date(o.created_at);
      const day = days[d.getDay()];
      const h = d.getHours();
      const hourLabel = h < 7 ? "6AM" : h < 9 ? "8AM" : h < 11 ? "10AM" : h < 13 ? "12PM" : h < 15 ? "2PM" : h < 17 ? "4PM" : h < 19 ? "6PM" : "8PM";
      grid[day][hourLabel] += Number(o.total);
    });
    return { days, hours, grid };
  }, [paidOrders]);

  const maxHeat = useMemo(() => {
    let max = 0;
    heatmap.days.forEach(d => heatmap.hours.forEach(h => { if (heatmap.grid[d]?.[h] > max) max = heatmap.grid[d][h]; }));
    return max || 1;
  }, [heatmap]);

  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgDaily = paidOrders.length > 0 ? totalRevenue / Math.max(1, new Set(paidOrders.map(o => new Date(o.created_at).toISOString().split("T")[0])).size) : 0;

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-xl bg-card border border-border animate-pulse" />
      <div className="grid sm:grid-cols-2 gap-5">{[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground flex items-center gap-3">
            <Brain className="text-primary" size={28} /> AI Insights
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">Smart analytics & predictions powered by your sales data</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { icon: TrendingUp, label: "Avg Daily Revenue", value: `KSh ${Math.round(avgDaily).toLocaleString()}`, color: "text-primary", bg: "bg-accent" },
          { icon: ShoppingBag, label: "Total Sales", value: paidOrders.length, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: AlertTriangle, label: "Low Stock Items", value: restockNeeded.length, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
          { icon: Package, label: "Slow Movers", value: slowMovers.length, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-card-custom">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Sales Forecast */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-card-custom">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Zap size={16} className="text-primary" /> Sales Forecast</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Last 7 days + next 7 days predicted</p>
          </div>
        </div>
        {forecast.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number, _: any, props: any) => [`KSh ${v.toLocaleString()}`, props.payload.type === "forecast" ? "Predicted" : "Actual"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142 71% 45%)" strokeWidth={2.5} fill="url(#actualGrad)" strokeDasharray={(d: any) => ""} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-56 flex items-center justify-center"><p className="text-muted-foreground text-sm font-body">Make sales to see forecasts</p></div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <h3 className="font-display font-bold text-foreground mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> Top 10 Best Sellers</h3>
          {bestSellers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bestSellers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`KSh ${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {bestSellers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center"><p className="text-muted-foreground text-sm font-body">No sales data yet</p></div>
          )}
        </motion.div>

        {/* Slow Movers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card-custom">
          <h3 className="font-display font-bold text-foreground mb-5 flex items-center gap-2"><AlertTriangle size={16} className="text-orange-500" /> Slow Moving Products</h3>
          {slowMovers.length > 0 ? (
            <div className="space-y-3">
              {slowMovers.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{p.daysSinceCreated} days without sale</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-display font-bold text-orange-500">{p.stock} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center"><p className="text-muted-foreground text-sm font-body">All products are selling — great job!</p></div>
          )}
        </motion.div>
      </div>

      {/* Restock Predictions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-card-custom">
        <h3 className="font-display font-bold text-foreground mb-5 flex items-center gap-2"><RefreshCw size={16} className="text-primary" /> Restock Predictions</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Products likely to run out within 30 days based on current sell rate</p>
        {restockNeeded.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {restockNeeded.map((p, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-secondary/50">
                <p className="font-display font-semibold text-sm text-foreground truncate">{p.name}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current Stock</span>
                    <span className="font-bold text-foreground">{p.stock}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Days Left</span>
                    <span className={`font-bold ${p.daysLeft < 7 ? "text-red-500" : p.daysLeft < 14 ? "text-orange-500" : "text-foreground"}`}>{p.daysLeft} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Reorder Qty</span>
                    <span className="font-bold text-primary">{p.reorderQty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8"><p className="text-muted-foreground text-sm font-body">All stock levels are healthy</p></div>
        )}
      </motion.div>

      {/* Revenue Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-card-custom">
        <h3 className="font-display font-bold text-foreground mb-5 flex items-center gap-2"><Clock size={16} className="text-primary" /> Revenue Heatmap</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">Which days & hours generate the most sales</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-body py-2 pr-3"></th>
                {heatmap.hours.map(h => <th key={h} className="text-center text-muted-foreground font-body py-2 px-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {heatmap.days.map(day => (
                <tr key={day}>
                  <td className="text-muted-foreground font-display font-semibold py-1 pr-3">{day}</td>
                  {heatmap.hours.map(hour => {
                    const val = heatmap.grid[day]?.[hour] || 0;
                    const intensity = val / maxHeat;
                    return (
                      <td key={hour} className="p-1">
                        <div
                          className="w-full h-8 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all"
                          style={{
                            backgroundColor: intensity > 0 ? `hsl(142 71% 45% / ${Math.max(0.08, intensity * 0.8)})` : "hsl(var(--secondary))",
                            color: intensity > 0.5 ? "white" : "hsl(var(--muted-foreground))",
                          }}
                          title={`${day} ${hour}: KSh ${val.toLocaleString()}`}
                        >
                          {val > 0 ? `${(val / 1000).toFixed(0)}k` : "–"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AIInsightsPage;
