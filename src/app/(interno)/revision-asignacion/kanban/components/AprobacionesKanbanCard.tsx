'use client';

import { FileText, Building2, Banknote, ClipboardList } from 'lucide-react';
import type { SolicitudAprobacionKanban } from '../lib/aprobaciones-kanban.types';
import { normalizarEstadoAprobacionKanban } from '../lib/aprobaciones-kanban.types';
import {
  COLUMNAS_APROBACION_LABELS,
  TIPO_SOLICITUD_LABELS,
} from '../lib/aprobaciones-kanban.constants';

interface AprobacionesKanbanCardProps {
  solicitud: SolicitudAprobacionKanban;
  onOpenDetalle?: (aprobacionId: string) => void;
}

function iconForTipo(tipo: SolicitudAprobacionKanban['tipo']) {
  switch (tipo) {
    case 'PAGO':
      return Banknote;
    case 'DOCUMENTO':
      return FileText;
    case 'OC':
      return ClipboardList;
    default:
      return FileText;
  }
}

const ESTADO_BADGE_CLASS: Record<string, string> = {
  EN_REVISION: 'bg-blue-500/15 text-blue-800 dark:text-blue-200',
  OBSERVADO: 'bg-orange-500/15 text-orange-800 dark:text-orange-200',
  APROBADO: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  RECHAZADO: 'bg-red-500/15 text-red-800 dark:text-red-200',
};

export function AprobacionesKanbanCard({ solicitud, onOpenDetalle }: AprobacionesKanbanCardProps) {
  const estadoK = normalizarEstadoAprobacionKanban(solicitud.estado);
  const estadoLabel = COLUMNAS_APROBACION_LABELS[estadoK];
  const estadoBadgeClass =
    ESTADO_BADGE_CLASS[estadoK] ?? 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
  const Icon = iconForTipo(solicitud.tipo);
  const fecha = new Date(solicitud.fechaEnvio).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const montoFmt =
    solicitud.monto != null
      ? new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency: solicitud.moneda ?? 'PEN',
          minimumFractionDigits: 2,
        }).format(solicitud.monto)
      : null;

  return (
    <button
      type="button"
      className="relative w-full cursor-pointer rounded-lg border p-3 text-left shadow-md transition-all duration-200 hover:border-blue-300/60 hover:shadow-lg dark:hover:border-blue-500/40"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenDetalle?.(solicitud.id);
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10"
          aria-hidden
        >
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${estadoBadgeClass}`}
            >
              {estadoLabel}
            </span>
            <span className="rounded bg-gray-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              {TIPO_SOLICITUD_LABELS[solicitud.tipo]}
            </span>
            <span
              className="truncate text-xs font-medium"
              style={{ color: 'var(--text-on-content-bg-heading)' }}
            >
              {solicitud.titulo}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-gray-600 dark:text-gray-400">
            {solicitud.referencia}
          </p>
        </div>
      </div>

      <div className="mt-2 space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <Building2 className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span className="truncate">{solicitud.proveedorNombre}</span>
        </div>
        {montoFmt && (
          <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {montoFmt}
          </div>
        )}
        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          Enviado: {fecha}
        </div>
        {solicitud.observacion && (
          <p className="rounded-md bg-amber-500/5 p-2 text-[11px] leading-snug text-amber-900 dark:text-amber-100">
            {solicitud.observacion}
          </p>
        )}
      </div>
    </button>
  );
}
