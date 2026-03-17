'use client';

import { ReactNode } from 'react';
import { UniversalHeader } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { PrivateRoute } from '@/components/common';
import { SidebarProvider } from '@/context/sidebar-context';

interface MainLayoutProps {
  children: ReactNode;
  tipo: 'admin' | 'proveedor';
}

/**
 * Layout principal de la aplicación (main layout)
 * 
 * Contiene la estructura principal: header + sidebar + contenido
 * Se usa para admin y proveedores, solo cambia el tipo de sidebar
 */
export function MainLayout({ children, tipo }: MainLayoutProps) {
  return (
    <PrivateRoute>
      <SidebarProvider>
        <div className="flex h-screen">
          <Sidebar tipo={tipo} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <UniversalHeader />
            <main className="flex-1 overflow-auto bg-[var(--content-bg)] p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </PrivateRoute>
  );
}
