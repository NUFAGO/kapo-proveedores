/**
 * ✏️ GRAPHQL MUTATIONS - OPERACIONES DE ESCRITURA
 *
 * Responsabilidad: Definir mutations GraphQL para modificar datos
 * Flujo: Importado por hooks → Ejecutado por GraphQL client
 */

// Usuario Proveedor mutations
export {
  CREATE_USUARIO_PROVEEDOR_MUTATION,
  UPDATE_USUARIO_PROVEEDOR_MUTATION,
  DELETE_USUARIO_PROVEEDOR_MUTATION,
  CAMBIAR_ESTADO_USUARIO_PROVEEDOR_MUTATION
} from './usuario-proveedor.mutations';

// Tipo Documento mutations
export {
  CREATE_TIPO_DOCUMENTO_MUTATION,
  UPDATE_TIPO_DOCUMENTO_MUTATION,
  DELETE_TIPO_DOCUMENTO_MUTATION
} from './tipo-documento.mutations';

// Tipo Solicitud Pago mutations
export {
  CREATE_TIPO_SOLICITUD_PAGO_MUTATION,
  UPDATE_TIPO_SOLICITUD_PAGO_MUTATION,
  DELETE_TIPO_SOLICITUD_PAGO_MUTATION
} from './tipo-solicitud-pago.mutations';

// Upload mutations
export {
  ELIMINAR_ARCHIVO_MUTATION,
  SUBIR_ARCHIVO_MUTATION,
  SUBIR_MULTIPLES_ARCHIVOS_MUTATION
} from './upload.mutations';
