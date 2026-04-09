import { gql } from 'graphql-request';

export const GENERAR_CODIGOS_COMPLETOS_MUTATION = gql`
  mutation GenerarCodigosCompletos(
    $proveedorId: String!
    $proveedorRuc: String!
    $proveedorNombre: String
    $creadoPor: String
    $diasValidez: Int = 30
  ) {
    generarCodigosCompletos(
      proveedorId: $proveedorId
      proveedorRuc: $proveedorRuc
      proveedorNombre: $proveedorNombre
      creadoPor: $creadoPor
      diasValidez: $diasValidez
    ) {
      codigoProveedor
      codigoAcceso
      codigoVerificacion
      codigoBD {
        id
        codigo
        proveedorId
        tipo
        fechaExpiracion
        activo
      }
    }
  }
`;

export const VERIFICAR_CODIGO_ACCESO_QUERY = gql`
  query VerificarCodigoAcceso($codigo: String!) {
    verificarCodigoAcceso(codigo: $codigo) {
      valido
      proveedorId
      proveedor {
        id
        ruc
        razon_social
        nombre_comercial
        estado
        correo
        telefono
      }
      error
      tipo
    }
  }
`;

export const MARCAR_CODIGO_COMO_USADO_MUTATION = gql`
  mutation MarcarCodigoComoUsado($codigo: String!) {
    marcarCodigoComoUsado(codigo: $codigo)
  }
`;

export const LISTAR_CODIGOS_ACCESO_QUERY = gql`
  query ListarCodigosAcceso(
    $filtros: CodigoAccesoFiltros
  ) {
    codigosAcceso(filtros: $filtros) {
      codigos {
        id
        codigo
        proveedorId
        proveedorRuc
        proveedorNombre
        tipo
        fechaGeneracion
        fechaExpiracion
        usado
        fechaUso
        creadoPor
        motivoInvalidacion
        activo
      }
      totalCount
      page
      limit
      totalPages
    }
  }
`;

export const INVALIDAR_CODIGO_MUTATION = gql`
  mutation InvalidarCodigo($codigo: String!, $motivo: String!) {
    invalidarCodigo(codigo: $codigo, motivo: $motivo)
  }
`;
