'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { graphqlRequest } from '@/lib/graphql-client'
import { PROCESAR_CHECKLIST_SUBSANACION_MUTATION } from '@/graphql'
import type { ChecklistProveedorSubsanacionInput } from '@/app/(portal)/proveedor/ordenes/[codigo]/components/checklistPayload'
import { reportesPorSolicitudPagoQueryKey } from '@/hooks/useReporteSolicitudPago'

export interface ProcesarChecklistSubsanacionResult {
  procesarChecklistSubsanacion: {
    entidadId: string
    aprobacionId: string
    documentosSubidosIds: string[]
  }
}

export function useProcesarChecklistSubsanacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ChecklistProveedorSubsanacionInput) => {
      return graphqlRequest<ProcesarChecklistSubsanacionResult>(PROCESAR_CHECKLIST_SUBSANACION_MUTATION, {
        input,
      })
    },
    onSuccess: (data, variables) => {
      toast.success('Subsanación enviada a revisión')
      queryClient.invalidateQueries({ queryKey: ['expediente-completo', variables.expedienteId] })
      queryClient.invalidateQueries({ queryKey: ['solicitudes-por-expediente', variables.expedienteId] })
      queryClient.invalidateQueries({ queryKey: ['expedientes-pago'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-data-aprobaciones'] })

      const ent = variables.context === 'solicitud_pago' ? 'solicitud_pago' : 'documento_oc'
      queryClient.invalidateQueries({
        queryKey: ['aprobacion-detalle-checklist-por-entidad', ent, variables.entidadId],
      })

      if (
        variables.context === 'solicitud_pago' &&
        variables.reporteSolicitudPagoIds?.length
      ) {
        queryClient.invalidateQueries({
          queryKey: reportesPorSolicitudPagoQueryKey(variables.entidadId),
        })
        queryClient.invalidateQueries({ queryKey: ['reportes-solicitud-pago-por-proveedor'] })
        queryClient.invalidateQueries({ queryKey: ['reportes-solicitud-pago-infinite'] })
      }
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Error al enviar la subsanación'
      toast.error(msg)
    },
  })
}
