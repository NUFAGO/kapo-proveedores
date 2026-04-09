import { useQuery } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { LISTAR_ORDENES_COMPRA_QUERY } from '@/graphql'

export interface OrdenCompra {
  id: string
  codigo_orden: string
  estado: string
  descripcion: string
  fecha_ini: string
  fecha_fin: string
  tipo: string
  total: number
  obra_id: string | null
  req_usuario_id: string | null
  codigo_rq: string | null
  proveedor_id: string | null
  divisa_id: string | null
  estado_almacen: string | null
  estado_comprobante: string | null
  cantidad_cierre: number | null
  tiene_expediente?: boolean
  proveedor?: {
    id: string
    nombre_comercial: string
    ruc: string
    razon_social: string
    telefono: string
    correo: string
    direccion: string
    rubro: string
    estado: string
    tipo: string
    actividad: string
    estado_sunat: string
    condicion: string
    agente_retencion: boolean
    sub_contrata: boolean
    distrito: string
    provincia: string
    departamento: string
  }
  obra?: {
    id: string
    titulo: string
    nombre: string
    descripcion: string
    direccion: string
    estado: string
  }
  cotizacion_id?: {
    id: string
    codigo_cotizacion: string
    aprobacion: boolean
    estado: string
    fecha: string
    usuario_id: {
      id: string
      nombres: string
      apellidos: string
      dni: string
    }
  }
  pagos?: Array<{
    monto_solicitado: number
    estado: string
  }>
  comprobantes?: Array<{
    _id: string
    serie: string
    numeracion: string
    monto: number
    estado: string
    comentario_aprobacion: string | null
    archivo_url: string | null
  }>
}

export interface OrdenCompraFilter {
  page?: number
  limit?: number
  fechaInicio?: string
  fechaFin?: string
  usuarioRQ?: string[]
  usuarioOC?: string[]
  estados?: string[]
  empresas?: string[]
  obras?: string[]
  tipos?: string[]
  estado_almacen?: string[]
  estado_comprobante?: string[]
  searchTerm?: string
  busquedaOrdenProveedor?: string
  descripcion?: string
  codigoCOT?: string
  proveedores?: string[]
  proveedorBusqueda?: string
  codigoRQ?: string
  total?: number
  estadoPago?: string
  comprobante?: string
  tieneExpediente?: boolean
}

export interface OrdenCompraPaginatedResponse {
  data: OrdenCompra[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useOrdenesCompra(filter: OrdenCompraFilter = {}) {
  // Siempre filtrar por tipo "servicio"
  const defaultFilter = {
    tipos: ["servicio"],
    ...filter
  }

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ordenes-compra', defaultFilter],
    queryFn: () => graphqlRequest(LISTAR_ORDENES_COMPRA_QUERY, { filter: defaultFilter }),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2
  })

  const ordenesCompra = data?.listOrdenComprasPaginated as OrdenCompraPaginatedResponse

  return {
    ordenesCompra,
    isLoading,
    error,
    refetch
  }
}
