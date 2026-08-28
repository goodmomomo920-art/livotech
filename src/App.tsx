import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { HomePage } from '@/pages/public/HomePage';
import { ProductsPage } from '@/pages/public/ProductsPage';
import { ProductDetailPage } from '@/pages/public/ProductDetailPage';
import { AddonsPage } from '@/pages/public/AddonsPage';
import { SolutionsPage } from '@/pages/public/SolutionsPage';
import { PricingPage } from '@/pages/public/PricingPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { FaqPage } from '@/pages/public/FaqPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview';
import { DashboardProducts } from '@/pages/dashboard/DashboardProducts';
import { DashboardOrders } from '@/pages/dashboard/DashboardOrders';
import { DashboardSubscriptions } from '@/pages/dashboard/DashboardSubscriptions';
import { DashboardDownloads } from '@/pages/dashboard/DashboardDownloads';
import { DashboardSupport } from '@/pages/dashboard/DashboardSupport';
import { DashboardSettings } from '@/pages/dashboard/DashboardSettings';
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs';
import { AdminAddons } from '@/pages/admin/AdminAddons';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/products" element={<PublicLayout><ProductsPage /></PublicLayout>} />
      <Route path="/products/:slug" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
      <Route path="/addons" element={<PublicLayout><AddonsPage /></PublicLayout>} />
      <Route path="/solutions" element={<PublicLayout><SolutionsPage /></PublicLayout>} />
      <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
      <Route path="/faq" element={<PublicLayout><FaqPage /></PublicLayout>} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/dashboard" element={<RequireAuth><CustomerLayout><DashboardOverview /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/products" element={<RequireAuth><CustomerLayout><DashboardProducts /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/orders" element={<RequireAuth><CustomerLayout><DashboardOrders /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/subscriptions" element={<RequireAuth><CustomerLayout><DashboardSubscriptions /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/downloads" element={<RequireAuth><CustomerLayout><DashboardDownloads /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/support" element={<RequireAuth><CustomerLayout><DashboardSupport /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/settings" element={<RequireAuth><CustomerLayout><DashboardSettings /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/websites" element={<RequireAuth><CustomerLayout><DashboardProducts /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/systems" element={<RequireAuth><CustomerLayout><DashboardProducts /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/digital-products" element={<RequireAuth><CustomerLayout><DashboardProducts /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/addons" element={<RequireAuth><CustomerLayout><DashboardProducts /></CustomerLayout></RequireAuth>} />
      <Route path="/dashboard/billing" element={<RequireAuth><CustomerLayout><DashboardOrders /></CustomerLayout></RequireAuth>} />

      <Route path="/admin" element={<RequireAdmin><AdminLayout><AdminOverview /></AdminLayout></RequireAdmin>} />
      <Route path="/admin/customers" element={<RequireAdmin><AdminLayout><AdminCustomers /></AdminLayout></RequireAdmin>} />
      <Route path="/admin/products" element={<RequireAdmin><AdminLayout><AdminProducts /></AdminLayout></RequireAdmin>} />
      <Route path="/admin/orders" element={<RequireAdmin><AdminLayout><AdminOrders /></AdminLayout></RequireAdmin>} />
      <Route path="/admin/settings" element={<RequireAdmin><AdminLayout><AdminSettings /></AdminLayout></RequireAdmin>} />
      <Route path="/admin/audit-logs" element={<RequireAdmin><AdminLayout><AdminAuditLogs /></AdminLayout></RequireAdmin>} />
      <Route path="/admin/addons" element={<RequireAdmin><AdminLayout><AdminAddons /></AdminLayout></RequireAdmin>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
