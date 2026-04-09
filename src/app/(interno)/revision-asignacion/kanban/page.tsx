'use client';

import { useMemo, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tipoFiltroUiToEntidadGraphQL } from './lib/aprobaciones-kanban.filters';
import { AprobacionesKanbanBoard } from './AprobacionesKanbanBoard';
import { AprobacionChecklistRevisionModal } from './components/AprobacionChecklistRevisionModal';
import {
  AprobacionesKanbanHeader,
  type AprobacionesKanbanEstadisticas,
} from './components/AprobacionesKanbanHeader';
import { useKanbanAprobacionesQuery } from './hooks/useKanbanAprobacionesQuery';
export default function AprobacionesKanbanPage() {
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [refrescando, setRefrescando] = useState(false);
  const [revisionAprobacionId, setRevisionAprobacionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const entidadTipoGraphQL = tipoFiltroUiToEntidadGraphQL(tipoFiltro);

  const { data: kanbanSnapshot } = useKanbanAprobacionesQuery(entidadTipoGraphQL);

  const estadisticas: AprobacionesKanbanEstadisticas = useMemo(() => {
    const empty: AprobacionesKanbanEstadisticas = {
      total: 0,
      observados: 0,
      rechazados: 0,
      aprobados: 0,
    };
    const k = kanbanSnapshot?.getKanbanDataAprobaciones;
    if (!k) return empty;
    return {
      total: k.EN_REVISION.total + k.OBSERVADO.total + k.APROBADO.total + k.RECHAZADO.total,
      observados: k.OBSERVADO.total,
      rechazados: k.RECHAZADO.total,
      aprobados: k.APROBADO.total,
    };
  }, [kanbanSnapshot]);

  const handleRefrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['kanban-data-aprobaciones'] });
    } finally {
      setRefrescando(false);
    }
  }, [queryClient]);

  const handleOpenRevision = useCallback((aprobacionId: string) => {
    const id = aprobacionId?.trim();
    if (!id) return;
    setRevisionAprobacionId(id);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AprobacionesKanbanHeader
        estadisticas={estadisticas}
        tipoFiltro={tipoFiltro}
        onTipoFiltroChange={(v) => setTipoFiltro(v ?? '')}
        onRefrescar={handleRefrescar}
        refrescando={refrescando}
      />

      <div className="flex-1 overflow-hidden -mb-6">
        <AprobacionesKanbanBoard
          entidadTipoGraphQL={entidadTipoGraphQL}
          onOpenRevision={handleOpenRevision}
        />
      </div>

      <AprobacionChecklistRevisionModal
        isOpen={revisionAprobacionId != null}
        onClose={() => setRevisionAprobacionId(null)}
        aprobacionId={revisionAprobacionId}
      />
    </div>
  );
}
