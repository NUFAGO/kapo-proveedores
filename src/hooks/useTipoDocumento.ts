import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  GET_TIPOS_DOCUMENTO_QUERY,
  GET_TIPO_DOCUMENTO_QUERY,
  GET_TIPOS_DOCUMENTO_ACTIVOS_QUERY,
  GET_TIPOS_DOCUMENTO_INACTIVOS_QUERY,
  CREATE_TIPO_DOCUMENTO_MUTATION,
  UPDATE_TIPO_DOCUMENTO_MUTATION,
  DELETE_TIPO_DOCUMENTO_MUTATION
} from '@/graphql'

export interface TipoDocumento {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  estado: 'activo' | 'inactivo'
  fechaCreacion: string
  fechaActualizacion?: string
}

export interface TipoDocumentoInput {
  nombre: string
  descripcion?: string
  estado: 'activo' | 'inactivo'
}

export interface TipoDocumentoFiltros {
  nombre?: string
  estado?: 'activo' | 'inactivo'
}

export interface TipoDocumentoConnection {
  tiposDocumento: TipoDocumento[]
  totalCount: number
}

// Hook para listar tipos de documento con paginación y filtros
export function useTiposDocumento(filters?: TipoDocumentoFiltros, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['tiposDocumento', filters, limit, offset],
    queryFn: () => graphqlRequest(GET_TIPOS_DOCUMENTO_QUERY, {
      limit,
      offset,
      filters
    }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener un tipo de documento por ID
export function useTipoDocumento(id: string) {
  return useQuery({
    queryKey: ['tipoDocumento', id],
    queryFn: () => graphqlRequest(GET_TIPO_DOCUMENTO_QUERY, { id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener tipos de documento activos
export function useTiposDocumentoActivos() {
  return useQuery({
    queryKey: ['tiposDocumento', 'activos'],
    queryFn: () => graphqlRequest(GET_TIPOS_DOCUMENTO_ACTIVOS_QUERY),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener tipos de documento inactivos
export function useTiposDocumentoInactivos() {
  return useQuery({
    queryKey: ['tiposDocumento', 'inactivos'],
    queryFn: () => graphqlRequest(GET_TIPOS_DOCUMENTO_INACTIVOS_QUERY),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para crear un tipo de documento
export function useCrearTipoDocumento() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: TipoDocumentoInput) => 
      graphqlRequest(CREATE_TIPO_DOCUMENTO_MUTATION, { input }),
    onSuccess: () => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['tiposDocumento'] })
    },
    onError: (error) => {
      console.error('Error creando tipo de documento:', error)
    }
  })
}

// Hook para actualizar un tipo de documento
export function useActualizarTipoDocumento() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TipoDocumentoInput }) => 
      graphqlRequest(UPDATE_TIPO_DOCUMENTO_MUTATION, { id, input }),
    onSuccess: (_, variables) => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['tiposDocumento'] })
      // Invalidar la query específica por ID para tener datos actualizados
      queryClient.invalidateQueries({ queryKey: ['tipoDocumento', variables.id] })
    },
    onError: (error) => {
      console.error('Error actualizando tipo de documento:', error)
    }
  })
}

// Hook para eliminar un tipo de documento
export function useEliminarTipoDocumento() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      graphqlRequest(DELETE_TIPO_DOCUMENTO_MUTATION, { id }),
    onSuccess: () => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['tiposDocumento'] })
    },
    onError: (error) => {
      console.error('Error eliminando tipo de documento:', error)
    }
  })
}
