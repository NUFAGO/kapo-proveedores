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
            tipoDocumentoId
            nombrePlantilla
            formatosPermitidos
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
      version
      plantillaBaseId
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
          tipoDocumentoId
          nombrePlantilla
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
      version
      plantillaBaseId
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
          tipoDocumentoId
          nombrePlantilla
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
          tipoDocumentoId
          nombrePlantilla
        }
      }
    }
  }
`;

export const FIND_VIGENTES_PLANTILLA_CHECKLIST_QUERY = `
  query FindVigentesPlantillaChecklist {
    findVigentesPlantillaChecklist {
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

export const OBTENER_VERSIONES_POR_CODIGO_QUERY = `
  query ObtenerVersionesPorCodigo($codigo: String!) {
    obtenerVersionesPorCodigo(codigo: $codigo) {
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

export const OBTENER_VERSION_VIGENTE_POR_CODIGO_QUERY = `
  query ObtenerVersionVigentePorCodigo($codigo: String!) {
    obtenerVersionVigentePorCodigo(codigo: $codigo) {
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
          tipoDocumentoId
          nombrePlantilla
        }
      }
    }
  }
`;
