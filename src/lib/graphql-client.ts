/**
 * 🔗 GRAPHQL CLIENT - Cliente GraphQL para comunicación con backend
 *
 * Responsabilidad: Configurar cliente GraphQL para hacer requests
 * Flujo: Importado por hooks → Cliente HTTP para GraphQL
 */

import { GraphQLClient } from 'graphql-request'

// URL del backend GraphQL (ajustar según configuración)
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8082/graphql'

// Función para obtener el token de autenticación
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Obtener token de cookies (síncrono para cliente)
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
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
    
    // Logging para depuración
    console.log('🔍 GraphQL Request Debug:');
    console.log('- Token encontrado:', !!token);
    console.log('- Token length:', token?.length || 0);
    console.log('- Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('- Endpoint:', GRAPHQL_ENDPOINT);
    console.log('- Query:', query.substring(0, 50) + '...');
    
    // Decodificar token para verificar contenido
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('- Token payload:', payload);
          console.log('- Token expira en:', new Date(payload.exp * 1000).toLocaleString());
          console.log('- Token expirado:', Date.now() > payload.exp * 1000);
          console.log('- User ID:', payload.sub || payload.id);
          console.log('- Tipo usuario:', payload.tipo_usuario);
        } else {
          console.log('- ❌ Token no tiene formato JWT válido');
        }
      } catch (e) {
        console.log('- ❌ Error al decodificar token:', e);
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('- Authorization header agregado');
    } else {
      console.log('- ❌ No hay token para agregar');
    }
    
    console.log('- Headers finales:', headers);
    
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
