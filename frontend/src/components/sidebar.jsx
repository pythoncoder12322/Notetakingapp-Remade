import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { FaHeart } from "react-icons/fa";

import {
  Target,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  CalendarRange,
  LayoutDashboard,
  Warehouse,
  Pin,
  Bot,
  House
} from 'lucide-react';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const logout = () => {
    console.log('Logging out...');
    setIsAuthenticated(false);
  };
  const login = () => {
    console.log('Logging in...');
    setIsAuthenticated(true);
  };
  return { isAuthenticated, logout, login };
};

const navLinks = [
  { name: 'Home', href: '/', icon: House },
  { name: 'Tutorial', href: '/tutorial', icon: LayoutDashboard },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Message', href: '/message', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const { isAuthenticated, logout, login } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={clsx(
        'relative flex flex-col min-h-screen border-r border-neutral-900 bg-black text-white shadow-2xl overflow-hidden z-10 transition-all duration-300',
        collapsed ? 'w-20 !p-3' : 'w-64 !p-6'
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full !p-1 shadow-md border border-neutral-800"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      <div className="mb-8 z-10 flex items-center justify-center">
        {!collapsed && (
          <a
            href="/dashboard"
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            className="w-full flex justify-between items-center text-white"
          >
            <div className="p-3 rounded-xl bg-neutral-900 mr-3 text-white">
              <FaHeart className="w-6 h-6" />
            </div>
            <div className='flex-1'>
              <div className="text-[1.5rem] font-semibold tracking-tight">Community</div>
              <div className='text-xl font-semibold tracking-tight text-gray-400'>Connect</div>
            </div>
          </a>
        )}
      </div>

      {!collapsed && (
        <div className="text-gray-500 font-semibold text-sm mb-3">MENU</div>
      )}

      <nav className="flex-1 z-10">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const LinkIcon = link.icon;
            const isActive =
                link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href) && link.href !== '/';


            return (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                  className={clsx(
                    'relative flex items-center gap-4 !px-4 !py-3 rounded-lg font-medium transition-colors duration-200',
                    {
                      'bg-neutral-800 text-white border-l-4 border-white': isActive,
                      'hover:bg-neutral-900 hover:text-white text-gray-300': !isActive,
                      'justify-center border-l-0': collapsed,
                    }
                  )}
                >
                  <LinkIcon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="truncate">{link.name}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto !pt-6 border-t border-neutral-900 z-10">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center w-full !px-4 !py-3 text-red-500 hover:bg-neutral-900 rounded-lg transition-colors duration-200',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            {!collapsed && <span className="truncate">Log Out</span>}
          </button>
        ) : (
          <a
            href="/login"
            onClick={(e) => { e.preventDefault(); navigate('/login'); login(); }}
            className={clsx(
              'flex items-center w-full !px-4 !py-3 text-green-500 hover:bg-neutral-900 rounded-lg transition-colors duration-200',
              collapsed && 'justify-center'
            )}
          >
            <LogIn className="w-5 h-5 mr-3 shrink-0" />
            {!collapsed && <span className="truncate">Login</span>}
          </a>
        )}
        {!collapsed && <p className="text-gray-500 text-xs mt-2 text-center">v0.1.0</p>}
      </div>
    </aside>
  );
}
