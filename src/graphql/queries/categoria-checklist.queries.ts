export const LISTAR_CATEGORIAS_CHECKLIST_QUERY = `
  query ListarCategoriasChecklist($limit: Int, $offset: Int, $filters: CategoriaChecklistFiltros) {
    listarCategoriasChecklist(limit: $limit, offset: $offset, filters: $filters) {
      categoriasChecklist {
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
      totalCount
    }
  }
`;

export const OBTENER_CATEGORIA_CHECKLIST_QUERY = `
  query ObtenerCategoriaChecklist($id: ID!) {
    obtenerCategoriaChecklist(id: $id) {
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

export const FIND_ACTIVAS_CATEGORIA_CHECKLIST_QUERY = `
  query FindActivasCategoriaChecklist {
    findActivasCategoriaChecklist {
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

export const FIND_INACTIVAS_CATEGORIA_CHECKLIST_QUERY = `
  query FindInactivasCategoriaChecklist {
    findInactivasCategoriaChecklist {
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
