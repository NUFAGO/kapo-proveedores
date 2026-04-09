'use client'

import { useQuery } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { APROBACION_REVISION_POR_ENTIDAD_QUERY } from '@/graphql/queries/aprobaciones-revision.queries'
import type {
  DetalleChecklistRevisionAprobacionGql,
  DocumentoSubidoRevisionGql,
} from '@/hooks/useDetalleChecklistRevisionAprobacion'

export type EntidadTipoAprobacionGql = 'solicitud_pago' | 'documento_oc'

export type EntidadAprobacionRef = {
  entidadTipo: EntidadTipoAprobacionGql
  entidadId: string
}

export type ItemComentarioAprobacionGql = {
  mensaje: string
  usuarioId: string
  usuarioNombre?: string | null
  fecha: string
}

export type AprobacionPorEntidadGql = {
  id: string
  entidadTipo: EntidadTipoAprobacionGql
  entidadId: string
  expedienteId: string
  estado: string
  montoSolicitado?: number | null
  tipoPagoOCId?: string | null
  solicitanteId?: string | null
  solicitanteNombre?: string | null
  revisorId?: string | null
  revisorNombre?: string | null
  fechaEnvio: string
  fechaUltimaRevision?: string | null
  numeroCiclo: number
  observaciones: ItemComentarioAprobacionGql[]
  comentariosAprobacion: ItemComentarioAprobacionGql[]
  comentariosRechazo: ItemComentarioAprobacionGql[]
}

type AprobacionRevisionPorEntidadResponse = {
  aprobacionRevisionPorEntidad: {
    aprobacion: AprobacionPorEntidadGql | null
    documentosSubidos: DocumentoSubidoRevisionGql[]
  }
}

/** Shape compatible con el modal: sin checklist del servidor (el expediente ya trae requisitos). */
function detalleLigeroDesdeRevisionPayload(
  a: AprobacionPorEntidadGql,
  documentosSubidos: DocumentoSubidoRevisionGql[]
): DetalleChecklistRevisionAprobacionGql {
  return {
    aprobacionId: a.id,
    estado: a.estado,
    entidadTipo: a.entidadTipo,
    entidadId: a.entidadId,
    expedienteId: a.expedienteId,
    montoSolicitado: a.montoSolicitado ?? null,
    tipoPagoOCId: a.tipoPagoOCId ?? null,
    checklist: {
      id: '',
      codigo: '',
      nombre: '',
      descripcion: null,
      activo: true,
      fechaCreacion: '',
      categoriaChecklistId: '',
      categoria: null,
      requisitos: [],
    },
    documentosSubidos,
  }
}

export function aprobacionDetallePorEntidadQueryKey(ref: EntidadAprobacionRef | null) {
  return ['aprobacion-detalle-checklist-por-entidad', ref?.entidadTipo, ref?.entidadId] as const
}

/**
 * Una sola query: `aprobacionRevisionPorEntidad` (aprobación + documentos subidos).
 */
export function useAprobacionYDetalleChecklistPorEntidad(
  ref: EntidadAprobacionRef | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: aprobacionDetallePorEntidadQueryKey(ref),
    enabled: Boolean(ref?.entidadId && ref?.entidadTipo && enabled),
    staleTime: 30 * 1000,
    queryFn: async (): Promise<{
      aprobacion: AprobacionPorEntidadGql | null
      detalle: DetalleChecklistRevisionAprobacionGql | null
    }> => {
      if (!ref?.entidadId || !ref.entidadTipo) {
        return { aprobacion: null, detalle: null }
      }
      const res = await graphqlRequest<AprobacionRevisionPorEntidadResponse>(
        APROBACION_REVISION_POR_ENTIDAD_QUERY,
        {
          entidadTipo: ref.entidadTipo,
          entidadId: ref.entidadId,
        }
      )
      const payload = res.aprobacionRevisionPorEntidad
      const aprobacion = payload.aprobacion
      if (!aprobacion?.id) {
        return { aprobacion, detalle: null }
      }
      return {
        aprobacion,
        detalle: detalleLigeroDesdeRevisionPayload(aprobacion, payload.documentosSubidos ?? []),
      }
    },
  })
}
