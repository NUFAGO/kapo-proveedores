import type { EstadoAprobacionKanban } from './aprobaciones-kanban.types';

export const COLUMNAS_APROBACION_ORDEN: EstadoAprobacionKanban[] = [
  'EN_REVISION',
  'OBSERVADO',
  'APROBADO',
  'RECHAZADO',
];

export const COLUMNAS_APROBACION_LABELS: Record<EstadoAprobacionKanban, string> = {
  EN_REVISION: 'En Revisión',
  OBSERVADO: 'Observados',
  APROBADO: 'Aprobados',
  RECHAZADO: 'Rechazados',
};

export const COLUMNAS_APROBACION_COLORES: Record<EstadoAprobacionKanban, string> = {
  EN_REVISION: 'bg-blue-500/10 border-blue-200 text-blue-800 dark:text-blue-200',
  OBSERVADO: 'bg-orange-500/10 border-orange-200 text-orange-800 dark:text-orange-200',
  APROBADO: 'bg-emerald-500/10 border-emerald-200 text-emerald-800 dark:text-emerald-200',
  RECHAZADO: 'bg-red-500/10 border-red-200 text-red-700 dark:text-red-300',
};

export const TIPO_SOLICITUD_LABELS = {
  PAGO: 'Pago',
  DOCUMENTO: 'Documento',
  OC: 'Orden de compra',
} as const;
