import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, Store, Bell, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const DashboardLayout = () => {
  const { user, loading, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isHomePage = pathname === "/dashboard" || pathname === "/dashboard/";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header - Only show on non-home pages */}
      {!isHomePage && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-full mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
            {/* Left: Back Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors text-foreground font-display font-semibold text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </motion.button>

            {/* Center: Logo/Branding */}
            <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Store size={16} className="text-primary-foreground" />
              </div>
              <h1 className="font-display font-black text-base text-foreground hidden sm:block">
                Duka Langu
              </h1>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center gap-3">
              <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary hover:bg-accent transition-colors relative">
                <Bell size={16} className="text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-display font-bold text-xs"
                >
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </button>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border mb-2">
                      <p className="text-xs text-muted-foreground font-body">Signed in as</p>
                      <p className="text-sm font-display font-semibold text-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-600 dark:text-red-400 text-sm font-display font-semibold"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content - Full Width */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 w-full"
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
