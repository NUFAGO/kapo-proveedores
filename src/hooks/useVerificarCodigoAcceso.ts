import { useQuery } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { VERIFICAR_CODIGO_ACCESO_QUERY } from '@/graphql'

export interface VerificacionCodigoResponse {
  valido: boolean
  proveedorId?: string
  proveedor?: {
    id: string
    ruc: string
    razon_social: string
    nombre_comercial: string
    estado: string
    correo: string
    telefono: string
  }
  error?: string
  tipo?: string
}

/**
 * Hook para verificar código de acceso y obtener datos del proveedor
 */
export function useVerificarCodigoAcceso() {
  return useQuery({
    queryKey: ['verificarCodigoAcceso'],
    queryFn: async () => {
      throw new Error('Este hook debe ser ejecutado con refetch y el código como parámetro')
    },
    enabled: false, // Solo se ejecuta manualmente
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Función para verificar un código de acceso específico
 */
export async function verificarCodigoAcceso(codigo: string): Promise<VerificacionCodigoResponse> {
  if (!codigo) {
    throw new Error('Código no proporcionado')
  }
  
  const response = await graphqlRequest<{
    verificarCodigoAcceso: VerificacionCodigoResponse
  }>(VERIFICAR_CODIGO_ACCESO_QUERY, { codigo })

  return response.verificarCodigoAcceso
}
