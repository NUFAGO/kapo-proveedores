/**
 * 📋 REQUISITO DOCUMENTO MUTATIONS
 * Mutations para gestionar requisitos de documentos
 */

export const CREAR_REQUISITO_DOCUMENTO_MUTATION = `
  mutation CrearRequisitoDocumento($input: RequisitoDocumentoInput!) {
    crearRequisitoDocumento(input: $input) {
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
      }
      formulario {
        id
        nombre
        version
      }
    }
  }
`;

export const ACTUALIZAR_REQUISITO_DOCUMENTO_MUTATION = `
  mutation ActualizarRequisitoDocumento($id: ID!, $input: RequisitoDocumentoInput!) {
    actualizarRequisitoDocumento(id: $id, input: $input) {
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
      }
      formulario {
        id
        nombre
        version
      }
    }
  }
`;

export const ELIMINAR_REQUISITO_DOCUMENTO_MUTATION = `
  mutation EliminarRequisitoDocumento($id: ID!) {
    eliminarRequisitoDocumento(id: $id) {
      id
      success
      message
    }
  }
`;

export const CAMBIAR_ESTADO_REQUISITO_DOCUMENTO_MUTATION = `
  mutation CambiarEstadoRequisitoDocumento($id: ID!, $activo: Boolean!) {
    cambiarEstadoRequisitoDocumento(id: $id, activo: $activo) {
      id
      activo
      success
      message
    }
  }
`;

export const REORDENAR_REQUISITOS_MUTATION = `
  mutation ReordenarRequisitos($checklistId: ID!, $requisitos: [RequisitoOrdenInput!]!) {
    reordenarRequisitos(checklistId: $checklistId, requisitos: $requisitos) {
      id
      orden
      success
      message
    }
  }
`;
