/**
 * 📄 QUERIES PARA TIPOS DE PAGO OC
 */

export const LISTAR_TIPOS_PAGO_OC_QUERY = `
  query ListarTiposPagoOC($filter: TipoPagoOCFilter) {
    listarTiposPagoOC(filter: $filter) {
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
      categoria {
        id
        nombre
        tipoUso
        permiteMultiple
        permiteVincularReportes
      }
      checklist {
        id
        codigo
        nombre
        version
        vigente
        activo
      }
    }
  }
`;

export const OBTENER_TIPO_PAGO_OC_QUERY = `
  query ObtenerTipoPagoOC($id: ID!) {
    obtenerTipoPagoOC(id: $id) {
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
      categoria {
        id
        nombre
        tipoUso
        permiteMultiple
        permiteVincularReportes
      }
      checklist {
        id
        codigo
        nombre
        version
        vigente
        activo
      }
      expediente {
        id
        ocCodigo
        estado
        montoContrato
      }
    }
  }
`;

export const OBTENER_TIPOS_PAGO_POR_EXPEDIENTE_QUERY = `
  query ObtenerTiposPagoPorExpediente($expedienteId: String!) {
    obtenerTiposPagoPorExpediente(expedienteId: $expedienteId) {
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
      categoria {
        id
        nombre
        tipoUso
        permiteMultiple
        permiteVincularReportes
      }
      checklist {
        id
        codigo
        nombre
        version
        vigente
        activo
      }
    }
  }
`;

export const VALIDAR_CREACION_SOLICITUD_QUERY = `
  query ValidarCreacionSolicitud($input: ValidarCreacionSolicitudInput!) {
    validarCreacionSolicitud(input: $input) {
      puedeCrear
      motivo
    }
  }
`;
