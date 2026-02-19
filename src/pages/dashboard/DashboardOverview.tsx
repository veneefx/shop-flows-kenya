import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, Package, Users,
  Store, AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const revenueData = [
  { day: "Mon", revenue: 12400, orders: 8 },
  { day: "Tue", revenue: 18200, orders: 14 },
  { day: "Wed", revenue: 9800, orders: 6 },
  { day: "Thu", revenue: 24600, orders: 19 },
  { day: "Fri", revenue: 31200, orders: 24 },
  { day: "Sat", revenue: 28900, orders: 22 },
  { day: "Sun", revenue: 15600, orders: 11 },
];

const statCards = [
  {
    icon: DollarSign,
    label: "Total Revenue",
    value: "KSh 141,700",
    change: "+18.2%",
    up: true,
    color: "text-primary",
    bg: "bg-accent",
  },
  {
    icon: ShoppingBag,
    label: "Total Orders",
    value: "104",
    change: "+12.5%",
    up: true,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    icon: Clock,
    label: "Today's Revenue",
    value: "KSh 15,600",
    change: "-4.1%",
    up: false,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-500/10",
  },
  {
    icon: AlertCircle,
    label: "Pending Payments",
    value: "3",
    change: "Requires action",
    up: null,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-500/10",
  },
];

const recentOrders = [
  { id: "#ORD-001", customer: "Wanjiku K.", amount: "KSh 4,500", status: "paid", time: "2 min ago" },
  { id: "#ORD-002", customer: "Brian O.", amount: "KSh 12,300", status: "paid", time: "18 min ago" },
  { id: "#ORD-003", customer: "Grace N.", amount: "KSh 6,800", status: "pending", time: "45 min ago" },
  { id: "#ORD-004", customer: "Samuel M.", amount: "KSh 2,200", status: "failed", time: "1 hr ago" },
  { id: "#ORD-005", customer: "Aisha H.", amount: "KSh 9,100", status: "paid", time: "2 hr ago" },
];

const statusStyle = {
  paid: "bg-primary/15 text-primary",
  pending: "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400",
  failed: "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400",
};

const DashboardOverview = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Overview</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Welcome back! Here's your business summary.</p>
      </div>

      {/* Trial Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-primary/10 border border-primary/30 p-5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Store size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">Your 2-Day Free Trial is Active</p>
            <p className="text-sm text-muted-foreground font-body">Upgrade to a paid plan to continue after trial ends.</p>
          </div>
        </div>
        <a href="/dashboard/upgrade" className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all">
          Upgrade Now
        </a>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-card-custom hover:shadow-xl-custom hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon size={18} className={s.color} />
                </div>
                {s.up !== null && (
                  <div className={`flex items-center gap-1 text-xs font-display font-semibold ${s.up ? "text-primary" : "text-red-500"}`}>
                    {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {s.change}
                  </div>
                )}
              </div>
              <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{s.label}</p>
              {s.up === null && (
                <p className="text-xs text-red-500 font-display mt-1">{s.change}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-card rounded-2xl p-6 border border-border shadow-card-custom"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-foreground">Revenue This Week</h3>
              <p className="text-xs text-muted-foreground font-body mt-0.5">Daily revenue in KES</p>
            </div>
            <span className="text-xs font-display font-semibold text-primary bg-accent px-3 py-1 rounded-full">+18.2%</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, fontFamily: "Inter" }}
                formatter={(v: number) => [`KSh ${v.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142 71% 45%)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card-custom"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-foreground">Recent Orders</h3>
            <a href="/dashboard/orders" className="text-xs text-primary font-display font-semibold hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm text-foreground truncate">{order.id}</p>
                  <p className="text-xs text-muted-foreground font-body">{order.customer} · {order.time}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-sm text-foreground">{order.amount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-display font-medium ${statusStyle[order.status as keyof typeof statusStyle]}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardOverview;
