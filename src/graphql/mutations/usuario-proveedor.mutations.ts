/**
 * 🔄 GRAPHQL MUTATIONS - OPERACIONES DE ESCRITURA PARA USUARIOS PROVEEDOR
 *
 * Responsabilidad: Definir mutations GraphQL para crear, actualizar y eliminar usuarios proveedor
 * Flujo: Importado por hooks → Ejecutado por GraphQL client
 */

export const CREATE_USUARIO_PROVEEDOR_MUTATION = `
  mutation CreateUsuarioProveedor($data: UsuarioProveedorInput!) {
    createUsuarioProveedor(data: $data) {
      id
      nombres
      apellido_paterno
      apellido_materno
      dni
      username
      proveedor_id
      proveedor_nombre
      estado
      fecha_creacion
      fecha_actualizacion
    }
  }
`;

export const UPDATE_USUARIO_PROVEEDOR_MUTATION = `
  mutation UpdateUsuarioProveedor($id: ID!, $data: UsuarioProveedorUpdateInput!) {
    updateUsuarioProveedor(id: $id, data: $data) {
      id
      nombres
      apellido_paterno
      apellido_materno
      dni
      username
      proveedor_id
      proveedor_nombre
      estado
      fecha_creacion
      fecha_actualizacion
    }
  }
`;

export const DELETE_USUARIO_PROVEEDOR_MUTATION = `
  mutation DeleteUsuarioProveedor($id: ID!) {
    deleteUsuarioProveedor(id: $id) {
      id
      nombres
      apellido_paterno
      apellido_materno
      dni
      username
      proveedor_id
      proveedor_nombre
      estado
      fecha_creacion
      fecha_actualizacion
    }
  }
`;

export const CAMBIAR_ESTADO_USUARIO_PROVEEDOR_MUTATION = `
  mutation CambiarEstadoUsuarioProveedor($id: ID!, $estado: UsuarioProveedorEstado!) {
    cambiarEstadoUsuarioProveedor(id: $id, estado: $estado) {
      id
      nombres
      apellido_paterno
      apellido_materno
      dni
      username
      proveedor_id
      proveedor_nombre
      estado
      fecha_creacion
      fecha_actualizacion
    }
  }
`;

export const CAMBIAR_CONTRASENA_USUARIO_PROVEEDOR_MUTATION = `
  mutation CambiarContrasenaUsuarioProveedor($id: ID!, $nuevaPassword: String!) {
    cambiarContrasenaUsuarioProveedor(id: $id, nuevaPassword: $nuevaPassword) {
      id
      nombres
      apellido_paterno
      apellido_materno
      dni
      username
      proveedor_id
      proveedor_nombre
      estado
      fecha_creacion
      fecha_actualizacion
    }
  }
`;
