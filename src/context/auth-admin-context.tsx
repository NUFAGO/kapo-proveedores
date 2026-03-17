'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, LoginResponse } from '@/services/auth-service';

export interface AdminUser {
  id: string;
  nombresA?: string;
  nombres?: string;
  usuario: string;
  tipo_usuario?: string;
  proveedor_id?: string | null;
  estado?: string;
  role?: {
    id: string;
    nombre: string;
  };
}

export interface AuthAdminContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usuario: string, contrasenna: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthAdminContext = createContext<AuthAdminContextType | undefined>(undefined);

export function AuthAdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const checkAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      // Verificar si hay token en cookies y datos de usuario en localStorage
      const { getAdminAuthToken } = await import('@/lib/cookies');
      const token = getAdminAuthToken();
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // Si no hay token o usuario, limpiar todo
        authService.logout();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (usuario: string, contrasenna: string) => {
      try {
        const loginData = await authService.login(usuario, contrasenna);
        setUser(loginData.usuario);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Solo ejecutar checkAuth después de que el componente esté montado
  useEffect(() => {
    setMounted(true);
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthAdminContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: !mounted || isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthAdminContext.Provider value={value}>{children}</AuthAdminContext.Provider>;
}

export function useAuthAdmin() {
  const context = useContext(AuthAdminContext);
  if (context === undefined) {
    throw new Error('useAuthAdmin must be used within an AuthAdminProvider');
  }
  return context;
}

// Alias para compatibilidad con el código existente
export function useAuth() {
  return useAuthAdmin();
}
