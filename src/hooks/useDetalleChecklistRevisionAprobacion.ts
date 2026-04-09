'use client';

import { useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { DETALLE_CHECKLIST_REVISION_APROBACION_QUERY } from '@/graphql/queries/aprobaciones-revision.queries';

export type ArchivoRevisionGql = {
  url: string;
  nombreOriginal: string;
  mimeType: string;
  tamanioBytes: number;
  fechaSubida: string;
};

export type DocumentoSubidoRevisionGql = {
  id: string;
  documentoOCId?: string | null;
  solicitudPagoId?: string | null;
  requisitoDocumentoId?: string | null;
  estado: string;
  version: number;
  fechaSubida: string;
  fechaRevision?: string | null;
  comentariosRevision?: string | null;
  archivos: ArchivoRevisionGql[];
};

export type RequisitoRevisionGql = {
  id: string;
  checklistId: string;
  tipoRequisito: string;
  plantillaDocumentoId?: string | null;
  obligatorio: boolean;
  orden: number;
  plantillaDocumento?: {
    id: string;
    codigo: string;
    nombrePlantilla: string;
    plantillaUrl: string;
    formatosPermitidos?: string | null;
    activo: boolean;
  } | null;
};

export type DetalleChecklistRevisionAprobacionGql = {
  aprobacionId: string;
  estado: string;
  entidadTipo: string;
  entidadId: string;
  expedienteId: string;
  montoSolicitado?: number | null;
  tipoPagoOCId?: string | null;
  checklist: {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    activo: boolean;
    fechaCreacion: string;
    categoriaChecklistId: string;
    categoria?: { id: string; nombre: string; tipoUso: string } | null;
    requisitos?: RequisitoRevisionGql[] | null;
  };
  documentosSubidos: DocumentoSubidoRevisionGql[];
};

export type DetalleChecklistRevisionResponse = {
  detalleChecklistRevisionAprobacion: DetalleChecklistRevisionAprobacionGql;
};

export function detalleChecklistRevisionQueryKey(aprobacionId: string | null) {
  return ['detalle-checklist-revision-aprobacion', aprobacionId] as const;
}

export function useDetalleChecklistRevisionAprobacion(
  aprobacionId: string | null,
  isOpen: boolean
) {
  return useQuery({
    queryKey: detalleChecklistRevisionQueryKey(aprobacionId),
    queryFn: async () => {
      if (!aprobacionId) throw new Error('aprobacionId requerido');
      return graphqlRequest<DetalleChecklistRevisionResponse>(
        DETALLE_CHECKLIST_REVISION_APROBACION_QUERY,
        { aprobacionId }
      );
    },
    enabled: Boolean(aprobacionId) && isOpen,
    staleTime: 60 * 1000,
  });
}
