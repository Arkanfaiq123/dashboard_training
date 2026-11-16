import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/participants', icon: Users, label: 'Data Peserta' },
  { to: '/admin/documents', icon: FileCheck, label: 'Kelengkapan Dokumen' },
  { to: '/admin/attendance-import', icon: ClipboardList, label: 'Import Absensi' },
  { to: '/admin/reports', icon: BarChart3, label: 'Laporan & Rekap' },
  { to: '/admin/settings', icon: Settings, label: 'Pengaturan' },
];

function getBreadcrumbs(pathname) {
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean);
  const crumbs = [{ label: 'Dashboard', path: '/admin' }];

  const labelMap = {
    dashboard: 'Overview',
    participants: 'Data Peserta',
    documents: 'Kelengkapan Dokumen',
    'attendance-import': 'Import Absensi',
    reports: 'Laporan & Rekap',
    settings: 'Pengaturan',
  };

  let currentPath = '/admin';
  segments.forEach((seg) => {
    currentPath += `/${seg}`;
    crumbs.push({
      label: labelMap[seg] || seg,
      path: currentPath,
    });
  });

  return crumbs;
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FBF9FD] flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-68 bg-white border-r border-neutral-200/80 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto shadow-[var(--shadow-sidebar)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Brand Header */}
        <div className="h-18 flex items-center gap-3 px-6 border-b border-neutral-100 shrink-0 bg-gradient-to-r from-mr-purple/5 to-transparent">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-mr-purple-dark via-mr-purple to-mr-purple-light flex items-center justify-center shadow-[var(--shadow-purple-sm)] text-white font-extrabold text-sm tracking-wide">
            AE
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-neutral-900 leading-tight">
              My<span className="text-mr-purple">Republic</span>
            </span>
            <span className="text-[11px] font-semibold text-mr-purple tracking-wide flex items-center gap-1">
              AE Training 2026
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
            Menu Utama
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-gradient-to-r from-mr-purple to-mr-purple-light text-white shadow-[var(--shadow-purple-sm)] font-bold'
                        : 'text-neutral-600 hover:bg-mr-purple-50 hover:text-mr-purple'
                    )
                  }
                >
                  <item.icon size={18} strokeWidth={2} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Card */}
        <div className="border-t border-neutral-100 p-4 shrink-0 bg-neutral-50/60">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-mr-purple/20 to-mr-purple/5 text-mr-purple flex items-center justify-center font-bold text-xs shrink-0 border border-mr-purple/20">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {user?.email || 'admin@myrepublic.co.id'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="Keluar"
              className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-18 bg-white/90 backdrop-blur-md border-b border-neutral-200/70 flex items-center gap-4 px-4 lg:px-8 shrink-0 sticky top-0 z-30 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-600 lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-1.5 text-xs">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={crumb.path} className="flex items-center gap-1.5">
                    {idx > 0 && <ChevronRight size={13} className="text-neutral-300" />}
                    {isLast ? (
                      <span className="font-bold text-mr-purple bg-mr-purple/10 px-2.5 py-1 rounded-lg">
                        {crumb.label}
                      </span>
                    ) : (
                      <NavLink
                        to={crumb.path}
                        className="text-neutral-500 hover:text-mr-purple font-medium transition-colors"
                      >
                        {crumb.label}
                      </NavLink>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif 2026
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
