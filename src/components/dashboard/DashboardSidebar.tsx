import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  BarChart3, CreditCard, Settings, TrendingUp,
  LogOut, Store, Sun, Moon, ChevronLeft, ChevronRight,
  Bell, Crown, Shield, Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";

// Plan hierarchy: which features are available on each plan
const planAccess: Record<string, string[]> = {
  trial: ["overview", "products", "orders", "store", "upgrade", "settings"],
  lite: ["overview", "products", "orders", "store", "upgrade", "settings"],
  starter: ["overview", "products", "orders", "customers", "store", "upgrade", "settings"],
  business: ["overview", "products", "orders", "customers", "analytics", "payments", "store", "upgrade", "settings"],
  enterprise: ["overview", "products", "orders", "customers", "analytics", "payments", "store", "upgrade", "settings", "admin"],
};

// Minimum plan required for each feature
const featureMinPlan: Record<string, string> = {
  customers: "Starter",
  analytics: "Business",
  payments: "Business",
  admin: "Enterprise",
};

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard", key: "overview" },
  { icon: Package, label: "Products", path: "/dashboard/products", key: "products" },
  { icon: ShoppingBag, label: "Orders", path: "/dashboard/orders", key: "orders" },
  { icon: Users, label: "Customers", path: "/dashboard/customers", key: "customers" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics", key: "analytics" },
  { icon: CreditCard, label: "Payments", path: "/dashboard/payments", key: "payments" },
  { icon: Store, label: "My Store", path: "/dashboard/store", key: "store" },
  { icon: Crown, label: "Upgrade Plan", path: "/dashboard/upgrade", key: "upgrade" },
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getAccessible = (key: string) => {
    if (isAdmin) return true; // Admins get everything
    const allowed = planAccess[userPlan] || planAccess.trial;
    return allowed.includes(key);
  };

  const handleLockedClick = (key: string) => {
    const minPlan = featureMinPlan[key] || "Business";
    setLockedToast(`🔐 This feature requires the ${minPlan} plan or higher`);
    setTimeout(() => setLockedToast(null), 3000);
  };

  const planLabel = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col z-40 overflow-hidden"
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 p-4 h-16 border-b border-sidebar-border flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-brand">
            <img src={logoImg} alt="Vee" className="w-5 h-5 object-contain" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display font-bold text-sm text-white leading-none whitespace-nowrap">Vee Digital</p>
              <p className="text-xs text-sidebar-foreground/40 whitespace-nowrap font-body">Solutions</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              const accessible = getAccessible(item.key);

              // Hide admin from non-admins entirely
              if (item.key === "admin" && !isAdmin) return null;

              if (!accessible) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleLockedClick(item.key)}
                    title={collapsed ? `${item.label} (Locked)` : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sidebar-foreground/30 cursor-pointer hover:bg-sidebar-accent/50 ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-display font-medium whitespace-nowrap flex-1 text-left">{item.label}</span>
                    )}
                    {!collapsed && <Lock size={14} className="text-yellow-500/70 flex-shrink-0" />}
                  </button>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-brand"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-display font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border space-y-2 flex-shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all ${collapsed ? "justify-center" : ""}`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span className="text-sm font-display font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* User info */}
          {!collapsed && user && (
            <div className="px-3 py-2 rounded-xl bg-sidebar-accent">
              <p className="text-xs font-display font-semibold text-white truncate">{user.email}</p>
              <p className="text-xs text-sidebar-foreground/50 font-body">{planLabel} Plan</p>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/15 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-display font-medium">Sign Out</span>}
          </button>

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs font-body">Collapse</span></>}
          </button>
        </div>
      </motion.aside>

      {/* Locked feature toast */}
      {lockedToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-foreground text-background font-display font-semibold text-sm shadow-xl flex items-center gap-2"
        >
          {lockedToast}
          <Link to="/dashboard/upgrade" className="ml-2 text-primary underline text-xs">
            Upgrade →
          </Link>
        </motion.div>
      )}
    </>
  );
};

export default DashboardSidebar;
