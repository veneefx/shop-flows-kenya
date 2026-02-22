import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  BarChart3, CreditCard, Settings, TrendingUp,
  LogOut, Store, Sun, Moon, ChevronLeft, ChevronRight,
  Bell, Crown, Shield
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import logoImg from "@/assets/logo.png";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Package, label: "Products", path: "/dashboard/products" },
  { icon: ShoppingBag, label: "Orders", path: "/dashboard/orders" },
  { icon: Users, label: "Customers", path: "/dashboard/customers" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: CreditCard, label: "Payments", path: "/dashboard/payments" },
  { icon: Store, label: "My Store", path: "/dashboard/store" },
  { icon: Crown, label: "Upgrade Plan", path: "/dashboard/upgrade" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: Shield, label: "Admin", path: "/dashboard/admin" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
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
            <p className="text-xs text-sidebar-foreground/50 font-body">Trial Plan</p>
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
  );
};

export default DashboardSidebar;
