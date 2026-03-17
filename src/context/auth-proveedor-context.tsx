'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authProveedorService, LoginProveedorResponse } from '@/services/auth-proveedor-service';

interface ProveedorUser {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  usuario: string;
  proveedor_id: string;
  proveedor_nombre: string;
  estado: 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO';
}

interface AuthProveedorContextType {
  user: ProveedorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usuario: string, contrasenna: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthProveedorContext = createContext<AuthProveedorContextType | undefined>(undefined);

export function AuthProveedorProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProveedorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const checkAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      // Verificar si hay token de proveedor en cookies y datos de usuario en localStorage
      const { getProveedorAuthToken } = await import('@/lib/cookies');
      const token = getProveedorAuthToken();
      const userData = localStorage.getItem('proveedor_user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Validar que el token sea válido
          const isValidToken = await authProveedorService.validateToken();
          if (isValidToken) {
            setUser(parsedUser);
          } else {
            // Token inválido, limpiar todo
            authProveedorService.logout();
            setUser(null);
          }
        } catch (parseError) {
          console.error('Error parsing proveedor user data:', parseError);
          localStorage.removeItem('proveedor_user');
          authProveedorService.logout();
          setUser(null);
        }
      } else {
        // Si no hay token o usuario, limpiar todo
        authProveedorService.logout();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking proveedor auth:', error);
      authProveedorService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (usuario: string, contrasenna: string) => {
      try {
        const loginData = await authProveedorService.login(usuario, contrasenna);
        setUser(loginData);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    authProveedorService.logout();
    setUser(null);

    // Redirigir al login de proveedor si estamos en una ruta de proveedor
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/proveedor/')) {
      window.location.href = '/proveedor/login';
    }
  }, []);

  // Solo ejecutar checkAuth después de que el componente esté montado
  useEffect(() => {
    setMounted(true);
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthProveedorContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: !mounted || isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthProveedorContext.Provider value={value}>{children}</AuthProveedorContext.Provider>;
}

export function useAuthProveedor() {
  const context = useContext(AuthProveedorContext);
  if (context === undefined) {
    throw new Error('useAuthProveedor must be used within an AuthProveedorProvider');
  }
  return context;
}
