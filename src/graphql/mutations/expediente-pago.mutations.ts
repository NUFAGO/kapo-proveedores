/**
 * 📄 MUTATIONS PARA EXPEDIENTES DE PAGO
 */

export const CREAR_EXPEDIENTE_PAGO_MUTATION = `
  mutation CrearExpedientePago($input: ExpedientePagoInput!) {
    crearExpedientePago(input: $input) {
      id
      ocId
      ocCodigo
      proveedorId
      proveedorNombre
      montoContrato
      estado
      montoDisponible
      fechaCreacion
    }
  }
`;

export const CONFIGURAR_EXPEDIENTE_MUTATION = `
  mutation ConfigurarExpediente($input: ConfigurarExpedienteInput!) {
    configurarExpediente(input: $input) {
      id
      ocId
      ocCodigo
      estado
      fechaConfigurado
      montoDisponible
    }
  }
`;

export const ACTUALIZAR_ESTADO_EXPEDIENTE_MUTATION = `
  mutation ActualizarEstadoExpediente($id: ID!, $estado: String!) {
    actualizarEstadoExpediente(id: $id, estado: $estado) {
      id
      estado
      fechaConfigurado
    }
  }
`;

export const ACTUALIZAR_SALDOS_EXPEDIENTE_MUTATION = `
  mutation ActualizarSaldosExpediente($id: ID!, $montoComprometido: Float!, $montoPagado: Float!) {
    actualizarSaldosExpediente(id: $id, montoComprometido: $montoComprometido, montoPagado: $montoPagado) {
      id
      montoComprometido
      montoPagado
      montoDisponible
      estado
    }
  }
`;

export const ELIMINAR_EXPEDIENTE_PAGO_MUTATION = `
  mutation EliminarExpedientePago($id: ID!) {
    eliminarExpedientePago(id: $id)
  }
`;

export const GUARDAR_EXPEDIENTE_CON_ITEMS_MUTATION = `
  mutation GuardarExpedienteConItems($input: GuardarExpedienteItemsInput!) {
    guardarExpedienteConItems(input: $input) {
      id
      ocId
      ocCodigo
      estado
      proveedorNombre
      montoContrato
      fechaCreacion
      fechaConfigurado
    }
  }
`;
