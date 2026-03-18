import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  LISTAR_PLANTILLAS_CHECKLIST_QUERY,
  OBTENER_PLANTILLA_CHECKLIST_QUERY,
  FIND_ACTIVAS_PLANTILLA_CHECKLIST_QUERY,
  FIND_INACTIVAS_PLANTILLA_CHECKLIST_QUERY,
  FIND_VIGENTES_PLANTILLA_CHECKLIST_QUERY,
  OBTENER_VERSIONES_POR_CODIGO_QUERY,
  OBTENER_VERSION_VIGENTE_POR_CODIGO_QUERY
} from '@/graphql/queries/plantilla-checklist.queries'
import {
  CREATE_PLANTILLA_CHECKLIST_MUTATION as CREATE_MUTATION,
  UPDATE_PLANTILLA_CHECKLIST_MUTATION as UPDATE_MUTATION,
  DELETE_PLANTILLA_CHECKLIST_MUTATION as DELETE_MUTATION,
  CREAR_NUEVA_VERSION_MUTATION
} from '@/graphql/mutations/plantilla-checklist.mutations'

export interface PlantillaChecklist {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoriaChecklistId: string
  categoria?: {
    id: string
    nombre: string
    tipoUso: string
  }
  version: number
  plantillaBaseId: string
  vigente: boolean
  activo: boolean
  fechaCreacion: string
  fechaActualizacion?: string
  requisitos?: RequisitoDocumento[]
}

export interface PlantillaFormulario {
  id: string
  nombre: string
  version: number
  activo: boolean
  descripcion?: string
  baseId: string
  campos: any // JSON
}

export interface RequisitoDocumento {
  id: string
  tipoRequisito: 'documento' | 'formulario'
  plantillaDocumentoId?: string
  formularioId?: string
  obligatorio: boolean
  orden: number
  plantillaDocumento?: {
    id: string
    tipoDocumento: {
      codigo: string
      nombre: string
      descripcion: string
    }
    formatosPermitidos?: string
  }
  formulario?: PlantillaFormulario
}

export interface PlantillaChecklistInput {
  codigo?: string
  nombre: string
  descripcion?: string
  categoriaChecklistId: string
  version?: number
  plantillaBaseId?: string
  vigente?: boolean
  activo: boolean
}

export interface PlantillaChecklistFiltros {
  codigo?: string
  nombre?: string
  categoriaChecklistId?: string
  activo?: boolean
  vigente?: boolean
}

export interface PlantillaChecklistConnection {
  plantillasChecklist: PlantillaChecklist[]
  totalCount: number
}

// Hook para listar plantillas de checklist con paginación y filtros
export function usePlantillasChecklist(filters?: PlantillaChecklistFiltros, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['plantillasChecklist', filters, limit, offset],
    queryFn: async () => {
      const response = await graphqlRequest(
        LISTAR_PLANTILLAS_CHECKLIST_QUERY,
        { limit, offset, filters }
      );
      return response.listarPlantillasChecklist;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para scroll infinito de plantillas (vista cards)
export function usePlantillasChecklistInfinite(filters?: PlantillaChecklistFiltros, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['plantillasChecklistInfinite', filters, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await graphqlRequest(
        LISTAR_PLANTILLAS_CHECKLIST_QUERY,
        { limit, offset: pageParam, filters }
      );
      return {
        data: response.listarPlantillasChecklist.plantillasChecklist,
        totalCount: response.listarPlantillasChecklist.totalCount,
        offset: pageParam,
        hasMore: pageParam + limit < response.listarPlantillasChecklist.totalCount
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.offset + limit;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener una plantilla de checklist por ID
export function usePlantillaChecklist(id: string) {
  return useQuery({
    queryKey: ['plantillaChecklist', id],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      
      const response = await graphqlRequest(
        OBTENER_PLANTILLA_CHECKLIST_QUERY,
        { id }
      );
      return response.obtenerPlantillaChecklist;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener plantillas de checklist activas
export function usePlantillasChecklistActivas() {
  return useQuery({
    queryKey: ['plantillasChecklist', 'activas'],
    queryFn: async () => {
      const response = await graphqlRequest(FIND_ACTIVAS_PLANTILLA_CHECKLIST_QUERY);
      return response.findActivasPlantillaChecklist;
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener plantillas de checklist inactivas
export function usePlantillasChecklistInactivas() {
  return useQuery({
    queryKey: ['plantillasChecklist', 'inactivas'],
    queryFn: async () => {
      const response = await graphqlRequest(FIND_INACTIVAS_PLANTILLA_CHECKLIST_QUERY);
      return response.findInactivasPlantillaChecklist;
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener plantillas de checklist vigentes
export function usePlantillasChecklistVigentes() {
  return useQuery({
    queryKey: ['plantillasChecklist', 'vigentes'],
    queryFn: async () => {
      const response = await graphqlRequest(FIND_VIGENTES_PLANTILLA_CHECKLIST_QUERY);
      return response.findVigentesPlantillaChecklist;
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Hooks para versionamiento
export function useVersionesPorCodigo(codigo: string) {
  return useQuery({
    queryKey: ['versionesPorCodigo', codigo],
    queryFn: async () => {
      if (!codigo) return [];
      const response = await graphqlRequest(OBTENER_VERSIONES_POR_CODIGO_QUERY, { codigo });
      return response.obtenerVersionesPorCodigo;
    },
    enabled: !!codigo,
    staleTime: 5 * 60 * 1000,
  })
}

export function useVersionVigentePorCodigo(codigo: string) {
  return useQuery({
    queryKey: ['versionVigentePorCodigo', codigo],
    queryFn: async () => {
      if (!codigo) return null;
      const response = await graphqlRequest(OBTENER_VERSION_VIGENTE_POR_CODIGO_QUERY, { codigo });
      return response.obtenerVersionVigentePorCodigo;
    },
    enabled: !!codigo,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCrearNuevaVersion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (checklistId: string) => {
      const response = await graphqlRequest(CREAR_NUEVA_VERSION_MUTATION, { checklistId });
      return response.crearNuevaVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillasChecklist'] })
      queryClient.invalidateQueries({ queryKey: ['versionesPorCodigo'] })
    },
    onError: (error) => {
      console.error('Error creando nueva versión:', error)
    }
  })
}

// Hook para crear una plantilla de checklist
export function useCrearPlantillaChecklist() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: PlantillaChecklistInput) => {
      const response = await graphqlRequest(
        CREATE_MUTATION,
        { input }
      );
      return response.crearPlantillaChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillasChecklist'] })
    },
    onError: (error) => {
      console.error('Error creando plantilla de checklist:', error)
    }
  })
}

// Hook para actualizar una plantilla de checklist
export function useActualizarPlantillaChecklist() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PlantillaChecklistInput }) => {
      const response = await graphqlRequest(
        UPDATE_MUTATION,
        { id, input }
      );
      return response.actualizarPlantillaChecklist;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plantillasChecklist'] })
      queryClient.invalidateQueries({ queryKey: ['plantillaChecklist', variables.id] })
    },
    onError: (error) => {
      console.error('Error actualizando plantilla de checklist:', error)
    }
  })
}

// Hook para eliminar una plantilla de checklist
export function useEliminarPlantillaChecklist() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await graphqlRequest(
        DELETE_MUTATION,
        { id }
      );
      return response.eliminarPlantillaChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillasChecklist'] })
    },
    onError: (error) => {
      console.error('Error eliminando plantilla de checklist:', error)
    }
  })
}
