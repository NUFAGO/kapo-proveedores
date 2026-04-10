'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { DataTable, type Column, Select, SelectSearch, type SelectOption } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useUsuariosProveedorPaginado,
  useProveedores,
  buscarProveedoresParaSelect,
  type UsuarioProveedor,
} from '@/hooks'
import UsuarioProveedorDetalleModal from './components/usuarioProveedorDetalleModal'
import { Users, Mail, Search, Eye } from 'lucide-react'

const LIMIT = 10

const MONGO_OBJECT_ID = /^[0-9a-fA-F]{24}$/

const ESTADO_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
  { value: 'INACTIVO', label: 'Inactivo' },
]

function badgeVariantEstado(estado: string) {
  const u = estado.toUpperCase()
  if (u === 'ACTIVO') return 'default' as const
  if (u === 'PENDIENTE') return 'secondary' as const
  if (u === 'BLOQUEADO') return 'destructive' as const
  return 'outline' as const
}

export default function GestionUsuariosPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [proveedorFilter, setProveedorFilter] = useState('')
  const [usuarioDetalleId, setUsuarioDetalleId] = useState<string | null>(null)

  const { proveedores, isLoading: loadingProv } = useProveedores({
    page: 1,
    limit: 50,
    sortBy: 'razon_social',
    sortOrder: 'asc',
  })

  const proveedorOptions = useMemo(() => {
    const rows = proveedores?.data ?? []
    return rows.map((p) => ({
      value: p.id,
      label: `${p.razon_social} · ${p.ruc}`,
    }))
  }, [proveedores?.data])

  const handleBuscarProveedoresSelect = useCallback(async (term: string) => {
    return buscarProveedoresParaSelect(term)
  }, [])

  const handleProveedorFilterChange = useCallback((v: string | null) => {
    const s = v ?? ''
    if (s === '') {
      setProveedorFilter('')
      setCurrentPage(1)
      return
    }
    if (MONGO_OBJECT_ID.test(s)) {
      setProveedorFilter(s)
      setCurrentPage(1)
    }
  }, [])

  const { data: listado, isLoading, error, refetch } = useUsuariosProveedorPaginado({
    page: currentPage,
    limit: LIMIT,
    searchTerm: searchInput.trim() || undefined,
    ...(estadoFilter
      ? { estado: estadoFilter as UsuarioProveedor['estado'] }
      : {}),
    proveedor_id: proveedorFilter.trim() || undefined,
  })

  const rows = listado?.data ?? []
  const total = listado?.total ?? 0
  const totalPages = listado?.totalPages ?? 0

  const columns: Column<UsuarioProveedor>[] = [
    {
      key: 'dni',
      header: 'DNI',
      className: 'text-left text-xs w-28 font-mono',
    },
    {
      key: 'username',
      header: 'Usuario',
      className: 'text-left text-xs min-w-[6rem]',
      render: (value: string) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <Mail className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
          <span className="truncate">{value || '—'}</span>
        </div>
      ),
    },
    {
      key: 'nombres',
      header: 'Nombre completo',
      className: 'text-left text-xs min-w-[10rem]',
      render: (_: unknown, row: UsuarioProveedor) => (
        <span className="font-medium text-text-primary">
          {[row.nombres, row.apellido_paterno, row.apellido_materno].filter(Boolean).join(' ')}
        </span>
      ),
    },
    {
      key: 'proveedor_nombre',
      header: 'Proveedor',
      className: 'text-left text-xs min-w-[10rem] max-w-xs',
      render: (value: string) => (
        <span className="line-clamp-2 text-text-secondary">{value?.trim() || '—'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'text-center text-xs w-28',
      render: (value: string) => (
        <Badge variant={badgeVariantEstado(value)} className="text-[10px]">
          {value}
        </Badge>
      ),
    },
    {
      key: 'fecha_creacion',
      header: 'Alta',
      className: 'text-left text-xs w-28 whitespace-nowrap',
      render: (value: string) =>
        value
          ? new Date(value).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '—',
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center text-xs w-20',
      render: (_: unknown, row: UsuarioProveedor) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-text-secondary hover:text-text-primary"
          aria-label="Ver detalle y contraseña"
          title="Ver detalle"
          onClick={() => setUsuarioDetalleId(row.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const resetFiltros = () => {
    setSearchInput('')
    setEstadoFilter('')
    setProveedorFilter('')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    Boolean(searchInput.trim()) || Boolean(estadoFilter.trim()) || Boolean(proveedorFilter.trim())

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-primary shrink-0" />
            Usuarios
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Cuentas del portal proveedor
          </p>
        </div>
      </div>

      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, usuario o proveedor…"
              value={searchInput}
              className="pl-10 pr-4 py-2 border border-border-color rounded-lg text-xs h-9 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full bg-background"
              onChange={(e) => {
                setSearchInput(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="w-full lg:w-44 shrink-0">
            <Select
              value={estadoFilter}
              onChange={(v) => {
                setEstadoFilter(typeof v === 'string' ? v : '')
                setCurrentPage(1)
              }}
              options={ESTADO_OPTIONS}
              placeholder="Estado"
              className="h-9"
            />
          </div>
          <div className="w-full lg:min-w-[14rem] lg:max-w-md shrink-0">
            <SelectSearch
              value={proveedorFilter || null}
              onChange={handleProveedorFilterChange}
              options={proveedorOptions}
              placeholder="Todos los proveedores"
              searchPlaceholder="Buscar por razón social o RUC…"
              className="w-full h-9 text-xs pl-3 pr-8 border-border-color rounded-lg"
              disabled={loadingProv}
              isLoading={loadingProv}
              showSearchIcon
              onSearch={handleBuscarProveedoresSelect}
              minCharsForSearch={2}
              collapsedAsSelect
            />
          </div>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" size="sm" className="h-9 text-xs shrink-0" onClick={resetFiltros}>
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        subtitle={`${total} usuario${total !== 1 ? 's' : ''}`}
        loading={isLoading}
        emptyMessage="No hay usuarios con los filtros actuales"
        serverPagination={{
          currentPage,
          totalPages,
          totalCount: total,
          onPageChange: setCurrentPage,
        }}
        rowsPerPage={LIMIT}
        showPagination
        className="shadow-lg"
      />

      {error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">Error al cargar usuarios</p>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      ) : null}

      <UsuarioProveedorDetalleModal
        isOpen={!!usuarioDetalleId}
        usuarioId={usuarioDetalleId}
        onClose={() => setUsuarioDetalleId(null)}
      />
    </div>
  )
}
