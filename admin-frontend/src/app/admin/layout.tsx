'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Video, LayoutDashboard, Plus, PlayCircle, History, BarChart2, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/meetings/create', icon: Plus, label: 'Create Meeting' },
  { href: '/admin/meetings/active', icon: PlayCircle, label: 'Active Meetings' },
  { href: '/admin/meetings/history', icon: History, label: 'Meeting History' },
  { href: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, checkAuth, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setChecked(true));
  }, []);

  useEffect(() => {
    if (checked && !useAuthStore.getState().admin && !pathname.includes('/login')) {
      router.push('/admin/login');
    }
  }, [checked, pathname]);

  if (pathname.includes('/login')) return <>{children}</>;

  const handleLogout = () => { logout(); router.push('/admin/login'); };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/10 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">TST Meet</div>
            <div className="text-xs text-slate-400">Admin Portal</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {admin?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-medium truncate">{admin?.name}</div>
              <div className="text-slate-400 text-xs truncate">{admin?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm w-full px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5 text-white" />
        </button>
        <span className="text-white font-semibold">TST Meet Admin</span>
        <div className="w-5" />
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="pt-0 lg:pt-0 mt-14 lg:mt-0 p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
