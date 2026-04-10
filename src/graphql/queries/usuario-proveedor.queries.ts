/**
 * 🔍 GRAPHQL QUERIES - CONSULTAS DE USUARIOS PROVEEDOR
 *
 * Responsabilidad: Definir queries GraphQL para obtener datos de usuarios proveedor
 * Flujo: Importado por hooks → Ejecutado por GraphQL client
 */

export const GET_USUARIOS_PROVEEDOR_PAGINADO_QUERY = `
  query UsuariosProveedorPaginado($filter: UsuarioProveedorListFilter) {
    usuariosProveedorPaginado(filter: $filter) {
      data {
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
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_USUARIOS_PROVEEDOR_QUERY = `
  query GetUsuariosProveedor {
    usuariosProveedor {
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

export const GET_USUARIO_PROVEEDOR_QUERY = `
  query GetUsuarioProveedor($id: ID!) {
    usuarioProveedor(id: $id) {
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

export const GET_USUARIO_PROVEEDOR_BY_DNI_QUERY = `
  query GetUsuarioProveedorByDni($dni: String!) {
    usuarioProveedorByDni(dni: $dni) {
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

export const GET_USUARIO_PROVEEDOR_BY_USERNAME_QUERY = `
  query GetUsuarioProveedorByUsername($username: String!) {
    usuarioProveedorByUsername(username: $username) {
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

export const GET_USUARIOS_PROVEEDOR_BY_PROVEEDOR_ID_QUERY = `
  query GetUsuariosProveedorByProveedorId($proveedor_id: String!) {
    usuariosProveedorByProveedorId(proveedor_id: $proveedor_id) {
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
