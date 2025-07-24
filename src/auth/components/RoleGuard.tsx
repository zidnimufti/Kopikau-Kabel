import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { profile, loadingProfile } = useProfile();

  // Tampilkan loading saat profil sedang diambil.
  if (loadingProfile) {
    return <div className="flex items-center justify-center h-screen">Checking Permissions...</div>;
  }

  // Setelah selesai, periksa peran.
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/app/barista" replace />;
  }

  // Jika peran sesuai, izinkan akses.
  return <>{children}</>;
};

export default RoleGuard;
