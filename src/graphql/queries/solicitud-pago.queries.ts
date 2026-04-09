export const OBTENER_SOLICITUDES_POR_EXPEDIENTE_QUERY = `
  query ObtenerSolicitudesPorExpediente($expedienteId: String!) {
    obtenerSolicitudesPorExpediente(expedienteId: $expedienteId) {
      id
      expedienteId
      tipoPagoOCId
      montoSolicitado
      estado
      fechaCreacion
      tipoPagoOC {
        id
        orden
        categoria {
          nombre
        }
      }
    }
  }
`
