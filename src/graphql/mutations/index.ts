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

// Categoria Checklist mutations
export {
  CREATE_CATEGORIA_CHECKLIST_MUTATION,
  UPDATE_CATEGORIA_CHECKLIST_MUTATION,
  DELETE_CATEGORIA_CHECKLIST_MUTATION
} from './categoria-checklist.mutations';

// Plantilla Checklist mutations
export {
  CREATE_PLANTILLA_CHECKLIST_MUTATION,
  UPDATE_PLANTILLA_CHECKLIST_MUTATION,
  DELETE_PLANTILLA_CHECKLIST_MUTATION
} from './plantilla-checklist.mutations';

// Upload mutations
export {
  ELIMINAR_ARCHIVO_MUTATION,
  SUBIR_ARCHIVO_MUTATION,
  SUBIR_MULTIPLES_ARCHIVOS_MUTATION
} from './upload.mutations';
