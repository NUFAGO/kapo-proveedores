import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  LISTAR_TIPOS_SOLICITUD_PAGO_QUERY,
  OBTENER_TIPO_SOLICITUD_PAGO_QUERY,
  FIND_ACTIVOS_SOLICITUD_PAGO_QUERY,
  FIND_INACTIVOS_SOLICITUD_PAGO_QUERY,
  CREATE_TIPO_SOLICITUD_PAGO_MUTATION,
  UPDATE_TIPO_SOLICITUD_PAGO_MUTATION,
  DELETE_TIPO_SOLICITUD_PAGO_MUTATION
} from '@/graphql'

export interface TipoSolicitudPago {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria: 'anticipado' | 'avance' | 'cierre' | 'entrega' | 'gasto' | 'ajuste'
  permiteMultiple: boolean
  permiteVincularReportes: boolean
  estado: 'activo' | 'inactivo'
  fechaCreacion: string
  fechaActualizacion?: string
}

export interface TipoSolicitudPagoInput {
  nombre: string
  descripcion?: string
  categoria: 'anticipado' | 'avance' | 'cierre' | 'entrega' | 'gasto' | 'ajuste'
  permiteMultiple: boolean
  permiteVincularReportes: boolean
  estado: 'activo' | 'inactivo'
}

export interface TipoSolicitudPagoFiltros {
  nombre?: string
  categoria?: 'anticipado' | 'avance' | 'cierre' | 'entrega' | 'gasto' | 'ajuste'
  estado?: 'activo' | 'inactivo'
}

export interface TipoSolicitudPagoConnection {
  tiposSolicitudPago: TipoSolicitudPago[]
  totalCount: number
}

// Hook para listar tipos de solicitud de pago con paginación y filtros
export function useTiposSolicitudPago(filters?: TipoSolicitudPagoFiltros, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['tiposSolicitudPago', filters, limit, offset],
    queryFn: async () => {
      const result = await graphqlRequest(LISTAR_TIPOS_SOLICITUD_PAGO_QUERY, {
        limit,
        offset,
        filters
      });
      
      // Adaptar la respuesta anidada del GraphQL a la estructura esperada
      return {
        tiposSolicitudPago: result.listarTiposSolicitudPago?.tiposSolicitudPago || [],
        totalCount: result.listarTiposSolicitudPago?.totalCount || 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener un tipo de solicitud de pago por ID
export function useTipoSolicitudPago(id: string) {
  return useQuery({
    queryKey: ['tipoSolicitudPago', id],
    queryFn: () => graphqlRequest(OBTENER_TIPO_SOLICITUD_PAGO_QUERY, { id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener tipos de solicitud de pago activos
export function useTiposSolicitudPagoActivos() {
  return useQuery({
    queryKey: ['tiposSolicitudPago', 'activos'],
    queryFn: () => graphqlRequest(FIND_ACTIVOS_SOLICITUD_PAGO_QUERY),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener tipos de solicitud de pago inactivos
export function useTiposSolicitudPagoInactivos() {
  return useQuery({
    queryKey: ['tiposSolicitudPago', 'inactivos'],
    queryFn: () => graphqlRequest(FIND_INACTIVOS_SOLICITUD_PAGO_QUERY),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para crear un tipo de solicitud de pago
export function useCrearTipoSolicitudPago() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: TipoSolicitudPagoInput) => 
      graphqlRequest(CREATE_TIPO_SOLICITUD_PAGO_MUTATION, { input }),
    onSuccess: () => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['tiposSolicitudPago'] })
    },
    onError: (error) => {
      console.error('Error creando tipo de solicitud de pago:', error)
    }
  })
}

// Hook para actualizar un tipo de solicitud de pago
export function useActualizarTipoSolicitudPago() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TipoSolicitudPagoInput }) => 
      graphqlRequest(UPDATE_TIPO_SOLICITUD_PAGO_MUTATION, { id, input }),
    onSuccess: (_, variables) => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['tiposSolicitudPago'] })
      // Invalidar la query específica por ID para tener datos actualizados
      queryClient.invalidateQueries({ queryKey: ['tipoSolicitudPago', variables.id] })
    },
    onError: (error) => {
      console.error('Error actualizando tipo de solicitud de pago:', error)
    }
  })
}

// Hook para eliminar un tipo de solicitud de pago
export function useEliminarTipoSolicitudPago() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      graphqlRequest(DELETE_TIPO_SOLICITUD_PAGO_MUTATION, { id }),
    onSuccess: () => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['tiposSolicitudPago'] })
    },
    onError: (error) => {
      console.error('Error eliminando tipo de solicitud de pago:', error)
    }
  })
}
