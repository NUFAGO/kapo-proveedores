import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  LISTAR_CATEGORIAS_CHECKLIST_QUERY,
  OBTENER_CATEGORIA_CHECKLIST_QUERY,
  FIND_ACTIVAS_CATEGORIA_CHECKLIST_QUERY,
  FIND_INACTIVAS_CATEGORIA_CHECKLIST_QUERY,
  CREATE_CATEGORIA_CHECKLIST_MUTATION,
  UPDATE_CATEGORIA_CHECKLIST_MUTATION,
  DELETE_CATEGORIA_CHECKLIST_MUTATION
} from '@/graphql'

export interface CategoriaChecklist {
  id: string
  nombre: string
  descripcion?: string
  tipoUso: 'pago' | 'documentos_oc'
  permiteMultiple?: boolean
  permiteVincularReportes?: boolean
  estado: 'activo' | 'inactivo'
  fechaCreacion: string
  fechaActualizacion?: string
}

export interface CategoriaChecklistInput {
  nombre: string
  descripcion?: string
  tipoUso: 'pago' | 'documentos_oc'
  permiteMultiple?: boolean
  permiteVincularReportes?: boolean
  estado: 'activo' | 'inactivo'
}

export interface CategoriaChecklistFiltros {
  nombre?: string
  tipoUso?: 'pago' | 'documentos_oc'
  estado?: 'activo' | 'inactivo'
}

export interface CategoriaChecklistConnection {
  categoriasChecklist: CategoriaChecklist[]
  totalCount: number
}

// Hook para listar categorías de checklist con paginación y filtros
export function useCategoriasChecklist(filters?: CategoriaChecklistFiltros, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['categoriasChecklist', filters, limit, offset],
    queryFn: async () => {
      const result = await graphqlRequest(LISTAR_CATEGORIAS_CHECKLIST_QUERY, {
        limit,
        offset,
        filters
      });
      
      // Adaptar la respuesta anidada del GraphQL a la estructura esperada
      return {
        categoriasChecklist: result.listarCategoriasChecklist?.categoriasChecklist || [],
        totalCount: result.listarCategoriasChecklist?.totalCount || 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener una categoría de checklist por ID
export function useCategoriaChecklist(id: string) {
  return useQuery({
    queryKey: ['categoriaChecklist', id],
    queryFn: () => graphqlRequest(OBTENER_CATEGORIA_CHECKLIST_QUERY, { id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener categorías de checklist activas
export function useCategoriasChecklistActivas() {
  return useQuery({
    queryKey: ['categoriasChecklist', 'activas'],
    queryFn: () => graphqlRequest(FIND_ACTIVAS_CATEGORIA_CHECKLIST_QUERY),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener categorías de checklist inactivas
export function useCategoriasChecklistInactivas() {
  return useQuery({
    queryKey: ['categoriasChecklist', 'inactivas'],
    queryFn: () => graphqlRequest(FIND_INACTIVAS_CATEGORIA_CHECKLIST_QUERY),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para crear una categoría de checklist
export function useCrearCategoriaChecklist() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CategoriaChecklistInput) => 
      graphqlRequest(CREATE_CATEGORIA_CHECKLIST_MUTATION, { input }),
    onSuccess: () => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['categoriasChecklist'] })
    },
    onError: (error) => {
      console.error('Error creando categoría de checklist:', error)
    }
  })
}

// Hook para actualizar una categoría de checklist
export function useActualizarCategoriaChecklist() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoriaChecklistInput }) => 
      graphqlRequest(UPDATE_CATEGORIA_CHECKLIST_MUTATION, { id, input }),
    onSuccess: (_, variables) => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['categoriasChecklist'] })
      // Invalidar la query específica por ID para tener datos actualizados
      queryClient.invalidateQueries({ queryKey: ['categoriaChecklist', variables.id] })
    },
    onError: (error) => {
      console.error('Error actualizando categoría de checklist:', error)
    }
  })
}

// Hook para eliminar una categoría de checklist
export function useEliminarCategoriaChecklist() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      graphqlRequest(DELETE_CATEGORIA_CHECKLIST_MUTATION, { id }),
    onSuccess: () => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['categoriasChecklist'] })
    },
    onError: (error) => {
      console.error('Error eliminando categoría de checklist:', error)
    }
  })
}
