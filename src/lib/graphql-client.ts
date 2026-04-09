/**
 * 🔗 GRAPHQL CLIENT - Cliente GraphQL para comunicación con backend
 *
 * Responsabilidad: Configurar cliente GraphQL para hacer requests
 * Flujo: Importado por hooks → Cliente HTTP para GraphQL
*/

import { GraphQLClient } from 'graphql-request'
import { dispatchSessionAuthRequired, isSessionAuthGraphQLError } from '@/lib/session-auth-error'

// URL del backend GraphQL (ajustar según configuración)
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8082/graphql'

function isProveedorBrowserRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/proveedor/');
}

/** Cabeceras para peticiones GraphQL multipart (solo Authorization; no Content-Type). */
export function getGraphQLAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Función para obtener el token de autenticación
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    
    // Detectar si estamos en una ruta de proveedor
    const isProveedorRoute = isProveedorBrowserRoute();
    
    if (isProveedorRoute) {
      // En rutas de proveedor, buscar primero auth_proveedor_token
      const proveedorTokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_proveedor_token='));
      if (proveedorTokenCookie) {
        return proveedorTokenCookie.split('=')[1];
      }
    }
    
    // Buscar auth_token (para admin o fallback)
    const adminTokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    if (adminTokenCookie) {
      return adminTokenCookie.split('=')[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

// Crear cliente GraphQL principal
export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
  },
})

// Función helper para hacer requests con manejo de errores y autenticación
export async function graphqlRequest<T = any>(
  query: string,
  variables?: any
): Promise<T> {
  try {
    // Obtener token para esta request específica
    const token = getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    // Si hay errores GraphQL, lanzarlos incluso si el status HTTP es 200
    if (result.errors && result.errors.length > 0) {
      const sessionAuth = result.errors.some((e: unknown) =>
        isSessionAuthGraphQLError(e as { message?: string; extensions?: { code?: string } })
      );
      if (sessionAuth && typeof window !== 'undefined') {
        const returnUrl = `${window.location.pathname}${window.location.search}`;
        dispatchSessionAuthRequired({
          returnUrl: returnUrl || '/',
          area: isProveedorBrowserRoute() ? 'proveedor' : 'admin',
        });
      }
      const errorMessages = result.errors.map((e: any) => e.message).join(', ');
      console.log('❌ GraphQL Errors:', result.errors);
      throw new Error(`GraphQL errors: ${errorMessages}`);
    }

    return result.data;
  } catch (error) {
    console.log('❌ GraphQL Request Error:', error);
    throw error;
  }
}
