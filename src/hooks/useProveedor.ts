import { useQuery } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { LISTAR_PROVEEDORES_PAGINATED_QUERY } from '@/graphql'

export interface Proveedor {
  id: string
  razon_social: string
  direccion: string | null
  nombre_comercial: string | null
  ruc: string
  rubro: string | null
  estado: string
  tipo: string | null
  actividad: string | null
  correo: string | null
  telefono: string | null
  estado_sunat: string | null
  condicion: string | null
  agente_retencion: boolean
  sub_contrata: boolean
  distrito: string | null
  provincia: string | null
  departamento: string | null
  mediosPago?: Array<{
    id: string
    entidad: {
      id: string
      nombre: string
      abreviatura: string
    }
    nro_cuenta: string
    detalles: string
    titular: string
    validado: boolean
    mostrar: boolean
  }>
  contactos?: Array<{
    id: string
    nombres: string
    apellidos: string
    cargo: string
    telefono: string
  }>
  estadisticasCotizaciones?: {
    proveedor_id: string
    razon_social: string
    totalCotizaciones: number
    cotizacionesPorEstado: Array<{
      estado: string
      cantidad: number
      porcentaje: number
    }>
    primeraCotizacion: string
    ultimaCotizacion: string
  }
}

export interface ProveedorFilter {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  estado?: string
  tipo?: string
  rubro?: string
  sub_contrata?: boolean
  departamento?: string
  provincia?: string
  distrito?: string
  searchTerm?: string
}

export interface ProveedorPaginatedResponse {
  data: Proveedor[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useProveedores(filter: ProveedorFilter = {}) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['proveedores', 
      filter.page, 
      filter.limit, 
      filter.sortBy, 
      filter.sortOrder,
      filter.estado,
      filter.tipo,
      filter.rubro,
      filter.sub_contrata,
      filter.departamento,
      filter.provincia,
      filter.distrito,
      filter.searchTerm
    ],
    queryFn: () => graphqlRequest(LISTAR_PROVEEDORES_PAGINATED_QUERY, { 
      filter: {
        page: filter.page || 1,
        limit: filter.limit || 10,
        sortBy: filter.sortBy || 'razon_social',
        sortOrder: filter.sortOrder || 'asc',
        filter: {
          estado: filter.estado,
          tipo: filter.tipo,
          rubro: filter.rubro,
          sub_contrata: filter.sub_contrata,
          departamento: filter.departamento,
          provincia: filter.provincia,
          distrito: filter.distrito,
          searchTerm: filter.searchTerm
        }
      }
    }),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2
  })

  const proveedores = data?.listProveedoresPaginated as ProveedorPaginatedResponse

  return {
    proveedores,
    isLoading,
    error,
    refetch
  }
}

/** Misma query y filtro que en gestión/proveedores (`searchTerm` en `listProveedoresPaginated`). */
const PROVEEDOR_SELECT_BUSQUEDA_LIMIT = 50

export async function buscarProveedoresParaSelect(searchTerm: string) {
  const data = await graphqlRequest(LISTAR_PROVEEDORES_PAGINATED_QUERY, {
    filter: {
      page: 1,
      limit: PROVEEDOR_SELECT_BUSQUEDA_LIMIT,
      sortBy: 'razon_social',
      sortOrder: 'asc',
      filter: {
        searchTerm: searchTerm.trim() || undefined,
      },
    },
  })
  const paginado = data.listProveedoresPaginated as ProveedorPaginatedResponse
  return (paginado?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.razon_social} · ${p.ruc}`,
  }))
}
