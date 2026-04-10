'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { DataTable, type Column, Button, Select, SelectSearch, type SelectOption } from '@/components/ui'
import { Button as ButtonOutline } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useProveedores,
  useReportesSolicitudPagoAdmin,
  buscarProveedoresParaSelect,
  type ReporteSolicitudPagoRow,
} from '@/hooks'
import { Eye, Search, RotateCcw, User, Link2, Link2Off, ClipboardList } from 'lucide-react'
import ReporteSolicitudPagoForm from '@/app/(portal)/proveedor/reportes/components/reporteSolicitudPagoForm'

const LIMIT = 10

const MONGO_OBJECT_ID = /^[0-9a-fA-F]{24}$/

const VINCULADO_FILTRO_OPTIONS: SelectOption[] = [
  { value: 'todos', label: 'Todos (vinculación)' },
  { value: 'no', label: 'Sin vincular' },
  { value: 'si', label: 'Vinculados' },
]

function estaReporteVinculado(row: ReporteSolicitudPagoRow): boolean {
  return Boolean(row.solicitudPagoId?.trim() || row.solicitudPago?.id)
}

export default function GestionReportesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [vinculadoSelect, setVinculadoSelect] = useState<'todos' | 'si' | 'no'>('todos')
  const [proveedorFilter, setProveedorFilter] = useState('')
  const [viewReporteId, setViewReporteId] = useState<string | null>(null)

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

  const filter = useMemo(
    () => ({
      page: currentPage,
      limit: LIMIT,
      searchTerm: searchInput.trim() || undefined,
      vinculado: vinculadoSelect === 'todos' ? undefined : vinculadoSelect === 'si',
      proveedorId: proveedorFilter.trim() || undefined,
    }),
    [currentPage, searchInput, vinculadoSelect, proveedorFilter]
  )

  const { data: listado, isLoading, error, refetch } = useReportesSolicitudPagoAdmin(filter)

  const handleClear = () => {
    setSearchInput('')
    setVinculadoSelect('todos')
    setProveedorFilter('')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    Boolean(searchInput.trim()) || vinculadoSelect !== 'todos' || Boolean(proveedorFilter.trim())

  const columns: Column<ReporteSolicitudPagoRow>[] = [
    {
      key: 'codigo',
      header: 'Código',
      className: 'text-left text-xs w-24 font-mono',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => (
        <span className="font-semibold text-text-primary tabular-nums">{row.codigo?.trim() || '—'}</span>
      ),
    },
    {
      key: 'identificadorSolicitudPago',
      header: 'Referencia',
      className: 'text-left text-xs min-w-[7rem]',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => (
        <span className="font-medium text-text-primary">{row.identificadorSolicitudPago?.trim() || '—'}</span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      className: 'text-left text-xs w-24 whitespace-nowrap',
      render: (_: unknown, row: ReporteSolicitudPagoRow) =>
        row.fecha
          ? new Date(row.fecha).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '—',
    },
    {
      key: 'maestroResponsable',
      header: 'Maestro / responsable',
      className: 'text-left text-xs min-w-[8rem]',
      render: (value: string) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
          <span className="truncate">{value || '—'}</span>
        </div>
      ),
    },
    {
      key: 'vinculado',
      header: 'Vinculado',
      className: 'text-left text-xs w-28',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => {
        const v = estaReporteVinculado(row)
        return (
          <div className="flex items-center gap-1.5">
            {v ? (
              <>
                <Link2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-800 dark:text-emerald-300"
                >
                  Sí
                </Badge>
              </>
            ) : (
              <>
                <Link2Off className="w-3.5 h-3.5 shrink-0 text-text-secondary" aria-hidden />
                <Badge variant="outline" className="text-[10px] text-text-secondary">
                  No
                </Badge>
              </>
            )}
          </div>
        )
      },
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center min-w-[5.5rem]',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => (
        <ButtonOutline
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => setViewReporteId(row.id)}
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver
        </ButtonOutline>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary shrink-0" />
            Reportes
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Todos los reportes operativos
          </p>
        </div>
      </div>

      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow p-4 space-y-3">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-end">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por código, referencia, maestro, observaciones o ID proveedor…"
              value={searchInput}
              className="pl-10 pr-4 py-2 border border-border-color rounded-lg text-xs h-9 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full bg-background"
              onChange={(e) => {
                setSearchInput(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="w-full xl:min-w-[14rem] xl:max-w-md shrink-0">
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
          <div className="w-full sm:w-48 shrink-0">
            <Select
              value={vinculadoSelect}
              onChange={(v) => {
                const key: 'todos' | 'si' | 'no' = v === 'si' || v === 'no' ? v : 'todos'
                setVinculadoSelect(key)
                setCurrentPage(1)
              }}
              options={VINCULADO_FILTRO_OPTIONS}
              placeholder="Vinculación"
              className="h-9"
            />
          </div>
          {hasActiveFilters ? (
            <ButtonOutline type="button" variant="outline" size="sm" className="h-9 text-xs shrink-0" onClick={handleClear}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Limpiar
            </ButtonOutline>
          ) : null}
        </div>
      </div>

      <DataTable
        data={listado?.data ?? []}
        columns={columns}
        subtitle={`${listado?.total ?? 0} reportes`}
        loading={isLoading}
        emptyMessage="No hay reportes con los filtros actuales"
        serverPagination={
          listado && listado.totalPages > 0
            ? {
                currentPage: listado.page,
                totalPages: listado.totalPages,
                totalCount: listado.total,
                onPageChange: setCurrentPage,
              }
            : undefined
        }
        rowsPerPage={LIMIT}
        showPagination
        className="shadow-lg"
      />

      {error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">Error al cargar reportes</p>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3 h-8" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      <ReporteSolicitudPagoForm
        isOpen={Boolean(viewReporteId)}
        mode="view"
        reporteId={viewReporteId}
        onClose={() => setViewReporteId(null)}
      />
    </div>
  )
}
