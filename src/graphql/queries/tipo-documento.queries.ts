/**
 * 🔍 GRAPHQL QUERIES - CONSULTAS DE TIPO DOCUMENTO
 *
 * Responsabilidad: Definir queries GraphQL para obtener datos de tipos de documento
 * Flujo: Importado por hooks → Ejecutado por GraphQL client
 */

export const GET_TIPOS_DOCUMENTO_QUERY = `
  query GetTiposDocumento($limit: Int, $offset: Int, $filters: TipoDocumentoFiltros) {
    listarTiposDocumento(limit: $limit, offset: $offset, filters: $filters) {
      tiposDocumento {
        id
        codigo
        nombre
        descripcion
        estado
        fechaCreacion
        fechaActualizacion
      }
      totalCount
    }
  }
`;

export const GET_TIPO_DOCUMENTO_QUERY = `
  query GetTipoDocumento($id: ID!) {
    obtenerTipoDocumento(id: $id) {
      id
      codigo
      nombre
      descripcion
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_TIPOS_DOCUMENTO_ACTIVOS_QUERY = `
  query GetTiposDocumentoActivos {
    findActivos {
      id
      codigo
      nombre
      descripcion
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_TIPOS_DOCUMENTO_INACTIVOS_QUERY = `
  query GetTiposDocumentoInactivos {
    findInactivos {
      id
      codigo
      nombre
      descripcion
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;
