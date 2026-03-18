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
      version
      plantillaBaseId
      vigente
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
        plantillaDocumento {
          id
          tipoDocumento {
            codigo
            nombre
            descripcion
          }
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
      version
      plantillaBaseId
      vigente
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
        plantillaDocumento {
          id
          tipoDocumento {
            codigo
            nombre
            descripcion
          }
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

export const CREAR_NUEVA_VERSION_MUTATION = `
  mutation CrearNuevaVersion($checklistId: String!) {
    crearNuevaVersion(checklistId: $checklistId) {
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
      version
      plantillaBaseId
      vigente
      activo
      fechaCreacion
      fechaActualizacion
    }
  }
`;
