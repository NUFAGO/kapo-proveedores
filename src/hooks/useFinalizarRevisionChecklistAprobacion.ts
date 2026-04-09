'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { graphqlRequest } from '@/lib/graphql-client';
import { FINALIZAR_REVISION_CHECKLIST_APROBACION_MUTATION } from '@/graphql/mutations/aprobacion-revision.mutations';
import { KANBAN_APROBACION_PAGE_SIZE } from '@/graphql/queries/aprobacion-kanban.queries';
import { detalleChecklistRevisionQueryKey } from '@/hooks/useDetalleChecklistRevisionAprobacion';

export type RevisionDocumentoSubidoInput = {
  documentoSubidoId: string;
  resultado: 'APROBADO' | 'OBSERVADO';
  comentario?: string;
};

export type FinalizarRevisionChecklistAprobacionInput = {
  aprobacionId: string;
  rechazar: boolean;
  comentarioRechazo?: string;
  /** Guardado en observaciones o comentarios de aprobación (no aplica si rechazar). */
  comentarioGeneral?: string;
  revisionesDocumentos: RevisionDocumentoSubidoInput[];
  revisorId: string;
  revisorNombre?: string;
};

type FinalizarRevisionResponse = {
  finalizarRevisionChecklistAprobacion: {
    id: string;
    estado: string;
    entidadTipo: string;
    entidadId: string;
  };
};

export function useFinalizarRevisionChecklistAprobacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FinalizarRevisionChecklistAprobacionInput) => {
      return graphqlRequest<FinalizarRevisionResponse>(
        FINALIZAR_REVISION_CHECKLIST_APROBACION_MUTATION,
        { input }
      );
    },
    onSuccess: (_data, variables) => {
      const accion = variables.rechazar
        ? 'Solicitud rechazada'
        : variables.revisionesDocumentos.some((r) => r.resultado === 'OBSERVADO')
          ? 'Observaciones registradas'
          : 'Aprobación completada';
      toast.success(accion);
      queryClient.invalidateQueries({ queryKey: ['kanban-data-aprobaciones'] });
      queryClient.invalidateQueries({
        queryKey: ['kanban-data-aprobaciones', 'solicitud_pago', KANBAN_APROBACION_PAGE_SIZE],
      });
      queryClient.invalidateQueries({
        queryKey: ['kanban-data-aprobaciones', 'documento_oc', KANBAN_APROBACION_PAGE_SIZE],
      });
      queryClient.invalidateQueries({
        queryKey: ['kanban-data-aprobaciones', 'all', KANBAN_APROBACION_PAGE_SIZE],
      });
      queryClient.invalidateQueries({ queryKey: detalleChecklistRevisionQueryKey(variables.aprobacionId) });
      queryClient.invalidateQueries({ queryKey: ['aprobacion-detalle-checklist-por-entidad'] });
      queryClient.invalidateQueries({ queryKey: ['aprobaciones'] });
      queryClient.invalidateQueries({ queryKey: ['expediente-completo'] });
      queryClient.invalidateQueries({ queryKey: ['solicitudes-por-expediente'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-oc'] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || 'No se pudo completar la revisión');
    },
  });
}
