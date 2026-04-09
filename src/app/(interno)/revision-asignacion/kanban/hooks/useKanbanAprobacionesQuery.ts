'use client';

import { useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  GET_KANBAN_DATA_APROBACIONES_QUERY,
  KANBAN_APROBACION_PAGE_SIZE,
} from '@/graphql/queries/aprobacion-kanban.queries';
import type { EstadoAprobacionKanban } from '../lib/aprobaciones-kanban.types';
import type { AprobacionKanbanGql } from '../lib/aprobaciones-kanban.mapper';

export type KanbanColumnGql = {
  aprobaciones: AprobacionKanbanGql[];
  total: number;
  hasNextPage: boolean;
};

export type GetKanbanDataAprobacionesResponse = {
  getKanbanDataAprobaciones: Record<EstadoAprobacionKanban, KanbanColumnGql>;
};

export function kanbanAprobacionesQueryKey(entidadTipoGraphQL: 'solicitud_pago' | 'documento_oc' | undefined) {
  return ['kanban-data-aprobaciones', entidadTipoGraphQL ?? 'all', KANBAN_APROBACION_PAGE_SIZE] as const;
}

export async function fetchKanbanDataAprobaciones(
  entidadTipoGraphQL: 'solicitud_pago' | 'documento_oc' | undefined
): Promise<GetKanbanDataAprobacionesResponse> {
  const filtros: Record<string, unknown> = { limit: KANBAN_APROBACION_PAGE_SIZE };
  if (entidadTipoGraphQL) filtros['entidadTipo'] = entidadTipoGraphQL;
  return graphqlRequest<GetKanbanDataAprobacionesResponse>(GET_KANBAN_DATA_APROBACIONES_QUERY, {
    filtros,
  });
}

/** Datos iniciales del tablero (compartido entre cabecera y board: una sola petición gracias a React Query). */
export function useKanbanAprobacionesQuery(
  entidadTipoGraphQL: 'solicitud_pago' | 'documento_oc' | undefined
) {
  return useQuery({
    queryKey: kanbanAprobacionesQueryKey(entidadTipoGraphQL),
    queryFn: () => fetchKanbanDataAprobaciones(entidadTipoGraphQL),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
