export const LISTAR_PLANTILLAS_CHECKLIST_QUERY = `
  query ListarPlantillasChecklist($limit: Int, $offset: Int, $filtros: PlantillaChecklistFiltros) {
    listarPlantillasChecklist(limit: $limit, offset: $offset, filtros: $filtros) {
      plantillasChecklist {
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
      totalCount
    }
  }
`;

export const OBTENER_PLANTILLA_CHECKLIST_QUERY = `
  query ObtenerPlantillaChecklist($id: ID!) {
    obtenerPlantillaChecklist(id: $id) {
      id
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

export const FIND_ACTIVAS_PLANTILLA_CHECKLIST_QUERY = `
  query FindActivasPlantillaChecklist {
    findActivasPlantillaChecklist {
      id
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

export const FIND_INACTIVAS_PLANTILLA_CHECKLIST_QUERY = `
  query FindInactivasPlantillaChecklist {
    findInactivasPlantillaChecklist {
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
