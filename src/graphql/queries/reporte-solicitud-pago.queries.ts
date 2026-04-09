/**
 * Reportes operativos ligados a solicitudes de pago (portal proveedor)
 */

export const OBTENER_REPORTE_SOLICITUD_PAGO_QUERY = `
  query ObtenerReporteSolicitudPago($id: ID!) {
    obtenerReporteSolicitudPago(id: $id) {
      id
      codigo
      proveedorId
      identificadorSolicitudPago
      solicitudPagoId
      fecha
      maestroResponsable
      observacionesGenerales
      createdAt
      updatedAt
      cuadrillas {
        observaciones
        personal {
          nombreCompleto
          cargo
          observaciones
        }
        actividades {
          actividad
          und
          tiempoHoras
          meta
          real
          evidencias {
            url
          }
        }
      }
    }
  }
`;

export const LISTAR_REPORTES_POR_SOLICITUD_PAGO_QUERY = `
  query ListarReportesPorSolicitudPago($solicitudPagoId: ID!) {
    listarReportesPorSolicitudPago(solicitudPagoId: $solicitudPagoId) {
      id
      codigo
      proveedorId
      identificadorSolicitudPago
      solicitudPagoId
      fecha
      maestroResponsable
      observacionesGenerales
      createdAt
      updatedAt
    }
  }
`;

export const LISTAR_REPORTES_SOLICITUD_PAGO_POR_PROVEEDOR_QUERY = `
  query ListarReportesSolicitudPagoPorProveedor(
    $proveedorId: String!
    $filter: ReporteSolicitudPagoFilter
  ) {
    listarReportesSolicitudPagoPorProveedor(proveedorId: $proveedorId, filter: $filter) {
      data {
        id
        codigo
        proveedorId
        identificadorSolicitudPago
        solicitudPagoId
        fecha
        maestroResponsable
        observacionesGenerales
        createdAt
        updatedAt
        solicitudPago {
          id
          estado
          expediente {
            ocCodigo
            descripcion
          }
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`;
