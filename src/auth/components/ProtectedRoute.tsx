import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Tampilkan loading HANYA saat sesi awal sedang diperiksa.
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Session...</div>;
  }

  // Setelah selesai, jika tidak ada user, arahkan ke login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada user, izinkan akses.
  return <Outlet />;
};

export default ProtectedRoute;
