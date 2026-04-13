import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  LISTAR_DOCUMENTOS_OC_QUERY,
  OBTENER_DOCUMENTO_OC_QUERY,
  OBTENER_DOCUMENTOS_POR_EXPEDIENTE_QUERY,
  VERIFICAR_DOCUMENTOS_OBLIGATORIOS_APROBADOS_QUERY,
  OBTENER_DOCUMENTOS_OBLIGATORIOS_PENDIENTES_QUERY
} from '@/graphql'
import {
  CREAR_DOCUMENTO_OC_MUTATION,
  SUBIR_ARCHIVOS_DOCUMENTO_MUTATION,
  APROBAR_DOCUMENTO_OC_MUTATION,
  OBSERVAR_DOCUMENTO_OC_MUTATION,
  ACTUALIZAR_DOCUMENTO_OC_MUTATION,
  ELIMINAR_DOCUMENTO_OC_MUTATION
} from '@/graphql'

export interface DocumentoOC {
  id: string
  expedienteId: string
  checklistId: string
  obligatorio: boolean
  bloqueaSolicitudPago?: boolean
  estado: string
  fechaCarga?: string
  checklist?: {
    id: string
    codigo: string
    nombre: string
    descripcion?: string
    categoriaChecklistId: string
    activo: boolean
  }
  expediente?: {
    id: string
    ocCodigo: string
    estado: string
  }
}

export interface DocumentoOCInput {
  expedienteId: string
  checklistId: string
  obligatorio: boolean
  bloqueaSolicitudPago?: boolean
}

export interface DocumentoOCFilter {
  expedienteId?: string
  checklistId?: string
  estado?: string
  obligatorio?: boolean
  bloqueaSolicitudPago?: boolean
}

export interface ArchivoInput {
  url: string
  nombreOriginal: string
  mimeType: string
  tamanioBytes: number
  fechaSubida: string
}

// Hook para listar documentos OC con filtros
export function useDocumentosOC(filters?: DocumentoOCFilter) {
  return useQuery({
    queryKey: ['documentos-oc', filters],
    queryFn: () => graphqlRequest(LISTAR_DOCUMENTOS_OC_QUERY, { filter: filters || {} }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener un documento OC por ID
export function useDocumentoOC(id: string) {
  return useQuery({
    queryKey: ['documento-oc', id],
    queryFn: () => graphqlRequest(OBTENER_DOCUMENTO_OC_QUERY, { id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener documentos por expediente
export function useDocumentosPorExpediente(expedienteId: string) {
  return useQuery({
    queryKey: ['documentos-por-expediente', expedienteId],
    queryFn: () => graphqlRequest(OBTENER_DOCUMENTOS_POR_EXPEDIENTE_QUERY, { expedienteId }),
    enabled: !!expedienteId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para verificar si todos los documentos obligatorios están aprobados
export function useVerificarDocumentosObligatoriosAprobados(expedienteId: string) {
  return useQuery({
    queryKey: ['documentos-obligatorios-aprobados', expedienteId],
    queryFn: () => graphqlRequest(VERIFICAR_DOCUMENTOS_OBLIGATORIOS_APROBADOS_QUERY, { expedienteId }),
    enabled: !!expedienteId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para obtener documentos obligatorios pendientes
export function useDocumentosObligatoriosPendientes(expedienteId: string) {
  return useQuery({
    queryKey: ['documentos-obligatorios-pendientes', expedienteId],
    queryFn: () => graphqlRequest(OBTENER_DOCUMENTOS_OBLIGATORIOS_PENDIENTES_QUERY, { expedienteId }),
    enabled: !!expedienteId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para crear un documento OC
export function useCrearDocumentoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: DocumentoOCInput) => 
      graphqlRequest(CREAR_DOCUMENTO_OC_MUTATION, { input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] })
      queryClient.invalidateQueries({ queryKey: ['documentos-por-expediente', variables.expedienteId] })
      queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-pendientes', variables.expedienteId] })
    },
    onError: (error) => {
      console.error('Error creando documento OC:', error)
    }
  })
}

// Hook para subir archivos a un documento OC
export function useSubirArchivosDocumento() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: {
      id: string
      archivos: ArchivoInput[]
      usuarioId: string
    }) => graphqlRequest(SUBIR_ARCHIVOS_DOCUMENTO_MUTATION, { input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] })
      queryClient.invalidateQueries({ queryKey: ['documento-oc', variables.id] })
      
      // Invalidar queries del expediente si tenemos el expedienteId
      const documentoActual = queryClient.getQueryData(['documento-oc', variables.id]) as DocumentoOC
      if (documentoActual?.expedienteId) {
        queryClient.invalidateQueries({ queryKey: ['documentos-por-expediente', documentoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-aprobados', documentoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-pendientes', documentoActual.expedienteId] })
      }
    },
    onError: (error) => {
      console.error('Error subiendo archivos al documento:', error)
    }
  })
}

// Hook para aprobar un documento OC
export function useAprobarDocumentoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: { id: string }) =>
      graphqlRequest(APROBAR_DOCUMENTO_OC_MUTATION, { input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] })
      queryClient.invalidateQueries({ queryKey: ['documento-oc', variables.id] })
      
      // Invalidar queries del expediente si tenemos el expedienteId
      const documentoActual = queryClient.getQueryData(['documento-oc', variables.id]) as DocumentoOC
      if (documentoActual?.expedienteId) {
        queryClient.invalidateQueries({ queryKey: ['documentos-por-expediente', documentoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-aprobados', documentoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-pendientes', documentoActual.expedienteId] })
      }
    },
    onError: (error) => {
      console.error('Error aprobando documento OC:', error)
    }
  })
}

