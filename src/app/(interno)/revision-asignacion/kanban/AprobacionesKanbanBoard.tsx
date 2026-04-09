'use client';

import { useEffect, useState } from 'react';
import type { EstadoAprobacionKanban, SolicitudAprobacionKanban } from './lib/aprobaciones-kanban.types';
import { COLUMNAS_APROBACION_ORDEN } from './lib/aprobaciones-kanban.constants';
import { AprobacionesKanbanColumn } from './components/AprobacionesKanbanColumn';
import { AprobacionesKanbanSkeleton } from './components/AprobacionesKanbanSkeleton';
import { graphqlRequest } from '@/lib/graphql-client';
import { KANBAN_APROBACION_PAGE_SIZE, LISTAR_APROBACIONES_KANBAN_QUERY } from '@/graphql/queries/aprobacion-kanban.queries';
import { useKanbanAprobacionesQuery } from './hooks/useKanbanAprobacionesQuery';
import {
  type AprobacionKanbanGql,
  aprobacionGqlToSolicitudKanban,
} from './lib/aprobaciones-kanban.mapper';
interface EstadoColumnData {
  solicitudes: SolicitudAprobacionKanban[];
  hasNextPage: boolean;
  totalCount: number;
  isLoading: boolean;
}

const EMPTY_COLUMN: EstadoColumnData = {
  solicitudes: [],
  hasNextPage: false,
  totalCount: 0,
  isLoading: false,
};

export interface AprobacionesKanbanBoardProps {
  /** `solicitud_pago` | `documento_oc` | undefined = todos */
  entidadTipoGraphQL?: 'solicitud_pago' | 'documento_oc';
  /** Al seleccionar una tarjeta (id = `Aprobacion.id`). Definido en la página para enlazar el modal. */
  onOpenRevision?: (aprobacionId: string) => void;
}

export function AprobacionesKanbanBoard({
  entidadTipoGraphQL,
  onOpenRevision,
}: AprobacionesKanbanBoardProps) {
  const [columnasData, setColumnasData] = useState<Record<string, EstadoColumnData>>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  const { data: kanbanData, isLoading: isInitialLoading, error } = useKanbanAprobacionesQuery(
    entidadTipoGraphQL
  );

  useEffect(() => {
    setColumnasData({});
    setHasLoaded(false);

    if (!kanbanData?.getKanbanDataAprobaciones) {
      const vacias: Record<string, EstadoColumnData> = {};
      COLUMNAS_APROBACION_ORDEN.forEach((estado) => {
        vacias[estado] = { ...EMPTY_COLUMN };
      });
      setColumnasData(vacias);
      return;
    }

    const server = kanbanData.getKanbanDataAprobaciones;
    const next: Record<string, EstadoColumnData> = {};

    COLUMNAS_APROBACION_ORDEN.forEach((estado) => {
      const col = server[estado];
      if (col?.aprobaciones) {
        const solicitudes = col.aprobaciones.map(aprobacionGqlToSolicitudKanban);
        const unicas = solicitudes.filter(
          (s, i, self) => i === self.findIndex((x) => x.id === s.id)
        );
        next[estado] = {
          solicitudes: unicas,
          hasNextPage: col.hasNextPage ?? false,
          totalCount: col.total ?? unicas.length,
          isLoading: false,
        };
      } else {
        next[estado] = { ...EMPTY_COLUMN };
      }
    });

    setColumnasData(next);
  }, [kanbanData, entidadTipoGraphQL]);

  useEffect(() => {
    if (kanbanData && !hasLoaded) setHasLoaded(true);
  }, [kanbanData, hasLoaded]);

  const handleLoadMore = async (estado: string) => {
    const columnaActual = columnasData[estado];
    if (!columnaActual?.hasNextPage) return;

    setColumnasData((prev) => ({
      ...prev,
      [estado]: { ...prev[estado], isLoading: true },
    }));

    try {
      const offset = columnaActual.solicitudes.length;
      const variables = {
        estado,
        limit: KANBAN_APROBACION_PAGE_SIZE,
        offset,
        entidadTipo: entidadTipoGraphQL ?? null,
      };

      const response = await graphqlRequest<{
        aprobaciones: { items: AprobacionKanbanGql[]; totalCount: number };
      }>(LISTAR_APROBACIONES_KANBAN_QUERY, variables);

      const nuevas = (response?.aprobaciones?.items ?? []).map(aprobacionGqlToSolicitudKanban);
      const totalCount = response?.aprobaciones?.totalCount ?? columnaActual.totalCount;

      setColumnasData((prev) => {
        const existentes = prev[estado].solicitudes;
        const todas = [...existentes, ...nuevas];
        const unicas = todas.filter((s, i, self) => i === self.findIndex((x) => x.id === s.id));

        return {
          ...prev,
          [estado]: {
            solicitudes: unicas,
            totalCount,
            hasNextPage: unicas.length < totalCount,
            isLoading: false,
          },
        };
      });
    } catch (e) {
      console.error(`Error cargando más aprobaciones (${estado}):`, e);
      setColumnasData((prev) => ({
        ...prev,
        [estado]: { ...prev[estado], isLoading: false },
      }));
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">
        No se pudo cargar el tablero. {error instanceof Error ? error.message : ''}
      </div>
    );
  }

  const showSkeleton = isInitialLoading && !hasLoaded;

  return (
    <div className="flex h-full min-h-0 justify-evenly gap-3 overflow-x-auto py-3">
      {COLUMNAS_APROBACION_ORDEN.map((estado) => {
        const columnaData = columnasData[estado];
        const skeleton = showSkeleton || !columnaData;

        return (
          <div key={estado} className="flex h-full w-[318px] shrink-0 flex-col">
            {skeleton ? (
              <AprobacionesKanbanSkeleton />
            ) : (
              <AprobacionesKanbanColumn
                estado={estado}
                items={columnaData.solicitudes}
                totalCount={columnaData.totalCount}
                isLoading={columnaData.isLoading}
                onLoadMore={() => handleLoadMore(estado)}
                hasNextPage={columnaData.hasNextPage}
                onOpenDetalle={onOpenRevision}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
