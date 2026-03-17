export const CREATE_TIPO_SOLICITUD_PAGO_MUTATION = `
  mutation CreateTipoSolicitudPago($input: TipoSolicitudPagoInput!) {
    crearTipoSolicitudPago(input: $input) {
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

export const UPDATE_TIPO_SOLICITUD_PAGO_MUTATION = `
  mutation UpdateTipoSolicitudPago($id: ID!, $input: TipoSolicitudPagoInput!) {
    actualizarTipoSolicitudPago(id: $id, input: $input) {
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

export const DELETE_TIPO_SOLICITUD_PAGO_MUTATION = `
  mutation DeleteTipoSolicitudPago($id: ID!) {
    eliminarTipoSolicitudPago(id: $id)
  }
`;
