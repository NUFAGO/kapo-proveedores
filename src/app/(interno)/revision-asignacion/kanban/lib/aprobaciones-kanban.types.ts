/** Estados de la entidad Aprobación visibles en el tablero. */
export type EstadoAprobacionKanban = 'EN_REVISION' | 'OBSERVADO' | 'APROBADO' | 'RECHAZADO';

/** Normaliza el estado desde API para el tablero. */
export function normalizarEstadoAprobacionKanban(raw: string | undefined | null): EstadoAprobacionKanban {
  const u = String(raw ?? '').trim().toUpperCase();
  if (u === 'APROBADO') return 'APROBADO';
  if (u === 'RECHAZADO') return 'RECHAZADO';
  if (u === 'OBSERVADO') return 'OBSERVADO';
  return 'EN_REVISION';
}

export type TipoSolicitudAprobacion = 'PAGO' | 'DOCUMENTO' | 'OC';

/** Ítem del tablero: solicitudes de pago, documento u orden de compra en flujo de aprobación */
export interface SolicitudAprobacionKanban {
  id: string;
  tipo: TipoSolicitudAprobacion;
  titulo: string;
  referencia: string;
  proveedorNombre: string;
  monto?: number;
  moneda?: string;
  fechaEnvio: string;
  estado: EstadoAprobacionKanban;
  observacion?: string;
  ordenCompraCodigo?: string;
}
