/**
 * 📄 MUTATIONS PARA TIPOS DE PAGO OC
 */

export const CREAR_TIPO_PAGO_OC_MUTATION = `
  mutation CrearTipoPagoOC($input: TipoPagoOCInput!) {
    crearTipoPagoOC(input: $input) {
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
        tipoUso
      }
      checklist {
        id
        codigo
        nombre
        version
      }
    }
  }
`;

export const ACTUALIZAR_TIPO_PAGO_OC_MUTATION = `
  mutation ActualizarTipoPagoOC($id: ID!, $input: UpdateTipoPagoOCInput!) {
    actualizarTipoPagoOC(id: $id, input: $input) {
      id
      expedienteId
      categoriaChecklistId
      checklistId
      modoRestriccion
      orden
      requiereAnteriorPagado
      porcentajeMaximo
      porcentajeMinimo
      permiteVincularReportes
      categoria {
        id
        nombre
        tipoUso
      }
      checklist {
        id
        codigo
        nombre
        version
      }
    }
  }
`;

export const ELIMINAR_TIPO_PAGO_OC_MUTATION = `
  mutation EliminarTipoPagoOC($id: ID!) {
    eliminarTipoPagoOC(id: $id)
  }
`;
