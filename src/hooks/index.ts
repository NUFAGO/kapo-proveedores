/**
 * 🎣 HOOKS - LÓGICA DE DATOS Y ESTADO
 *
 * Responsabilidad: Centralizar custom hooks para manejo de datos
 * Flujo: Importado por componentes → Conecta con GraphQL/Backend
 *
 * Contiene:
 * - useAuth: Autenticación y usuario (viene de context)
 * - useUsuarioProveedor: Gestión de usuarios proveedor
 * - useTipoDocumento: Gestión de tipos de documento
 */

// Hooks de autenticación (viene del context)
export { useAuth } from '@/context/auth-context';
export { useAuthProveedor } from '@/context/auth-proveedor-context';

// Hooks de usuarios proveedor
export {
  useUsuariosProveedor,
  useUsuarioProveedor,
  useUsuarioProveedorByDni,
  useUsuariosProveedorByProveedorId,
  useCreateUsuarioProveedor,
  useUpdateUsuarioProveedor,
  useDeleteUsuarioProveedor,
  useCambiarEstadoUsuarioProveedor,
  type UsuarioProveedor,
  type UsuarioProveedorInput,
  type UsuarioProveedorUpdateInput
} from './useUsuarioProveedor';

// Hooks de tipos de documento
export {
  useTiposDocumento,
  useTipoDocumento,
  useTiposDocumentoActivos,
  useTiposDocumentoInactivos,
  useCrearTipoDocumento,
  useActualizarTipoDocumento,
  useEliminarTipoDocumento,
  type TipoDocumento,
  type TipoDocumentoInput,
  type TipoDocumentoFiltros,
  type TipoDocumentoConnection
} from './useTipoDocumento';

// Hook de upload de archivos
export {
  useUpload,
  type UploadConfig,
  type FileUploadResult,
  type BatchUploadResult,
  type UploadConfigResponse
} from './useUpload';
