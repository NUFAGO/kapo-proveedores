/** Kanban de aprobaciones (mismo patrón que plantilla reclutamiento: getKanbanData + listar paginado por columna). */

export const KANBAN_APROBACION_PAGE_SIZE = 20;

const APROBACION_KANBAN_CARD_FIELDS = `
  id
  entidadTipo
  entidadId
  expedienteId
  montoSolicitado
  tipoPagoOCId
  estado
  solicitanteNombre
  fechaEnvio
  observaciones {
    mensaje
  }
`;

export const GET_KANBAN_DATA_APROBACIONES_QUERY = `
  query GetKanbanDataAprobaciones($filtros: AprobacionKanbanFiltros) {
    getKanbanDataAprobaciones(filtros: $filtros) {
      EN_REVISION {
        aprobaciones {
          ${APROBACION_KANBAN_CARD_FIELDS}
        }
        total
        hasNextPage
      }
      OBSERVADO {
        aprobaciones {
          ${APROBACION_KANBAN_CARD_FIELDS}
        }
        total
        hasNextPage
      }
      APROBADO {
        aprobaciones {
          ${APROBACION_KANBAN_CARD_FIELDS}
        }
        total
        hasNextPage
      }
      RECHAZADO {
        aprobaciones {
          ${APROBACION_KANBAN_CARD_FIELDS}
        }
        total
        hasNextPage
      }
    }
  }
`;

export const LISTAR_APROBACIONES_KANBAN_QUERY = `
  query ListarAprobacionesKanban(
    $estado: EstadoAprobacion!
    $limit: Int!
    $offset: Int
    $entidadTipo: EntidadTipoAprobacion
  ) {
    aprobaciones(
      filtros: {
        estado: $estado
        limit: $limit
        offset: $offset
        entidadTipo: $entidadTipo
      }
    ) {
      items {
        ${APROBACION_KANBAN_CARD_FIELDS}
      }
      totalCount
    }
  }
`;
