// ============================================================================
// TIPOS DE PROVEEDORES
// ============================================================================

export interface Proveedor {
  id: string;
  razon_social: string;
  direccion: string;
  nombre_comercial: string;
  ruc: string;
  rubro: string;
  estado: string;
  tipo: string;
  actividad: string;
  correo: string;
  telefono: string;
  estado_sunat: string;
  condicion: string;
  agente_retencion: boolean;
  sub_contrata: boolean;
  distrito: string;
  provincia: string;
  departamento: string;
  mediosPago?: MediosPagoProveedor[];
  contactos?: ContactoProveedor[];
  estadisticasCotizaciones?: EstadisticasDetalladas;
}

export interface ProveedorBasico {
  id: string;
  razon_social: string;
  direccion: string;
  nombre_comercial: string;
  ruc: string;
  rubro: string;
  estado: string;
  tipo: string;
  actividad: string;
  correo: string;
  telefono: string;
  estado_sunat: string;
  condicion: string;
  agente_retencion: boolean;
  sub_contrata: boolean;
  distrito: string;
  provincia: string;
  departamento: string;
}

export interface MediosPagoProveedor {
  id: string;
  entidad: Banco;
  nro_cuenta: string;
  detalles: string;
  titular: string;
  validado: boolean;
  mostrar: boolean;
}

export interface Banco {
  id: string;
  nombre: string;
  abreviatura: string;
}

export interface ContactoProveedor {
  id: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  telefono: string;
}

export interface CotizacionPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface EstadisticasDetalladas {
  proveedor_id: string;
  razon_social: string;
  totalCotizaciones: number;
  cotizacionesPorEstado: CotizacionPorEstado[];
  primeraCotizacion: string;
  ultimaCotizacion: string;
}

export interface ProveedorInput {
  razon_social: string;
  ruc: string;
  direccion?: string;
  nombre_comercial?: string;
  rubro?: string;
  estado?: string;
  tipo?: string;
  actividad?: string;
  correo?: string;
  telefono?: string;
  estado_sunat?: string;
  condicion?: string;
  agente_retencion?: boolean;
  sub_contrata?: boolean;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}

export interface ProveedorFiltros {
  estado?: string;
  tipo?: string;
  rubro?: string;
  sub_contrata?: boolean;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  searchTerm?: string;
}

export interface ProveedorPaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filtros?: ProveedorFiltros;
}

export interface ProveedorPaginationResult {
  data: Proveedor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para formularios
export interface ProveedorFormData {
  razon_social: string;
  ruc: string;
  direccion: string;
  nombre_comercial: string;
  rubro: string;
  estado: string;
  tipo: string;
  actividad: string;
  correo: string;
  telefono: string;
  estado_sunat: string;
  condicion: string;
  agente_retencion: boolean;
  sub_contrata: boolean;
  distrito: string;
  provincia: string;
  departamento: string;
}

export interface ProveedorValidationErrors {
  razon_social?: string;
  ruc?: string;
  correo?: string;
  telefono?: string;
  general?: string;
}

// Opciones para selects
export interface ProveedorOption {
  value: string;
  label: string;
  ruc?: string;
  data?: ProveedorBasico;
}

// Estados y tipos comunes
export const PROVEEDOR_ESTADOS = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'SUSPENDIDO', label: 'Suspendido' },
  { value: 'BLOQUEADO', label: 'Bloqueado' }
] as const;

export const PROVEEDOR_TIPOS = [
  { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
  { value: 'PERSONA_JURIDICA', label: 'Persona Jurídica' },
  { value: 'EMPRESA_INDIVIDUAL', label: 'Empresa Individual' }
] as const;

export type ProveedorEstado = typeof PROVEEDOR_ESTADOS[number]['value'];
export type ProveedorTipo = typeof PROVEEDOR_TIPOS[number]['value'];
