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
