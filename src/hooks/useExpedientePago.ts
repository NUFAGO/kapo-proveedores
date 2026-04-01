import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  LISTAR_EXPEDIENTES_PAGO_QUERY,
  OBTENER_EXPEDIENTE_PAGO_QUERY,
  OBTENER_EXPEDIENTE_POR_OC_ID_QUERY,
  OBTENER_EXPEDIENTES_POR_PROVEEDOR_QUERY
} from '@/graphql'
import {
  CREAR_EXPEDIENTE_PAGO_MUTATION,
  CONFIGURAR_EXPEDIENTE_MUTATION,
  ACTUALIZAR_ESTADO_EXPEDIENTE_MUTATION,
  ACTUALIZAR_SALDOS_EXPEDIENTE_MUTATION,
  ELIMINAR_EXPEDIENTE_PAGO_MUTATION,
  GUARDAR_EXPEDIENTE_CON_ITEMS_MUTATION
} from '@/graphql'

export interface ExpedientePago {
  id: string
  ocId: string
  ocCodigo: string
  ocSnapshot: any
  fechaSnapshot: string
  proveedorId: string
  proveedorNombre: string
  montoContrato: number
  fechaInicioContrato: string
  fechaFinContrato: string
  descripcion: string
  estado: string
  montoComprometido: number
  montoPagado: number
  montoDisponible: number
  requiereReportes: boolean
  frecuenciaReporte?: string
  minReportesPorSolicitud?: number
  modoValidacionReportes?: string
  adminCreadorId: string
  fechaCreacion: string
  fechaConfigurado?: string
}

export interface ExpedientePagoInput {
  ocId: string
  ocCodigo: string
  ocSnapshot: any
  proveedorId: string
  proveedorNombre: string
  montoContrato: number
  fechaInicioContrato: string
  fechaFinContrato: string
  descripcion: string
  requiereReportes?: boolean
  frecuenciaReporte?: string
  minReportesPorSolicitud?: number
  modoValidacionReportes?: string
  adminCreadorId: string
}

export interface ExpedientePagoFilter {
  page?: number
  limit?: number
  ocId?: string
  proveedorId?: string
  estado?: string
  adminCreadorId?: string
  searchTerm?: string
}

export interface ExpedientePagoPaginatedResponse {
  data: ExpedientePago[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Hook para listar expedientes con paginación y filtros
export function useExpedientesPago(filters?: ExpedientePagoFilter) {
  return useQuery({
    queryKey: ['expedientes-pago', filters],
    queryFn: () => graphqlRequest(LISTAR_EXPEDIENTES_PAGO_QUERY, { filter: filters || {} }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener un expediente por ID
export function useExpedientePago(id: string) {
  return useQuery({
    queryKey: ['expediente-pago', id],
    queryFn: () => graphqlRequest(OBTENER_EXPEDIENTE_PAGO_QUERY, { id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener expediente por OC ID
export function useExpedientePorOcId(ocId: string) {
  return useQuery({
    queryKey: ['expediente-por-oc', ocId],
    queryFn: () => graphqlRequest(OBTENER_EXPEDIENTE_POR_OC_ID_QUERY, { ocId }),
    enabled: !!ocId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener expedientes por proveedor
export function useExpedientesPorProveedor(proveedorId: string, filters?: ExpedientePagoFilter) {
  return useQuery({
    queryKey: ['expedientes-por-proveedor', proveedorId, filters],
    queryFn: () => graphqlRequest(OBTENER_EXPEDIENTES_POR_PROVEEDOR_QUERY, { proveedorId, filter: filters }),
    enabled: !!proveedorId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para crear un expediente
export function useCrearExpedientePago() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: ExpedientePagoInput) => 
      graphqlRequest(CREAR_EXPEDIENTE_PAGO_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] })
    },
    onError: (error) => {
      console.error('Error creando expediente:', error)
    }
  })
}

// Hook para configurar un expediente
export function useConfigurarExpediente() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: {
      expedienteId: string
      documentosBaseIds: string[]
      tiposPago: Array<{
        categoriaChecklistId: string
        checklistId: string
        modoRestriccion: string
        orden?: number
        requiereAnteriorPagado?: boolean
        porcentajeMaximo?: number
        porcentajeMinimo?: number
      }>
    }) => graphqlRequest(CONFIGURAR_EXPEDIENTE_MUTATION, { input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['expediente-pago', variables.expedienteId] })
      queryClient.invalidateQueries({ queryKey: ['tipos-pago-oc'] })
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] })
    },
    onError: (error) => {
      console.error('Error configurando expediente:', error)
    }
  })
}

// Hook para actualizar estado de un expediente
export function useActualizarEstadoExpediente() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => 
      graphqlRequest(ACTUALIZAR_ESTADO_EXPEDIENTE_MUTATION, { id, estado }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['expediente-pago', variables.id] })
    },
    onError: (error) => {
      console.error('Error actualizando estado del expediente:', error)
    }
  })
}

// Hook para actualizar saldos de un expediente
export function useActualizarSaldosExpediente() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      montoComprometido, 
      montoPagado 
    }: { 
      id: string
      montoComprometido: number
      montoPagado: number
    }) => graphqlRequest(ACTUALIZAR_SALDOS_EXPEDIENTE_MUTATION, { 
      id, 
      montoComprometido, 
      montoPagado 
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['expediente-pago', variables.id] })
    },
    onError: (error) => {
      console.error('Error actualizando saldos del expediente:', error)
    }
  })
}

// Hook para eliminar un expediente
export function useEliminarExpedientePago() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      graphqlRequest(ELIMINAR_EXPEDIENTE_PAGO_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] })
    },
    onError: (error) => {
      console.error('Error eliminando expediente:', error)
    }
  })
}

// Hook para guardar expediente con items seleccionados
export function useGuardarExpedienteConItems() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: {
      ocData: {
        id: string
        codigo: string
        proveedorId: string
        proveedorNombre: string
        montoContrato: number
        fechaInicioContrato: string
        fechaFinContrato: string
        descripcion?: string
      }
      adminCreadorId: string
      solicitudesPago: Array<{
        categoriaChecklistId: string
        plantillaChecklistId: string
      }>
      documentosOC: Array<{
        categoriaChecklistId: string
        plantillaChecklistId: string
      }>
    }) => graphqlRequest(GUARDAR_EXPEDIENTE_CON_ITEMS_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] })
    },
    onError: (error) => {
      console.error('Error guardando expediente con items:', error)
    }
  })
}
