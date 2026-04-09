'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { graphqlRequest } from '@/lib/graphql-client'
import { PROCESAR_CHECKLIST_PROVEEDOR_MUTATION } from '@/graphql'
import type { ChecklistProveedorBatchInput } from '@/app/(portal)/proveedor/ordenes/[codigo]/components/checklistPayload'

export interface ProcesarChecklistProveedorResult {
  procesarChecklistProveedor: {
    solicitudPagoId?: string | null
    documentoOCId?: string | null
    documentosSubidosIds: string[]
    aprobacionId: string
  }
}

export function useProcesarChecklistProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ChecklistProveedorBatchInput) => {
      return graphqlRequest<ProcesarChecklistProveedorResult>(PROCESAR_CHECKLIST_PROVEEDOR_MUTATION, {
        input,
      })
    },
    onSuccess: (data, variables) => {
      const msg =
        variables.context === 'solicitud_pago'
          ? 'Solicitud de pago enviada a revisión'
          : 'Documento OC enviado a revisión'
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['expediente-completo', variables.expedienteId] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-por-expediente', variables.expedienteId] })
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-data-aprobaciones'] })

      const r = data.procesarChecklistProveedor
      if (r.documentoOCId) {
        queryClient.invalidateQueries({
          queryKey: ['aprobacion-detalle-checklist-por-entidad', 'documento_oc', r.documentoOCId],
        })
      }
      if (r.solicitudPagoId) {
        queryClient.invalidateQueries({
          queryKey: ['aprobacion-detalle-checklist-por-entidad', 'solicitud_pago', r.solicitudPagoId],
        })
      }
      if (variables.reporteSolicitudPagoIds?.length) {
        queryClient.invalidateQueries({ queryKey: ['reportes-solicitud-pago-por-proveedor'] })
        queryClient.invalidateQueries({ queryKey: ['reportes-solicitud-pago-infinite'] })
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Error al procesar el checklist')
    },
  })
}
