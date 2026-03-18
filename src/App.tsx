import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import PaymentsSettings from "./pages/dashboard/PaymentsSettings";
import ProductsPage from "./pages/dashboard/ProductsPage";
import OrdersPage from "./pages/dashboard/OrdersPage";
import CustomersPage from "./pages/dashboard/CustomersPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import UpgradePage from "./pages/dashboard/UpgradePage";
import MyStorePage from "./pages/dashboard/MyStorePage";
import AdminPage from "./pages/dashboard/AdminPage";
import SalesPage from "./pages/dashboard/SalesPage";
import InventoryPage from "./pages/dashboard/InventoryPage";
import CreditPage from "./pages/dashboard/CreditPage";
import StaffPage from "./pages/dashboard/StaffPage";
import CashPage from "./pages/dashboard/CashPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import PromotionsPage from "./pages/dashboard/PromotionsPage";
import DeliveryPage from "./pages/dashboard/DeliveryPage";
import ActivityLogsPage from "./pages/dashboard/ActivityLogsPage";
import HardwareSettingsPage from "./pages/dashboard/HardwareSettingsPage";
import AIInsightsPage from "./pages/dashboard/AIInsightsPage";
import DashboardHome from "./pages/dashboard/DashboardHome";
import PublicStorePage from "./pages/PublicStorePage";
import AIAssistant from "./components/AIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/store/:slug" element={<PublicStorePage />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="credit" element={<CreditPage />} />
                <Route path="staff" element={<StaffPage />} />
                <Route path="cash" element={<CashPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="promotions" element={<PromotionsPage />} />
                <Route path="delivery" element={<DeliveryPage />} />
                <Route path="payments" element={<PaymentsSettings />} />
                <Route path="activity-logs" element={<ActivityLogsPage />} />
                <Route path="hardware" element={<HardwareSettingsPage />} />
                <Route path="ai-insights" element={<AIInsightsPage />} />
                <Route path="store" element={<MyStorePage />} />
                <Route path="upgrade" element={<UpgradePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIAssistant />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
