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
                <Route index element={<DashboardOverview />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="payments" element={<PaymentsSettings />} />
                <Route path="store" element={<MyStorePage />} />
                <Route path="upgrade" element={<UpgradePage />} />
                <Route path="settings" element={<SettingsPage />} />
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
