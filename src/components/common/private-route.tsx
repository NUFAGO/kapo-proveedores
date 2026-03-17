'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useAuthProveedor } from '@/hooks';
import { LoadingSpinner } from '@/components/ui';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Determinar qué auth usar según la ruta
  const isProveedorRoute = pathname.startsWith('/proveedor/');
  const authHook = isProveedorRoute ? useAuthProveedor() : useAuth();
  const { isAuthenticated, isLoading } = authHook;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirigir al login correspondiente
      if (isProveedorRoute) {
        router.push('/proveedor/login');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router, isProveedorRoute]);

  if (isLoading) {
    return <LoadingSpinner fullScreen={true} showText={true} text="Cargando..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}