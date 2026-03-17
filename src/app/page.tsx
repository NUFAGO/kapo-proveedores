'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';

/**
 * 🏠 PÁGINA RAÍZ - REDIRECCIÓN INTELIGENTE POR TIPO DE USUARIO
 *
 * Responsabilidad: Redirigir según estado y tipo de autenticación
 * Flujo: Si está autenticado → Dashboard según tipo, si no → Login según tipo
 */

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Esperar a que cargue el estado de auth

    if (isAuthenticated && user) {
      // Usuario autenticado → redirigir según tipo
      if (user.tipo_usuario === 'proveedor') {
        router.push('/proveedor/dashboard');
      } else {
        // Admin o cualquier otro tipo → dashboard interno
        router.push('/dashboard');
      }
    } else {
      // Usuario no autenticado → redirigir al login interno
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mientras se redirige, mostrar una pantalla en blanco
  return (
    <div className="min-h-screen bg-gray-50">
      {/* La redirección se manejará en el useEffect */}
    </div>
  );
}