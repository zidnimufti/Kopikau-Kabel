// src/App.tsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './auth/components/ProtectedRoute';
import RoleGuard from './auth/components/RoleGuard';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import BaristaPage from './pages/barista/BaristaPage';

import IndexPage from "@/pages/index";
import ProductPage from "@/pages/produk";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutHal from "@/pages/about";

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import BaristaListPage from './pages/admin/BaristaListPage';
import BaristaDetailPage from './pages/admin/BaristaDetailPage';
import OrderHistoryPage from './pages/admin/OrderHistoryPage';
import InventoryPage from './pages/admin/Inventory';

const PublicLayout = () => (
  <main>
    <Outlet />
  </main>
);

export default function App() {
  return (
    <Routes>
      {/* Publik */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<IndexPage />} />
        <Route path="/produk" element={<ProductPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutHal />} />
      </Route>

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* App terproteksi */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/app/barista" replace />} />
        <Route path="barista" element={<BaristaPage />} />

        {/* Admin */}
        <Route
          path="admin"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="menu" element={<MenuManagementPage />} />
          <Route path="baristas" element={<BaristaListPage />} />
          <Route path="baristas/:baristaId" element={<BaristaDetailPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />

          {/* Stok utama */}
          <Route path="stock" element={<InventoryPage />} />
        </Route>

        {/* Alias absolut: /app/admin/stok -> /app/admin/raw-stock */}
      </Route>
    </Routes>
  );
}
