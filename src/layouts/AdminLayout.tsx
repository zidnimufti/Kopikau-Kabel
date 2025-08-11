import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { useProfile } from '../auth/hooks/useProfile';
// ⬇️ Alias supaya tidak konflik dengan react-router-dom Link
import { Link as HeroLink } from '@heroui/link';

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const AdminLayout = () => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useProfile();

  const navLinkClasses =
    'flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-200';
  const activeNavLinkClasses = 'bg-gray-200 font-bold';

  const SidebarContent = () => (
    <>
      <div className="p-4">
        <h2 className="text-xl font-bold text-indigo-600">KopiKau Admin</h2>
        <h1>Welcome, {profile?.full_name || 'Admin'}</h1>
      </div>
      <nav className="p-2 flex-grow">
        <NavLink
          to="/app/admin/dashboard"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/app/admin/menu"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
          }
        >
          Menu
        </NavLink>
        <NavLink
          to="/app/admin/baristas"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
          }
        >
          Kelola Barista
        </NavLink>
        <NavLink
          to="/app/admin/orders"
          className={({ isActive }) =>
            `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
          }
        >
          Riwayat Order
        </NavLink>
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Kolom utama */}
      <div className="flex-1 flex flex-col">
        {/* Header mobile */}
        <header className="md:hidden bg-white shadow-sm flex justify-between items-center p-4">
          <h2 className="text-xl font-bold">
            <Link
              to="/app/admin/dashboard"
              className="text-indigo-600 hover:underline"
              aria-label="Buka Dashboard Admin"
            >
              KopiKau Admin
            </Link>
          </h2>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <MenuIcon className="h-6 w-6" />
          </button>
        </header>

        {/* Konten bergulir */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>

        {/* ⬇️ Footer seperti di halaman login */}
        <footer className="bg-white border-t w-full flex items-center justify-center py-3">
          <HeroLink
            isExternal
            className="flex items-center gap-1 text-current"
            href="https://www.instagram.com/zidni_mufti/"
          >
            <span className="text-default-600">Powered by</span>
            <p className="text-primary">Orang Ganteng</p>
          </HeroLink>
        </footer>
      </div>

      {/* Sidebar overlay mobile */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 flex z-40">
          <aside className="w-64 bg-white shadow-md flex flex-col">
            <SidebarContent />
          </aside>
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
