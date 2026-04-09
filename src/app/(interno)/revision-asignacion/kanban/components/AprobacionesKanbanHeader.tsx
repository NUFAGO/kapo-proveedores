'use client';

import { AlertCircle, XCircle, CheckCircle, Inbox, RefreshCw } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export interface AprobacionesKanbanEstadisticas {
  total: number;
  observados: number;
  rechazados: number;
  aprobados: number;
}

interface AprobacionesKanbanHeaderProps {
  estadisticas: AprobacionesKanbanEstadisticas;
  tipoFiltro: string;
  onTipoFiltroChange: (value: string | null) => void;
  onRefrescar?: () => void;
  refrescando?: boolean;
}

export function AprobacionesKanbanHeader({
  estadisticas,
  tipoFiltro,
  onTipoFiltroChange,
  onRefrescar,
  refrescando = false,
}: AprobacionesKanbanHeaderProps) {
  return (
    <div
      className="shrink-0 rounded-md border-b px-4 py-4 sm:px-6"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <h1
            className="text-base font-bold"
            style={{ color: 'var(--text-on-content-bg-heading)' }}
          >
            Kanban de aprobaciones
          </h1>
          <p className="mt-1 hidden text-xs sm:block" style={{ color: 'var(--text-secondary)' }}>
            Pagos, documentos y órdenes de compra en flujo de aprobación
          </p>
        </div>

        <div className="hidden flex-wrap items-center gap-3 sm:flex sm:gap-4 lg:mr-4">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-on-content-bg)' }}>
              {estadisticas.total}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-on-content-bg)' }}>
              {estadisticas.observados}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Observados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-on-content-bg)' }}>
              {estadisticas.rechazados}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Rechazados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-on-content-bg)' }}>
              {estadisticas.aprobados}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Aprobados
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="w-full min-w-0 sm:min-w-[200px] lg:min-w-[220px]">
            <Select
              value={tipoFiltro}
              onChange={onTipoFiltroChange}
              placeholder="Tipo de solicitud"
              options={[
                { value: '', label: 'Todos los tipos' },
                { value: 'PAGO', label: 'Pago' },
                { value: 'DOCUMENTO', label: 'Documento' },
                { value: 'OC', label: 'Orden de compra' },
              ]}
            />
          </div>

          {onRefrescar && (
            <Button
              type="button"
              variant="custom"
              color="blue"
              size="xs"
              className="shrink-0"
              loading={refrescando}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={onRefrescar}
            >
              Actualizar
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:text-blue-200">
          {estadisticas.total} total
        </span>
        <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-800 dark:text-orange-200">
          {estadisticas.observados} obs.
        </span>
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium">
          {estadisticas.rechazados} rech.
        </span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium">
          {estadisticas.aprobados} ok
        </span>
      </div>
    </div>
  );
}
