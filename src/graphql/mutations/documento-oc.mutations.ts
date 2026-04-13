/**
 * 📄 MUTATIONS PARA DOCUMENTOS OC
 */

export const CREAR_DOCUMENTO_OC_MUTATION = `
  mutation CrearDocumentoOC($input: DocumentoOCInput!) {
    crearDocumentoOC(input: $input) {
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

export const SUBIR_ARCHIVOS_DOCUMENTO_MUTATION = `
  mutation SubirArchivosDocumento($input: SubirArchivosInput!) {
    subirArchivosDocumento(input: $input) {
      id
      documentoOCId
      archivos {
        url
        nombreOriginal
        mimeType
        tamanioBytes
        fechaSubida
      }
      estado
      fechaSubida
      version
    }
  }
`;

export const APROBAR_DOCUMENTO_OC_MUTATION = `
  mutation AprobarDocumentoOC($input: AprobarDocumentoInput!) {
    aprobarDocumentoOC(input: $input) {
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

export const OBSERVAR_DOCUMENTO_OC_MUTATION = `
  mutation ObservarDocumentoOC($input: ObservarDocumentoInput!) {
    observarDocumentoOC(input: $input) {
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

export const ACTUALIZAR_DOCUMENTO_OC_MUTATION = `
  mutation ActualizarDocumentoOC($id: ID!, $input: UpdateDocumentoOCInput!) {
    actualizarDocumentoOC(id: $id, input: $input) {
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

export const ELIMINAR_DOCUMENTO_OC_MUTATION = `
  mutation EliminarDocumentoOC($id: ID!) {
    eliminarDocumentoOC(id: $id)
  }
`;
