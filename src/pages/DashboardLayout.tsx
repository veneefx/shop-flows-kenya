import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Loader2, Bell } from "lucide-react";
import { motion } from "framer-motion";

const DashboardLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 ml-[68px] lg:ml-[240px] flex flex-col min-h-screen transition-all duration-200"
        id="dashboard-main"
      >
        <header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary hover:bg-accent transition-colors relative">
              <Bell size={16} className="text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
