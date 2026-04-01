export const GUARDAR_PLANTILLA_CHECKLIST_MUTATION = `
  mutation GuardarPlantillaChecklist($input: GuardarPlantillaChecklistInput!) {
    guardarPlantillaChecklist(input: $input) {
      id
      codigo
      nombre
      descripcion
      categoriaChecklistId
      categoria {
        id
        nombre
        tipoUso
      }
      activo
      fechaCreacion
      fechaActualizacion
      requisitos {
        id
        tipoRequisito
        plantillaDocumentoId
        formularioId
        obligatorio
        orden
        activo
        plantillaDocumento {
          id
          codigo
          tipoDocumentoId
          nombrePlantilla
          plantillaUrl
          formatosPermitidos
          activo
          fechaCreacion
          fechaActualizacion
        }
      }
    }
  }
`;

export const CREATE_PLANTILLA_CHECKLIST_MUTATION = `
  mutation CreatePlantillaChecklist($input: PlantillaChecklistInput!) {
    crearPlantillaChecklist(input: $input) {
      id
      codigo
      nombre
      descripcion
      categoriaChecklistId
      categoria {
        id
        nombre
        tipoUso
      }
      activo
      fechaCreacion
      fechaActualizacion
      requisitos {
        id
        tipoRequisito
        plantillaDocumentoId
        formularioId
        obligatorio
        orden
        activo
        plantillaDocumento {
          id
          codigo
          tipoDocumentoId
          nombrePlantilla
          plantillaUrl
          formatosPermitidos
          activo
          fechaCreacion
          fechaActualizacion
        }
      }
    }
  }
`;

export const UPDATE_PLANTILLA_CHECKLIST_MUTATION = `
  mutation UpdatePlantillaChecklist($id: ID!, $input: PlantillaChecklistInput!) {
    actualizarPlantillaChecklist(id: $id, input: $input) {
      id
      codigo
      nombre
      descripcion
      categoriaChecklistId
      categoria {
        id
        nombre
        tipoUso
      }
      activo
      fechaCreacion
      fechaActualizacion
      requisitos {
        id
        tipoRequisito
        plantillaDocumentoId
        formularioId
        obligatorio
        orden
        activo
        plantillaDocumento {
          id
          codigo
          tipoDocumentoId
          nombrePlantilla
          plantillaUrl
          formatosPermitidos
          activo
          fechaCreacion
          fechaActualizacion
        }
      }
    }
  }
`;

export const DELETE_PLANTILLA_CHECKLIST_MUTATION = `
  mutation DeletePlantillaChecklist($id: ID!) {
    eliminarPlantillaChecklist(id: $id)
  }
`;
