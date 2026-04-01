/**
 * 📄 QUERIES PARA EXPEDIENTES DE PAGO
 */

export const LISTAR_EXPEDIENTES_PAGO_QUERY = `
  query ListarExpedientesPago($filter: ExpedientePagoFilter) {
    listarExpedientesPago(filter: $filter) {
      data {
        id
        ocId
        ocCodigo
        ocSnapshot
        fechaSnapshot
        proveedorId
        proveedorNombre
        montoContrato
        fechaInicioContrato
        fechaFinContrato
        descripcion
        estado
        montoComprometido
        montoPagado
        montoDisponible
        requiereReportes
        frecuenciaReporte
        minReportesPorSolicitud
        modoValidacionReportes
        adminCreadorId
        fechaCreacion
        fechaConfigurado
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const OBTENER_EXPEDIENTE_PAGO_QUERY = `
  query ObtenerExpedientePago($id: ID!) {
    obtenerExpedientePago(id: $id) {
      id
      ocId
      ocCodigo
      ocSnapshot
      fechaSnapshot
      proveedorId
      proveedorNombre
      montoContrato
      fechaInicioContrato
      fechaFinContrato
      descripcion
      estado
      montoComprometido
      montoPagado
      montoDisponible
      requiereReportes
      frecuenciaReporte
      minReportesPorSolicitud
      modoValidacionReportes
      adminCreadorId
      fechaCreacion
      fechaConfigurado
    }
  }
`;

export const OBTENER_EXPEDIENTE_POR_OC_ID_QUERY = `
  query ObtenerExpedientePorOcId($ocId: String!) {
    obtenerExpedientePorOcId(ocId: $ocId) {
      id
      ocId
      ocCodigo
      estado
      montoContrato
      montoDisponible
      fechaCreacion
    }
  }
`;

export const OBTENER_EXPEDIENTES_POR_PROVEEDOR_QUERY = `
  query ObtenerExpedientesPorProveedor($proveedorId: String!, $filter: ExpedientePagoFilter) {
    obtenerExpedientesPorProveedor(proveedorId: $proveedorId, filter: $filter) {
      id
      ocId
      ocCodigo
      estado
      montoContrato
      montoDisponible
      fechaCreacion
      descripcion
    }
  }
`;

export const OBTENER_EXPEDIENTE_COMPLETO_QUERY = `
  query ObtenerExpedienteCompleto($id: ID!) {
    obtenerExpedienteCompleto(id: $id) {
      id
      ordenCompraId
      codigo
      proveedorId
      proveedorNombre
      montoContrato
      montoDisponible
      montoComprometido
      montoPagado
      estado
      fechaInicio
      fechaFin
      descripcion
      adminCreadorId
      fechaCreacion
      fechaConfigurado
      tiposPago {
        id
        expedienteId
        categoriaChecklistId
        checklistId
        modoRestriccion
        orden
        requiereAnteriorPagado
        porcentajeMaximo
        porcentajeMinimo
        estado
        montoMaximo
        montoPagado
        fechaCreacion
        categoria {
          id
          nombre
          descripcion
          codigo
          categoriaTipoUso
          activo
        }
        checklist {
          id
          nombre
          descripcion
          codigo
          categoriaChecklistId
          activo
          vigente
          fechaActualizacion
        }
      }
      documentos {
        id
        expedienteId
        checklistId
        obligatorio
        estado
        fechaCreacion
        fechaAprobacion
        fechaObservacion
        observaciones
        archivos {
          id
          documentoOCId
          nombreArchivo
          urlArchivo
          tipoArchivo
          tamañoArchivo
          fechaSubida
          subidoPor
        }
        categoria {
          id
          nombre
          descripcion
          codigo
          categoriaTipoUso
          activo
        }
        checklist {
          id
          nombre
          descripcion
          codigo
          categoriaChecklistId
          activo
          vigente
          fechaActualizacion
        }
      }
    }
  }
`;
