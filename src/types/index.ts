/**
 * 📝 TYPES - DEFINICIONES TYPESCRIPT
 *
 * Responsabilidad: Definir interfaces y tipos TypeScript globales
 * Flujo: Importado por componentes, hooks, servicios → Type safety
 *
 * Contendrá:
 * - Activo: Interface para activos fijos
 * - Categoria: Interface para categorías
 * - Usuario: Interface para usuarios
 * - Proveedor: Interface para proveedores
 * - [Futuro] Más tipos específicos del negocio
 */

// Exportar tipos de proveedores
export * from './proveedor.types';

// Exportar tipos de upload
export * from './upload.types';

// [Futuro] Exportar más tipos aquí
// export interface Activo { ... }
// export interface Categoria { ... }
// export interface Usuario { ... }
