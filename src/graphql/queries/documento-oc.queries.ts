/**
 * 📄 QUERIES PARA DOCUMENTOS OC (alineadas al schema GraphQL del backend)
 */

export const LISTAR_DOCUMENTOS_OC_QUERY = `
  query ListarDocumentosOC($filter: DocumentoOCFilter) {
    listarDocumentosOC(filter: $filter) {
      id
      expedienteId
      checklistId
      obligatorio
      bloqueaSolicitudPago
      estado
      fechaCarga
    }
  }
`;

export const OBTENER_DOCUMENTO_OC_QUERY = `
  query ObtenerDocumentoOC($id: ID!) {
    obtenerDocumentoOC(id: $id) {
      id
      expedienteId
      checklistId
      obligatorio
      bloqueaSolicitudPago
      estado
      fechaCarga
      checklist {
        id
        codigo
        nombre
        descripcion
        categoriaChecklistId
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
      checklistId
      obligatorio
      bloqueaSolicitudPago
      estado
      fechaCarga
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
      checklistId
      obligatorio
      bloqueaSolicitudPago
      estado
      fechaCarga
    }
  }
`;
