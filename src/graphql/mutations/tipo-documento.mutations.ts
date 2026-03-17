/**
 * ✏️ GRAPHQL MUTATIONS - OPERACIONES DE TIPO DOCUMENTO
 *
 * Responsabilidad: Definir mutations GraphQL para operaciones de escritura
 * Flujo: Importado por hooks → Ejecutado por GraphQL client
 */

export const CREATE_TIPO_DOCUMENTO_MUTATION = `
  mutation CreateTipoDocumento($input: TipoDocumentoInput!) {
    crearTipoDocumento(input: $input) {
      id
      nombre
      descripcion
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const UPDATE_TIPO_DOCUMENTO_MUTATION = `
  mutation UpdateTipoDocumento($id: ID!, $input: TipoDocumentoInput!) {
    actualizarTipoDocumento(id: $id, input: $input) {
      id
      nombre
      descripcion
      estado
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const DELETE_TIPO_DOCUMENTO_MUTATION = `
  mutation DeleteTipoDocumento($id: ID!) {
    eliminarTipoDocumento(id: $id)
  }
`;
