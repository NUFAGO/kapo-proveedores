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

// Hooks de categorías de checklist
export {
  useCategoriasChecklist,
  useCategoriaChecklist,
  useCategoriasChecklistActivas,
  useCategoriasChecklistInactivas,
  useCrearCategoriaChecklist,
  useActualizarCategoriaChecklist,
  useEliminarCategoriaChecklist,
  type CategoriaChecklist,
  type CategoriaChecklistInput,
  type CategoriaChecklistFiltros,
  type CategoriaChecklistConnection
} from './useCategoriaChecklist';

// Hooks de plantillas de checklist
export {
  usePlantillasChecklist,
  usePlantillaChecklist,
  usePlantillasChecklistActivas,
  usePlantillasChecklistInactivas,
  useCrearPlantillaChecklist,
  useActualizarPlantillaChecklist,
  useEliminarPlantillaChecklist,
  useGuardarPlantillaChecklist,
  type PlantillaChecklist,
  type PlantillaChecklistInput,
  type PlantillaChecklistFiltros,
  type PlantillaChecklistConnection,
  type RequisitoDocumento,
  type RequisitoDocumentoInput
} from './usePlantillaChecklist';

// Hooks de plantillas de documento
export {
  usePlantillaDocumento,
  usePlantillaDocumentoPorId,
  type PlantillaDocumento,
  type PlantillaDocumentoFiltros,
  type PlantillaDocumentoConnection,
  type PlantillaDocumentoInput
} from './usePlantillaDocumento';

// Hook de upload de archivos
export {
  useUpload,
  type UploadConfig,
  type FileUploadResult,
  type BatchUploadResult,
  type UploadConfigResponse
} from './useUpload';

// Hooks de órdenes de compra
export {
  useOrdenesCompra,
  type OrdenCompra,
  type OrdenCompraFilter,
  type OrdenCompraPaginatedResponse
} from './useOrdenCompra';

// Hooks de expedientes de pago
export {
  useExpedientesPago,
  useExpedientePago,
  useExpedientePorOcId,
  useExpedientePorCodigo,
  useExpedientesPorProveedor,
  useCrearExpedientePago,
  useConfigurarExpediente,
  useActualizarEstadoExpediente,
  useActualizarSaldosExpediente,
  useEliminarExpedientePago,
  useGuardarExpedienteConItems,
  useExpedienteCompleto,
  type ExpedientePago,
  type ExpedientePagoInput,
  type ExpedientePagoFilter,
  type ExpedientePagoPaginatedResponse,
  type ExpedientePagoCompleto
} from './useExpedientePago';

// Hooks de tipos de pago OC
export {
  useTiposPagoOC,
  useTipoPagoOC,
  useTiposPagoPorExpediente,
  useValidarCreacionSolicitud,
  useCrearTipoPagoOC,
  useActualizarTipoPagoOC,
  useEliminarTipoPagoOC,
  type TipoPagoOC,
  type TipoPagoOCInput,
  type TipoPagoOCFilter,
  type ValidarCreacionSolicitudInput,
  type ValidacionSolicitudResponse
} from './useTipoPagoOC';

// Hooks de documentos OC
export {
  useDocumentosOC,
  useDocumentoOC,
  useDocumentosPorExpediente,
  useVerificarDocumentosObligatoriosAprobados,
  useDocumentosObligatoriosPendientes,
  useCrearDocumentoOC,
  useSubirArchivosDocumento,
  useAprobarDocumentoOC,
  useObservarDocumentoOC,
  useActualizarDocumentoOC,
  useEliminarDocumentoOC,
  type DocumentoOC,
  type DocumentoOCInput,
  type DocumentoOCFilter,
  type ArchivoInput
} from './useDocumentoOC';
