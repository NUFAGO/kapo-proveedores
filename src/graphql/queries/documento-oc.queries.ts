/**
 * 📄 QUERIES PARA DOCUMENTOS OC
 */

export const LISTAR_DOCUMENTOS_OC_QUERY = `
  query ListarDocumentosOC($filter: DocumentoOCFilter) {
    listarDocumentosOC(filter: $filter) {
      id
      expedienteId
      tipoDocumentoId
      plantillaDocumentoId
      usuarioId
      adminRevisorId
      obligatorio
      archivos {
        url
        nombreOriginal
        mimeType
        tamanioBytes
        fechaSubida
      }
      estado
      fechaCarga
      comentarios
      tipoDocumento {
        id
        nombre
        descripcion
        unicoPorOc
      }
      plantillaDocumento {
        id
        nombrePlantilla
        plantillaUrl
        activo
      }
    }
  }
`;

export const OBTENER_DOCUMENTO_OC_QUERY = `
  query ObtenerDocumentoOC($id: ID!) {
    obtenerDocumentoOC(id: $id) {
      id
      expedienteId
      tipoDocumentoId
      plantillaDocumentoId
      usuarioId
      adminRevisorId
      obligatorio
      archivos {
        url
        nombreOriginal
        mimeType
        tamanioBytes
        fechaSubida
      }
      estado
      fechaCarga
      comentarios
      tipoDocumento {
        id
        nombre
        descripcion
        unicoPorOc
      }
      plantillaDocumento {
        id
        nombrePlantilla
        plantillaUrl
        activo
      }
      expediente {
        id
        ocCodigo
        estado
      }
    }
  }
`;

export const OBTENER_DOCUMENTOS_POR_EXPEDIENTE_QUERY = `
  query ObtenerDocumentosPorExpediente($expedienteId: String!) {
    obtenerDocumentosPorExpediente(expedienteId: $expedienteId) {
      id
      expedienteId
      tipoDocumentoId
      plantillaDocumentoId
      usuarioId
      adminRevisorId
      obligatorio
      archivos {
        url
        nombreOriginal
        mimeType
        tamanioBytes
        fechaSubida
      }
      estado
      fechaCarga
      comentarios
      tipoDocumento {
        id
        nombre
        descripcion
        unicoPorOc
      }
      plantillaDocumento {
        id
        nombrePlantilla
        plantillaUrl
        activo
      }
    }
  }
`;

export const VERIFICAR_DOCUMENTOS_OBLIGATORIOS_APROBADOS_QUERY = `
  query VerificarDocumentosObligatoriosAprobados($expedienteId: String!) {
    verificarDocumentosObligatoriosAprobados(expedienteId: $expedienteId)
  }
`;

export const OBTENER_DOCUMENTOS_OBLIGATORIOS_PENDIENTES_QUERY = `
  query ObtenerDocumentosObligatoriosPendientes($expedienteId: String!) {
    obtenerDocumentosObligatoriosPendientes(expedienteId: $expedienteId) {
      id
      expedienteId
      tipoDocumentoId
      plantillaDocumentoId
      obligatorio
      estado
      tipoDocumento {
        id
        nombre
        descripcion
      }
    }
  }
`;
