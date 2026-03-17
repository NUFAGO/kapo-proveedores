'use client';

import { useEffect, useState } from 'react';
import { Menu, Sun, Moon, Bell, Settings } from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/context/theme-context';
import { useAuth, useAuthProveedor } from '@/hooks';
import { usePathname } from 'next/navigation';

export function UniversalHeader() {
  const { toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  // Determinar qué auth usar según la ruta
  const isProveedorRoute = pathname.startsWith('/proveedor/');
  const authHook = isProveedorRoute ? useAuthProveedor() : useAuth();
  const { user } = authHook;
  
  const [userName, setUserName] = useState<string>('');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (user) {
      setUserName(user.nombres || user.usuario || 'Usuario');
    }
  }, [user]);

  const getPortalTitle = () => {
    return isProveedorRoute ? 'Portal Proveedores' : 'Panel Administrativo';
  };

  const getUserType = () => {
    return isProveedorRoute ? 'Proveedor' : 'Administrador';
  };

  return (
    <header className="flex-none flex h-[60px] items-center justify-between px-4 bg-[var(--header-bg)] sticky top-0 z-10 card-shadow">
      {/* Left side - Menu toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Menu className="w-5 h-5" />
        </button>

      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* User info */}
        <div className="flex items-center space-x-2 pl-3 border-l border-[var(--border-color)]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isProveedorRoute 
              ? 'bg-gradient-to-br from-green-500 to-teal-600' 
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {userName || 'Usuario'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">{getUserType()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
