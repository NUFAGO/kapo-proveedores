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

// Query para buscar expediente por codigo de OC
export const OBTENER_EXPEDIENTE_POR_CODIGO_QUERY = `
  query ObtenerExpedientePorCodigo($codigo: String!) {
    listarExpedientesPago(filter: { 
      ocCodigo: $codigo,
      limit: 1
    }) {
      data {
        id
        ocId
        ocCodigo
        estado
        montoContrato
        montoDisponible
        fechaCreacion
      }
      total
    }
  }
`;

export const OBTENER_EXPEDIENTES_POR_PROVEEDOR_QUERY = `
  query ObtenerExpedientesPorProveedor($proveedorId: String!, $filter: ExpedientePagoFilter) {
    obtenerExpedientesPorProveedor(proveedorId: $proveedorId, filter: $filter) {
      data {
        id
        ocId
        ocCodigo
        estado
        montoContrato
        montoDisponible
        montoComprometido
        montoPagado
        fechaCreacion
        descripcion
        proveedorId
        proveedorNombre
        fechaInicioContrato
        fechaFinContrato
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const OBTENER_EXPEDIENTE_COMPLETO_QUERY = `
  query ObtenerExpedienteCompleto($id: ID!) {
    obtenerExpedienteCompleto(id: $id) {
      id
      ocId
      ocCodigo
      proveedorId
      proveedorNombre
      montoContrato
      montoDisponible
      montoComprometido
      montoPagado
      estado
      fechaInicioContrato
      fechaFinContrato
      descripcion
      adminCreadorId
      fechaCreacion
      fechaConfigurado
      tiposPago {
        id
        expedienteId
        categoriaChecklistId
        checklistId
        fechaAsignacion
        modoRestriccion
        orden
        requiereAnteriorPagado
        porcentajeMaximo
        porcentajeMinimo
        permiteVincularReportes
        categoria {
          id
          nombre
          descripcion
          tipoUso
          estado
        }
        checklist {
          id
          codigo
          nombre
          descripcion
          categoriaChecklistId
          activo
          fechaActualizacion
          requisitos {
            id
            checklistId
            tipoRequisito
            plantillaDocumentoId
            formularioId
            obligatorio
            orden
            activo
            plantillaDocumento {
              id
              codigo
              nombrePlantilla
              plantillaUrl
              formatosPermitidos
              activo
              fechaCreacion
              fechaActualizacion
            }
            formulario {
              id
              nombre
              version
              activo
            }
          }
        }
      }
      documentos {
        id
        expedienteId
        checklistId
        obligatorio
        bloqueaSolicitudPago
        estado
        fechaCarga
        checklist {
          id
          codigo
          nombre
          descripcion
          categoriaChecklistId
          categoria {
            id
            nombre
            descripcion
            tipoUso
            estado
          }
          activo
          fechaActualizacion
          requisitos {
            id
            checklistId
            tipoRequisito
            plantillaDocumentoId
            formularioId
            obligatorio
            orden
            activo
            plantillaDocumento {
              id
              codigo
              nombrePlantilla
              plantillaUrl
              formatosPermitidos
              activo
              fechaCreacion
              fechaActualizacion
            }
            formulario {
              id
              nombre
              version
              activo
            }
          }
        }
      }
    }
  }
`;
