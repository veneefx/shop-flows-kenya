import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart, Package, Users, BarChart3, Wallet, Users2, Tag, CreditCard,
  Zap, Store, TrendingUp, Settings, ArrowUp, LogOut, Search, Bell, Menu, X, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Tile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  image: string;
  color: string;
  plans: string[];
}

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todaySales: 0, totalOrders: 0, lowStockCount: 0 });

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      const [{ data: prof }, { data: shops }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("shops").select("*").eq("user_id", user.id).order("created_at").limit(1),
      ]);
      setProfile(prof);
      setShop(shops?.[0] || null);
      
      // Load real-time stats
      if (shops?.[0]) {
        await loadStats(shops[0].id);
        subscribeToStats(shops[0].id);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const loadStats = async (shopId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [{ data: orders }, { data: products }] = await Promise.all([
        supabase
          .from("orders")
          .select("total_amount")
          .eq("shop_id", shopId)
          .eq("status", "paid")
          .gte("created_at", today.toISOString()),
        supabase
          .from("products")
          .select("id, quantity")
          .eq("shop_id", shopId)
          .lt("quantity", 10),
      ]);
      
      const todaySales = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const lowStockCount = (products || []).length;
      
      setStats({
        todaySales,
        totalOrders: (orders || []).length,
        lowStockCount,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const subscribeToStats = (shopId: string) => {
    const ordersSubscription = supabase
      .channel(`orders-${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
        () => loadStats(shopId)
      )
      .subscribe();

    const productsSubscription = supabase
      .channel(`products-${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `shop_id=eq.${shopId}` },
        () => loadStats(shopId)
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      productsSubscription.unsubscribe();
    };
  };

  const userPlan = profile?.plan || "basic";

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (shop?.id) {
        supabase.channel(`orders-${shop.id}`).unsubscribe();
        supabase.channel(`products-${shop.id}`).unsubscribe();
      }
    };
  }, [shop?.id]);

  // Define all tiles
  const allTiles: Tile[] = [
    {
      id: "sales",
      title: "Sales (POS)",
      description: "Fast checkout & billing",
      icon: <ShoppingCart size={32} />,
      path: "/dashboard/sales",
      image: "/dashboard-tiles/sales.jpg",
      color: "from-blue-500 to-cyan-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "inventory",
      title: "Inventory",
      description: "Stock management",
      icon: <Package size={32} />,
      path: "/dashboard/inventory",
      image: "/dashboard-tiles/inventory.jpg",
      color: "from-purple-500 to-pink-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "customers",
      title: "Customers",
      description: "Customer management",
      icon: <Users size={32} />,
      path: "/dashboard/customers",
      image: "/dashboard-tiles/customers.jpg",
      color: "from-green-500 to-emerald-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "reports",
      title: "Reports",
      description: "Sales & analytics",
      icon: <BarChart3 size={32} />,
      path: "/dashboard/reports",
      image: "/dashboard-tiles/reports.jpg",
      color: "from-orange-500 to-red-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "cash",
      title: "Cash Management",
      description: "Money tracking",
      icon: <Wallet size={32} />,
      path: "/dashboard/cash",
      image: "/dashboard-tiles/cash.jpg",
      color: "from-yellow-500 to-orange-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "staff",
      title: "Staff",
      description: "Team management",
      icon: <Users2 size={32} />,
      path: "/dashboard/staff",
      image: "/dashboard-tiles/staff.jpg",
      color: "from-indigo-500 to-purple-500",
      plans: ["pro", "enterprise"],
    },
    {
      id: "promotions",
      title: "Promotions",
      description: "Discounts & offers",
      icon: <Tag size={32} />,
      path: "/dashboard/promotions",
      image: "/dashboard-tiles/promotions.jpg",
      color: "from-rose-500 to-pink-500",
      plans: ["pro", "enterprise"],
    },
    {
      id: "credit",
      title: "Credit Management",
      description: "Customer credit",
      icon: <CreditCard size={32} />,
      path: "/dashboard/credit",
      image: "/dashboard-tiles/credit.jpg",
      color: "from-teal-500 to-cyan-500",
      plans: ["pro", "enterprise"],
    },
    {
      id: "ai-insights",
      title: "AI Insights",
      description: "Smart analytics",
      icon: <Zap size={32} />,
      path: "/dashboard/ai-insights",
      image: "/dashboard-tiles/ai.jpg",
      color: "from-violet-500 to-purple-500",
      plans: ["enterprise"],
    },
    {
      id: "store",
      title: "My Store",
      description: "Store settings",
      icon: <Store size={32} />,
      path: "/dashboard/store",
      image: "/dashboard-tiles/store.jpg",
      color: "from-slate-500 to-gray-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "settings",
      title: "Settings",
      description: "Configuration",
      icon: <Settings size={32} />,
      path: "/dashboard/settings",
      image: "/dashboard-tiles/settings.jpg",
      color: "from-gray-500 to-slate-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "upgrade",
      title: "Upgrade Plan",
      description: "Get more features",
      icon: <ArrowUp size={32} />,
      path: "/dashboard/upgrade",
      image: "/dashboard-tiles/upgrade.jpg",
      color: "from-amber-500 to-yellow-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "products",
      title: "Products",
      description: "Manage catalog",
      icon: <Package size={32} />,
      path: "/dashboard/products",
      image: "/dashboard-tiles/products.jpg",
      color: "from-cyan-500 to-blue-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "orders",
      title: "Orders",
      description: "Order history",
      icon: <ShoppingCart size={32} />,
      path: "/dashboard/orders",
      image: "/dashboard-tiles/orders.jpg",
      color: "from-green-500 to-teal-500",
      plans: ["basic", "pro", "enterprise"],
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Business insights",
      icon: <TrendingUp size={32} />,
      path: "/dashboard/analytics",
      image: "/dashboard-tiles/analytics.jpg",
      color: "from-pink-500 to-rose-500",
      plans: ["pro", "enterprise"],
    },
    {
      id: "delivery",
      title: "Delivery",
      description: "Shipping & logistics",
      icon: <Package size={32} />,
      path: "/dashboard/delivery",
      image: "/dashboard-tiles/delivery.jpg",
      color: "from-lime-500 to-green-500",
      plans: ["pro", "enterprise"],
    },
    {
      id: "activity",
      title: "Activity Logs",
      description: "System logs",
      icon: <AlertCircle size={32} />,
      path: "/dashboard/activity-logs",
      image: "/dashboard-tiles/activity.jpg",
      color: "from-red-500 to-orange-500",
      plans: ["enterprise"],
    },
    {
      id: "hardware",
      title: "Hardware",
      description: "Device settings",
      icon: <Package size={32} />,
      path: "/dashboard/hardware",
      image: "/dashboard-tiles/hardware.jpg",
      color: "from-blue-500 to-indigo-500",
      plans: ["pro", "enterprise"],
    },
  ];

  // Filter tiles based on plan
  const visibleTiles = allTiles.filter(tile => tile.plans.includes(userPlan));

  // Filter tiles based on search
  const filteredTiles = visibleTiles.filter(tile =>
    tile.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tile.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTileClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Store size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-black text-lg text-foreground">Duka Langu</h1>
              <p className="text-xs text-muted-foreground font-body">{shop?.shop_name || "Dashboard"}</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
              />
            </div>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-accent transition-colors relative">
              <Bell size={16} className="text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-display font-semibold text-foreground">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground font-body capitalize">{userPlan} Plan</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border p-4 space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm font-display font-semibold text-foreground">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground font-body capitalize">{userPlan} Plan</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-display font-semibold hover:bg-red-500/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Today's Sales" value={`KSh ${stats.todaySales.toLocaleString()}`} icon={<ShoppingCart size={20} />} />
          <StatCard label="Total Orders" value={stats.totalOrders.toString()} icon={<Package size={20} />} />
          <StatCard label="Low Stock" value={stats.lowStockCount.toString()} icon={<AlertCircle size={20} />} />
          <StatCard label="Plan" value={userPlan.toUpperCase()} icon={<Zap size={20} />} />
        </div>

        {/* Tiles Grid */}
        <div>
          <h2 className="font-display font-bold text-xl text-foreground mb-6">
            {searchTerm ? `Search Results (${filteredTiles.length})` : "Modules"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTiles.map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => handleTileClick(tile.path)}
                className="group cursor-pointer"
              >
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  {/* Background Image */}
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70 group-hover:from-black/50 group-hover:via-black/60 group-hover:to-black/80 transition-all duration-300" />

                  {/* Icon */}
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white/30 transition-all">
                    {tile.icon}
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h3 className="font-display font-bold text-lg text-white mb-1">{tile.title}</h3>
                    <p className="text-sm text-white/80 font-body">{tile.description}</p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                    →
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTiles.length === 0 && (
            <div className="text-center py-16">
              <Search size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground">No modules found</p>
              <p className="text-sm text-muted-foreground font-body mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">{label}</p>
      <div className="text-primary/60">{icon}</div>
    </div>
    <p className="font-display font-black text-xl text-foreground">{value}</p>
  </div>
);

export default DashboardHome;
