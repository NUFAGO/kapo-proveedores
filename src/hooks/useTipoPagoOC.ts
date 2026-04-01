import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  LISTAR_TIPOS_PAGO_OC_QUERY,
  OBTENER_TIPO_PAGO_OC_QUERY,
  OBTENER_TIPOS_PAGO_POR_EXPEDIENTE_QUERY,
  VALIDAR_CREACION_SOLICITUD_QUERY
} from '@/graphql'
import {
  CREAR_TIPO_PAGO_OC_MUTATION,
  ACTUALIZAR_TIPO_PAGO_OC_MUTATION,
  ELIMINAR_TIPO_PAGO_OC_MUTATION
} from '@/graphql'

export interface TipoPagoOC {
  id: string
  expedienteId: string
  categoriaChecklistId: string
  checklistId: string
  fechaAsignacion: string
  modoRestriccion: string
  orden?: number
  requiereAnteriorPagado?: boolean
  porcentajeMaximo?: number
  porcentajeMinimo?: number
  categoria?: {
    id: string
    nombre: string
    tipoUso: string
    permiteMultiple: boolean
    permiteVincularReportes: boolean
  }
  checklist?: {
    id: string
    codigo: string
    nombre: string
    version: number
    vigente: boolean
    activo: boolean
  }
}

export interface TipoPagoOCInput {
  expedienteId: string
  categoriaChecklistId: string
  checklistId: string
  modoRestriccion: string
  orden?: number
  requiereAnteriorPagado?: boolean
  porcentajeMaximo?: number
  porcentajeMinimo?: number
}

export interface TipoPagoOCFilter {
  expedienteId?: string
  categoriaChecklistId?: string
  checklistId?: string
  modoRestriccion?: string
}

export interface ValidarCreacionSolicitudInput {
  expedienteId: string
  categoriaChecklistId: string
  montoSolicitado: number
}

export interface ValidacionSolicitudResponse {
  puedeCrear: boolean
  motivo?: string
}

// Hook para listar tipos de pago OC con filtros
export function useTiposPagoOC(filters?: TipoPagoOCFilter) {
  return useQuery({
    queryKey: ['tipos-pago-oc', filters],
    queryFn: () => graphqlRequest(LISTAR_TIPOS_PAGO_OC_QUERY, { filter: filters || {} }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener un tipo de pago OC por ID
export function useTipoPagoOC(id: string) {
  return useQuery({
    queryKey: ['tipo-pago-oc', id],
    queryFn: () => graphqlRequest(OBTENER_TIPO_PAGO_OC_QUERY, { id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener tipos de pago por expediente
export function useTiposPagoPorExpediente(expedienteId: string) {
  return useQuery({
    queryKey: ['tipos-pago-por-expediente', expedienteId],
    queryFn: () => graphqlRequest(OBTENER_TIPOS_PAGO_POR_EXPEDIENTE_QUERY, { expedienteId }),
    enabled: !!expedienteId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para validar creación de solicitud
export function useValidarCreacionSolicitud() {
  return useMutation({
    mutationFn: (input: ValidarCreacionSolicitudInput) => 
      graphqlRequest(VALIDAR_CREACION_SOLICITUD_QUERY, { input }),
    onError: (error) => {
      console.error('Error validando creación de solicitud:', error)
    }
  })
}

// Hook para crear un tipo de pago OC
export function useCrearTipoPagoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: TipoPagoOCInput) => 
      graphqlRequest(CREAR_TIPO_PAGO_OC_MUTATION, { input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tipos-pago-oc'] })
      queryClient.invalidateQueries({ queryKey: ['tipos-pago-por-expediente', variables.expedienteId] })
      queryClient.invalidateQueries({ queryKey: ['expediente-pago', variables.expedienteId] })
    },
    onError: (error) => {
      console.error('Error creando tipo de pago OC:', error)
    }
  })
}

// Hook para actualizar un tipo de pago OC
export function useActualizarTipoPagoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TipoPagoOCInput> }) => 
      graphqlRequest(ACTUALIZAR_TIPO_PAGO_OC_MUTATION, { id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tipos-pago-oc'] })
      queryClient.invalidateQueries({ queryKey: ['tipo-pago-oc', variables.id] })
      
      // Invalidar queries del expediente si tenemos el expedienteId
      const tipoPagoActual = queryClient.getQueryData(['tipo-pago-oc', variables.id]) as TipoPagoOC
      if (tipoPagoActual?.expedienteId) {
        queryClient.invalidateQueries({ queryKey: ['tipos-pago-por-expediente', tipoPagoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['expediente-pago', tipoPagoActual.expedienteId] })
      }
    },
    onError: (error) => {
      console.error('Error actualizando tipo de pago OC:', error)
    }
  })
}

// Hook para eliminar un tipo de pago OC
export function useEliminarTipoPagoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      graphqlRequest(ELIMINAR_TIPO_PAGO_OC_MUTATION, { id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tipos-pago-oc'] })
      
      // Invalidar queries del expediente si tenemos el expedienteId
      const tipoPagoActual = queryClient.getQueryData(['tipo-pago-oc', variables]) as TipoPagoOC
      if (tipoPagoActual?.expedienteId) {
        queryClient.invalidateQueries({ queryKey: ['tipos-pago-por-expediente', tipoPagoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['expediente-pago', tipoPagoActual.expedienteId] })
      }
    },
    onError: (error) => {
      console.error('Error eliminando tipo de pago OC:', error)
    }
  })
}
