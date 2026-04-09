import type { SolicitudAprobacionKanban, TipoSolicitudAprobacion } from './aprobaciones-kanban.types';
import { normalizarEstadoAprobacionKanban } from './aprobaciones-kanban.types';

/** Respuesta GraphQL alineada a `Aprobacion` del backend. */
export interface AprobacionKanbanGql {
  id: string;
  entidadTipo: string;
  entidadId: string;
  expedienteId: string;
  montoSolicitado?: number | null;
  tipoPagoOCId?: string | null;
  estado: string;
  solicitanteNombre?: string | null;
  fechaEnvio: string;
  observaciones?: Array<{ mensaje: string }> | null;
}

function tipoDesdeEntidad(entidadTipo: string): TipoSolicitudAprobacion {
  if (entidadTipo === 'solicitud_pago') return 'PAGO';
  return 'DOCUMENTO';
}

function tituloDesdeEntidad(entidadTipo: string): string {
  if (entidadTipo === 'solicitud_pago') return 'Solicitud de pago';
  return 'Documento / checklist OC';
}

/** Último comentario de observación (vista resumida en la card). */
function ultimaObservacion(obs: AprobacionKanbanGql['observaciones']): string | undefined {
  if (!obs || obs.length === 0) return undefined;
  const last = obs[obs.length - 1];
  const m = last?.mensaje?.trim();
  return m || undefined;
}

export function aprobacionGqlToSolicitudKanban(a: AprobacionKanbanGql): SolicitudAprobacionKanban {
  const tipo = tipoDesdeEntidad(a.entidadTipo);
  return {
    id: a.id,
    tipo,
    titulo: tituloDesdeEntidad(a.entidadTipo),
    referencia: a.entidadId,
    proveedorNombre: a.solicitanteNombre?.trim() || '—',
    ...(a.montoSolicitado != null && !Number.isNaN(Number(a.montoSolicitado))
      ? { monto: Number(a.montoSolicitado), moneda: 'PEN' as const }
      : {}),
    fechaEnvio: a.fechaEnvio,
    estado: normalizarEstadoAprobacionKanban(a.estado),
    observacion: ultimaObservacion(a.observaciones),
  };
}
