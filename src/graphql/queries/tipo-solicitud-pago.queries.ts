export const LISTAR_TIPOS_SOLICITUD_PAGO_QUERY = `
  query ListarTiposSolicitudPago($limit: Int, $offset: Int, $filters: TipoSolicitudPagoFiltros) {
    listarTiposSolicitudPago(limit: $limit, offset: $offset, filters: $filters) {
      tiposSolicitudPago {
        id
        codigo
        nombre
        descripcion
        categoria
        permiteMultiple
        permiteVincularReportes
        estado
        fechaCreacion
        fechaActualizacion
      }
      totalCount
    }
  }
`;

export const OBTENER_TIPO_SOLICITUD_PAGO_QUERY = `
  query ObtenerTipoSolicitudPago($id: ID!) {
    obtenerTipoSolicitudPago(id: $id) {
      id
      codigo
      nombre
      descripcion
      categoria
      permiteMultiple
      permiteVincularReportes
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const FIND_ACTIVOS_SOLICITUD_PAGO_QUERY = `
  query FindActivosSolicitudPago {
    findActivosSolicitudPago {
      id
      codigo
      nombre
      descripcion
      categoria
      permiteMultiple
      permiteVincularReportes
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const FIND_INACTIVOS_SOLICITUD_PAGO_QUERY = `
  query FindInactivosSolicitudPago {
    findInactivosSolicitudPago {
      id
      codigo
      nombre
      descripcion
      categoria
      permiteMultiple
      permiteVincularReportes
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;
