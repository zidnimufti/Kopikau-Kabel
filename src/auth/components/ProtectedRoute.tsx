import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@heroui/react";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute
 * - Menunggu pemulihan sesi (loading) sebelum memutuskan redirect.
 * - Kompatibel dengan context yang memakai "loading" atau "isLoading".
 */
const ProtectedRoute = () => {
  // kompatibel dengan 2 nama properti
  const auth = useAuth() as any;
  const user = auth?.user ?? null;
  const loading =
    typeof auth?.loading === "boolean" ? auth.loading : !!auth?.isLoading;

  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center gap-2">
        <Spinner size="sm" /> Memulihkan sesi…
      </div>
    );
  }

  if (!user) {
    // simpan lokasi asal agar bisa kembali setelah login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