// Hook para observar un documento OC
export function useObservarDocumentoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: { id: string; comentarios: string }) =>
      graphqlRequest(OBSERVAR_DOCUMENTO_OC_MUTATION, { input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] })
      queryClient.invalidateQueries({ queryKey: ['documento-oc', variables.id] })
      
      // Invalidar queries del expediente si tenemos el expedienteId
      const documentoActual = queryClient.getQueryData(['documento-oc', variables.id]) as DocumentoOC
      if (documentoActual?.expedienteId) {
        queryClient.invalidateQueries({ queryKey: ['documentos-por-expediente', documentoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-pendientes', documentoActual.expedienteId] })
      }
    },
    onError: (error) => {
      console.error('Error observando documento OC:', error)
    }
  })
}

// Hook para actualizar un documento OC
export function useActualizarDocumentoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DocumentoOCInput> }) => 
      graphqlRequest(ACTUALIZAR_DOCUMENTO_OC_MUTATION, { id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] })
      queryClient.invalidateQueries({ queryKey: ['documento-oc', variables.id] })
      
      // Invalidar queries del expediente si tenemos el expedienteId
      const documentoActual = queryClient.getQueryData(['documento-oc', variables.id]) as DocumentoOC
      if (documentoActual?.expedienteId) {
        queryClient.invalidateQueries({ queryKey: ['documentos-por-expediente', documentoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-pendientes', documentoActual.expedienteId] })
      }
    },
    onError: (error) => {
      console.error('Error actualizando documento OC:', error)
    }
  })
}

// Hook para eliminar un documento OC
export function useEliminarDocumentoOC() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      graphqlRequest(ELIMINAR_DOCUMENTO_OC_MUTATION, { id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] })
      
      // Invalidar queries del expediente si tenemos el expedienteId
      const documentoActual = queryClient.getQueryData(['documento-oc', variables]) as DocumentoOC
      if (documentoActual?.expedienteId) {
        queryClient.invalidateQueries({ queryKey: ['documentos-por-expediente', documentoActual.expedienteId] })
        queryClient.invalidateQueries({ queryKey: ['documentos-obligatorios-pendientes', documentoActual.expedienteId] })
      }
    },
    onError: (error) => {
      console.error('Error eliminando documento OC:', error)
    }
  })
}
