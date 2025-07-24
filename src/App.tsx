// --- FILE: src/App.tsx (LENGKAP) ---
// Deskripsi: Versi ini berisi semua rute yang dibutuhkan, baik untuk publik,
//            barista, maupun semua halaman admin termasuk kelola barista.

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Halaman & Komponen Inti
import ProtectedRoute from './auth/components/ProtectedRoute';
import RoleGuard from './auth/components/RoleGuard';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout'; 
import BaristaPage from './pages/barista/BaristaPage';

// Halaman Publik (Ganti dengan komponen Anda)
import IndexPage from "@/pages/index";
import ProductPage from "@/pages/produk";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutHal from "@/pages/about";

// Halaman Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import MenuManagementPage from './pages/admin/MenuManagementPage'; 
import BaristaListPage from './pages/admin/BaristaListPage';
import BaristaDetailPage from './pages/admin/BaristaDetailPage';
import OrderHistoryPage from './pages/admin/OrderHistoryPage'; // <-- Impor halaman baru

// Layout untuk Halaman Publik
const PublicLayout = () => (
    <main>
        <Outlet />
    </main>
);

function App() {
  return (
    <Routes>
      {/* Rute Publik */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<IndexPage />} />
        <Route path="/produk" element={<ProductPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutHal />} />
        {/* Tambahkan rute detail produk Anda di sini jika ada */}
      </Route>

      {/* Rute Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rute Terproteksi */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/app/barista" replace />} />
        <Route path="barista" element={<BaristaPage />} />

        {/* Rute Khusus Admin */}
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
          
          {/* Rute untuk Kelola Barista */}
          <Route path="baristas" element={<BaristaListPage />} />
          <Route path="baristas/:baristaId" element={<BaristaDetailPage />} />
          <Route path="orders" element={<OrderHistoryPage />} /> {/* <-- Rute baru */}
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
