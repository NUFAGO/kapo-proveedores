export const CREAR_REPORTE_SOLICITUD_PAGO_MUTATION = `
  mutation CrearReporteSolicitudPago($input: CrearReporteSolicitudPagoInput!) {
    crearReporteSolicitudPago(input: $input) {
      id
      codigo
      proveedorId
      identificadorSolicitudPago
      solicitudPagoId
      fecha
      maestroResponsable
      observacionesGenerales
      createdAt
    }
  }
`;
