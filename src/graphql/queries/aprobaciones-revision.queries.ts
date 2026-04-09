/**
 * Aprobación por entidad, revisión unificada (proveedor) y detalle checklist (admin).
 * Kanban / tablero: `aprobacion-kanban.queries.ts`.
 */

// ——— Fragmentos compartidos ———

const ITEM_COMENTARIO_APROBACION = `
  mensaje
  usuarioId
  usuarioNombre
  fecha
`;

const APROBACION_FULL_FIELDS = `
  id
  entidadTipo
  entidadId
  expedienteId
  estado
  montoSolicitado
  tipoPagoOCId
  solicitanteId
  solicitanteNombre
  revisorId
  revisorNombre
  fechaEnvio
  fechaUltimaRevision
  numeroCiclo
  observaciones {
    ${ITEM_COMENTARIO_APROBACION}
  }
  comentariosAprobacion {
    ${ITEM_COMENTARIO_APROBACION}
  }
  comentariosRechazo {
    ${ITEM_COMENTARIO_APROBACION}
  }
`;

const ARCHIVO_FIELDS = `
  url
  nombreOriginal
  mimeType
  tamanioBytes
  fechaSubida
`;

const DOCUMENTO_SUBIDO_FIELDS = `
  id
  documentoOCId
  solicitudPagoId
  requisitoDocumentoId
  estado
  version
  fechaSubida
  fechaRevision
  comentariosRevision
  archivos {
    ${ARCHIVO_FIELDS}
  }
`;

const PLANTILLA_DOC_FIELDS = `
  id
  codigo
  nombrePlantilla
  plantillaUrl
  formatosPermitidos
  activo
`;

const REQUISITO_FIELDS = `
  id
  checklistId
  tipoRequisito
  plantillaDocumentoId
  formularioId
  obligatorio
  orden
  activo
  plantillaDocumento {
    ${PLANTILLA_DOC_FIELDS}
  }
`;

// ——— Queries ———

/** Solo fila `Aprobacion` por solicitud o documento OC. */
export const APROBACION_POR_ENTIDAD_QUERY = `
  query AprobacionPorEntidad($entidadTipo: EntidadTipoAprobacion!, $entidadId: String!) {
    aprobacionPorEntidad(entidadTipo: $entidadTipo, entidadId: $entidadId) {
      ${APROBACION_FULL_FIELDS}
    }
  }
`;

/** Aprobación + documentos subidos en una petición (portal proveedor). */
export const APROBACION_REVISION_POR_ENTIDAD_QUERY = `
  query AprobacionRevisionPorEntidad($entidadTipo: EntidadTipoAprobacion!, $entidadId: String!) {
    aprobacionRevisionPorEntidad(entidadTipo: $entidadTipo, entidadId: $entidadId) {
      aprobacion {
        ${APROBACION_FULL_FIELDS}
      }
      documentosSubidos {
        ${DOCUMENTO_SUBIDO_FIELDS}
      }
    }
  }
`;

/** Checklist completo + entregas (modal revisión admin). */
export const DETALLE_CHECKLIST_REVISION_APROBACION_QUERY = `
  query DetalleChecklistRevisionAprobacion($aprobacionId: ID!) {
    detalleChecklistRevisionAprobacion(aprobacionId: $aprobacionId) {
      aprobacionId
      estado
      entidadTipo
      entidadId
      expedienteId
      montoSolicitado
      tipoPagoOCId
      checklist {
        id
        codigo
        nombre
        descripcion
        activo
        fechaCreacion
        categoriaChecklistId
        categoria {
          id
          nombre
          tipoUso
        }
        requisitos {
          ${REQUISITO_FIELDS}
        }
      }
      documentosSubidos {
        ${DOCUMENTO_SUBIDO_FIELDS}
      }
    }
  }
`;
