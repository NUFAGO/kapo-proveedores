'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  LISTAR_REPORTES_POR_SOLICITUD_PAGO_QUERY,
  LISTAR_REPORTES_SOLICITUD_PAGO_POR_PROVEEDOR_QUERY,
  OBTENER_REPORTE_SOLICITUD_PAGO_QUERY,
  CREAR_REPORTE_SOLICITUD_PAGO_MUTATION,
} from '@/graphql';

export interface ReporteSolicitudPagoFilter {
  page?: number;
  limit?: number;
  searchTerm?: string;
  /** true = vinculados; false = sin vincular; omitido = todos */
  vinculado?: boolean;
}

export interface ReporteSolicitudPagoRow {
  id: string;
  codigo?: string | null;
  proveedorId: string;
  identificadorSolicitudPago?: string | null;
  solicitudPagoId?: string | null;
  fecha: string;
  maestroResponsable: string;
  observacionesGenerales?: string | null;
  createdAt: string;
  updatedAt: string;
  solicitudPago?: {
    id: string;
    estado: string;
    expediente?: {
      ocCodigo: string;
      descripcion: string;
    } | null;
  } | null;
}

export interface ReporteSolicitudPagoPorProveedorConnection {
  data: ReporteSolicitudPagoRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Resumen en `listarReportesPorSolicitudPago` (misma entidad, sin relación anidada). */
export type ReporteSolicitudPagoResumenGql = Omit<ReporteSolicitudPagoRow, 'solicitudPago'>;

type ListarReportesPorSolicitudPagoResponse = {
  listarReportesPorSolicitudPago: ReporteSolicitudPagoResumenGql[];
};

export function reportesPorSolicitudPagoQueryKey(solicitudPagoId: string | null) {
  return ['reportes-por-solicitud-pago', solicitudPagoId] as const;
}

/**
 * Reportes de solicitud de pago vinculados a un id de solicitud (revisión interna, detalle, etc.).
 */
export function useReportesPorSolicitudPago(
  solicitudPagoId: string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const id = solicitudPagoId?.trim() ?? '';
  const enabled = Boolean(id) && (options.enabled ?? true);

  return useQuery<
    ListarReportesPorSolicitudPagoResponse,
    Error,
    ReporteSolicitudPagoResumenGql[]
  >({
    queryKey: reportesPorSolicitudPagoQueryKey(id || null),
    queryFn: async () =>
      graphqlRequest<ListarReportesPorSolicitudPagoResponse>(LISTAR_REPORTES_POR_SOLICITUD_PAGO_QUERY, {
        solicitudPagoId: id,
      }),
    enabled,
    staleTime: 60 * 1000,
    select: (d) => d.listarReportesPorSolicitudPago ?? [],
  });
}

export function useReportesSolicitudPagoPorProveedor(
  proveedorId: string,
  filters?: ReporteSolicitudPagoFilter
) {
  return useQuery({
    queryKey: ['reportes-solicitud-pago-por-proveedor', proveedorId, filters],
    queryFn: () =>
      graphqlRequest(LISTAR_REPORTES_SOLICITUD_PAGO_POR_PROVEEDOR_QUERY, {
        proveedorId,
        filter: filters ?? {},
      }),
    enabled: !!proveedorId,
    staleTime: 2 * 60 * 1000,
    select: (data: {
      listarReportesSolicitudPagoPorProveedor?: ReporteSolicitudPagoPorProveedorConnection;
    }): ReporteSolicitudPagoPorProveedorConnection =>
      data?.listarReportesSolicitudPagoPorProveedor ?? {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
  });
}

const REPORTES_SOLICITUD_PAGO_PAGE_DEFAULT = 15;

export interface ReportesSolicitudPagoInfiniteOptions {
  enabled: boolean;
  /** Tamaño de página (por defecto 15). */
  pageSize?: number;
  filter?: Pick<ReporteSolicitudPagoFilter, 'searchTerm' | 'vinculado'>;
}

/**
 * Misma query que el listado paginado de reportes; acumula páginas para scroll infinito.
 */
export function useReportesSolicitudPagoPorProveedorInfinite(
  proveedorId: string,
  options: ReportesSolicitudPagoInfiniteOptions
) {
  const pageSize = options.pageSize ?? REPORTES_SOLICITUD_PAGO_PAGE_DEFAULT;
  const { enabled, filter } = options;

  return useInfiniteQuery({
    queryKey: [
      'reportes-solicitud-pago-infinite',
      proveedorId,
      pageSize,
      filter?.searchTerm,
      filter?.vinculado,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const data = await graphqlRequest<{
        listarReportesSolicitudPagoPorProveedor?: ReporteSolicitudPagoPorProveedorConnection;
      }>(LISTAR_REPORTES_SOLICITUD_PAGO_POR_PROVEEDOR_QUERY, {
        proveedorId,
        filter: {
          page: pageParam as number,
          limit: pageSize,
          ...(filter?.searchTerm?.trim() ? { searchTerm: filter.searchTerm.trim() } : {}),
          ...(filter?.vinculado !== undefined ? { vinculado: filter.vinculado } : {}),
        },
      });
      return (
        data?.listarReportesSolicitudPagoPorProveedor ?? {
          data: [],
          total: 0,
          page: pageParam as number,
          limit: pageSize,
          totalPages: 0,
        }
      );
    },
    enabled: Boolean(proveedorId) && enabled,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.totalPages || lastPage.page >= lastPage.totalPages) return undefined;
      return lastPage.page + 1;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** Alineado con CrearReporteSolicitudPagoInput (GraphQL) */
export interface EvidenciaReporteSolicitudPagoInput {
  url: string;
}

export interface PersonalReporteSolicitudPagoInput {
  nombreCompleto: string;
  cargo: string;
  observaciones?: string;
}

export interface ActividadReporteSolicitudPagoInput {
  actividad: string;
  und: string;
  tiempoHoras: number;
  meta: number;
  real: number;
  evidencias: EvidenciaReporteSolicitudPagoInput[];
}

export interface CuadrillaReporteSolicitudPagoInput {
  personal: PersonalReporteSolicitudPagoInput[];
  actividades: ActividadReporteSolicitudPagoInput[];
  observaciones?: string;
}

export interface CrearReporteSolicitudPagoInput {
  identificadorSolicitudPago: string;
  fecha: string;
  maestroResponsable: string;
  cuadrillas: CuadrillaReporteSolicitudPagoInput[];
  observacionesGenerales?: string;
}

/** Detalle completo de `obtenerReporteSolicitudPago` (lectura). */
export interface ReporteSolicitudPagoDetalle {
  id: string;
  codigo?: string | null;
  proveedorId: string;
  identificadorSolicitudPago?: string | null;
  solicitudPagoId?: string | null;
  fecha: string;
  maestroResponsable: string;
  observacionesGenerales?: string | null;
  createdAt: string;
  updatedAt: string;
  cuadrillas: CuadrillaReporteSolicitudPagoInput[];
}

export function useReporteSolicitudPago(id: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['reporte-solicitud-pago', id],
    queryFn: () =>
      graphqlRequest<{ obtenerReporteSolicitudPago: ReporteSolicitudPagoDetalle }>(
        OBTENER_REPORTE_SOLICITUD_PAGO_QUERY,
        { id }
      ),
    enabled: Boolean(enabled && id),
    select: (data: { obtenerReporteSolicitudPago: ReporteSolicitudPagoDetalle }) =>
      data.obtenerReporteSolicitudPago,
  });
}

export function useCrearReporteSolicitudPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearReporteSolicitudPagoInput) =>
      graphqlRequest<{ crearReporteSolicitudPago: ReporteSolicitudPagoRow }>(
        CREAR_REPORTE_SOLICITUD_PAGO_MUTATION,
        { input }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes-solicitud-pago-por-proveedor'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-solicitud-pago-infinite'] });
    },
  });
}
