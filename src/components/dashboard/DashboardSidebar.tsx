import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  BarChart3, CreditCard, Settings, LogOut, Store,
  Sun, Moon, Crown, Shield, Lock, ShoppingCart,
  Boxes, Wallet, UserCog, FileText, Megaphone,
  Truck, DollarSign, Activity, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";

const planAccess: Record<string, string[]> = {
  trial: ["overview", "sales", "inventory", "customers", "cash", "store", "upgrade", "settings"],
  lite: ["overview", "sales", "inventory", "customers", "cash", "store", "upgrade", "settings"],
  starter: ["overview", "sales", "inventory", "customers", "orders", "cash", "reports", "store", "upgrade", "settings"],
  business: ["overview", "sales", "inventory", "customers", "orders", "cash", "reports", "credit", "staff", "analytics", "payments", "store", "upgrade", "settings"],
  enterprise: ["overview", "sales", "inventory", "customers", "orders", "cash", "reports", "credit", "staff", "analytics", "payments", "promotions", "delivery", "activitylogs", "store", "upgrade", "settings", "admin"],
};

const featureMinPlan: Record<string, string> = {
  orders: "Starter",
  reports: "Starter",
  credit: "Business",
  staff: "Business",
  analytics: "Business",
  payments: "Business",
  promotions: "Enterprise",
  delivery: "Enterprise",
  activitylogs: "Enterprise",
  admin: "Enterprise",
};

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard", key: "overview" },
  { icon: ShoppingCart, label: "Sales (POS)", path: "/dashboard/sales", key: "sales" },
  { icon: Boxes, label: "Inventory", path: "/dashboard/inventory", key: "inventory" },
  { icon: ShoppingBag, label: "Orders", path: "/dashboard/orders", key: "orders" },
  { icon: Users, label: "Customers", path: "/dashboard/customers", key: "customers" },
  { icon: Wallet, label: "Credit", path: "/dashboard/credit", key: "credit" },
  { icon: UserCog, label: "Staff", path: "/dashboard/staff", key: "staff" },
  { icon: DollarSign, label: "Cash", path: "/dashboard/cash", key: "cash" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics", key: "analytics" },
  { icon: FileText, label: "Reports", path: "/dashboard/reports", key: "reports" },
  { icon: Megaphone, label: "Promotions", path: "/dashboard/promotions", key: "promotions" },
  { icon: Truck, label: "Delivery", path: "/dashboard/delivery", key: "delivery" },
  { icon: CreditCard, label: "Payments", path: "/dashboard/payments", key: "payments" },
  { icon: Activity, label: "Activity Logs", path: "/dashboard/activity-logs", key: "activitylogs" },
  { icon: Store, label: "My Store", path: "/dashboard/store", key: "store" },
  { icon: Crown, label: "Upgrade", path: "/dashboard/upgrade", key: "upgrade" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings", key: "settings" },
  { icon: Shield, label: "Admin", path: "/dashboard/admin", key: "admin" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [userPlan, setUserPlan] = useState("trial");
  const [isAdmin, setIsAdmin] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchPlan = async () => {
      const [{ data: profile }, { data: role }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      ]);
      if (profile?.plan) setUserPlan(profile.plan.toLowerCase());
      if (role) setIsAdmin(true);
    };
    fetchPlan();
  }, [user]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const getAccessible = (key: string) => {
    if (isAdmin) return true;
    return (planAccess[userPlan] || planAccess.trial).includes(key);
  };

  const handleLockedClick = (key: string) => {
    const minPlan = featureMinPlan[key] || "Business";
    setLockedToast(`🔐 Requires ${minPlan} plan or higher`);
    setTimeout(() => setLockedToast(null), 3000);
  };

  const planLabel = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col z-40 overflow-visible"
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-3 h-16 border-b border-sidebar-border flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-brand">
            <img src={logoImg} alt="Vee" className="w-5 h-5 object-contain" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display font-bold text-sm text-white leading-none">Vee Digital</p>
              <p className="text-[10px] text-sidebar-foreground/40 font-body">Solutions</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-white hover:bg-primary transition-all shadow-md"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-visible scrollbar-thin">
          <div className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
              const accessible = getAccessible(item.key);
              const isHovered = hoveredItem === item.key;

              if (item.key === "admin" && !isAdmin) return null;

              // Locked item
              if (!accessible) {
                return (
                  <div key={item.path} className="relative"
                    onMouseEnter={() => collapsed && setHoveredItem(item.key)}
                    onMouseLeave={() => setHoveredItem(null)}>
                    <button
                      onClick={() => handleLockedClick(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground/25 cursor-pointer hover:bg-sidebar-accent/30 transition-all ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-body font-medium flex-1 text-left truncate">{item.label}</span>}
                      {!collapsed && <Lock size={12} className="text-yellow-500/60 flex-shrink-0" />}
                    </button>
                    {/* Bubble tooltip */}
                    <AnimatePresence>
                      {collapsed && isHovered && (
                        <motion.div
                          initial={{ opacity: 0, x: -8, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -8, scale: 0.9 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]"
                        >
                          <div className="relative bg-foreground text-background px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                            <span className="text-xs font-display font-semibold">{item.label}</span>
                            <Lock size={10} className="inline ml-1 text-yellow-400" />
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-foreground rotate-45" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <div key={item.path} className="relative"
                  onMouseEnter={() => collapsed && setHoveredItem(item.key)}
                  onMouseLeave={() => setHoveredItem(null)}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-brand"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-body font-medium truncate">{item.label}</span>}
                  </Link>
                  {/* Bubble tooltip */}
                  <AnimatePresence>
                    {collapsed && isHovered && (
                      <motion.div
                        initial={{ opacity: 0, x: -8, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -8, scale: 0.9 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]"
                      >
                        <div className="relative bg-foreground text-background px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                          <span className="text-xs font-display font-semibold">{item.label}</span>
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-foreground rotate-45" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-sidebar-border space-y-1 flex-shrink-0">
          <button onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all ${collapsed ? "justify-center" : ""}`}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span className="text-xs font-body">{theme === "dark" ? "Light" : "Dark"}</span>}
          </button>

          {!collapsed && user && (
            <div className="px-3 py-2 rounded-xl bg-sidebar-accent">
              <p className="text-[11px] font-display font-semibold text-white truncate">{user.email}</p>
              <p className="text-[10px] text-sidebar-foreground/50 font-body">{planLabel} Plan</p>
            </div>
          )}

          <button onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/15 transition-all ${collapsed ? "justify-center" : ""}`}>
            <LogOut size={18} />
            {!collapsed && <span className="text-xs font-body">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Toast */}
      <AnimatePresence>
        {lockedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-foreground text-background font-display font-semibold text-sm shadow-xl flex items-center gap-2"
          >
            {lockedToast}
            <Link to="/dashboard/upgrade" className="ml-2 text-primary underline text-xs">Upgrade →</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
