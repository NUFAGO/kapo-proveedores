export const CREATE_CATEGORIA_CHECKLIST_MUTATION = `
  mutation CreateCategoriaChecklist($input: CategoriaChecklistInput!) {
    crearCategoriaChecklist(input: $input) {
      id
      nombre
      descripcion
      tipoUso
      permiteMultiple
      permiteVincularReportes
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const UPDATE_CATEGORIA_CHECKLIST_MUTATION = `
  mutation UpdateCategoriaChecklist($id: ID!, $input: CategoriaChecklistInput!) {
    actualizarCategoriaChecklist(id: $id, input: $input) {
      id
      nombre
      descripcion
      tipoUso
      permiteMultiple
      permiteVincularReportes
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const DELETE_CATEGORIA_CHECKLIST_MUTATION = `
  mutation DeleteCategoriaChecklist($id: ID!) {
    eliminarCategoriaChecklist(id: $id)
  }
`;
