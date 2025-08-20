import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "@heroui/react";
import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectTo?: string; // default ke /app/barista
}

/**
 * RoleGuard
 * - Menunggu auth.loading dan loadingProfile sebelum evaluasi role.
 * - Jika role tidak cocok -> redirect ke redirectTo (default: /app/barista).
 * - Aman dipakai sendiri ataupun di dalam ProtectedRoute.
 */
const RoleGuard = ({ allowedRoles, children, redirectTo = "/app/barista" }: RoleGuardProps) => {
  const auth = useAuth() as any;
  const authLoading =
    typeof auth?.loading === "boolean" ? auth.loading : !!auth?.isLoading;

  const { profile, loadingProfile } = useProfile();

  if (authLoading || loadingProfile) {
    return (
      <div className="h-screen flex items-center justify-center gap-2">
        <Spinner size="sm" /> Checking permissions…
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;