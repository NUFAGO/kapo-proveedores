'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Select, type SelectOption } from '@/components/ui/select'
import { useExpedientesPorProveedor, type ExpedientePago, type ExpedientePagoFilter } from '@/hooks'
import { useAuthProveedor } from '@/context/auth-proveedor-context'
import { FileText, Eye, Search, RotateCcw } from 'lucide-react'

export default function OrdenesProveedorPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthProveedor()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<ExpedientePagoFilter>({
    page: 1,
    limit: 10
  })

  // Solo cargar datos cuando el usuario está autenticado
  const { data: expedientes, isLoading, error, refetch } = useExpedientesPorProveedor(
    user?.proveedor_id || '',
    filters
  )

  // Actualizar filtros cuando el usuario está disponible
  useEffect(() => {
    if (user?.proveedor_id && !authLoading) {
      setFilters(prev => ({
        ...prev,
        proveedorId: user.proveedor_id,
        page: 1
      }))
    }
  }, [user?.proveedor_id, authLoading])

  // Opciones para los selects
  const estadoOptions: SelectOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'configurado', label: 'Configurado' },
    { value: 'activo', label: 'Activo' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'en_ejecucion', label: 'En ejecución' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' }
  ]

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setFilters(prev => ({ ...prev, page }))
  }

  const handleSearch = (searchTerm: string) => {
    setSearchInput(searchTerm)
    setFilters(prev => ({ 
      ...prev, 
      searchTerm: searchTerm || undefined,
      page: 1 
    }))
    setCurrentPage(1)
  }

  const handleEstadoFilter = (estado: string) => {
    setFilters(prev => ({ 
      ...prev, 
      estado: estado || undefined,
      page: 1 
    }))
    setCurrentPage(1)
  }

  const handleClear = () => {
    setSearchInput('')
    setFilters({
      page: 1,
      limit: 10,
      proveedorId: user?.proveedor_id
    })
    setCurrentPage(1)
  }

  // Verificar si hay filtros activos para mostrar el botón de limpiar
  const hasActiveFilters = Boolean(
    filters.searchTerm || 
    filters.estado
  )

  const statusConfig = {
    configurado: { label: 'Configurado', color: 'bg-blue-500' },
    activo: { label: 'Activo', color: 'bg-green-500' },
    en_proceso: { label: 'En Proceso', color: 'bg-yellow-500' },
    en_ejecucion: { label: 'Ejecución', color: 'bg-sky-500' },
    completado: { label: 'Completado', color: 'bg-emerald-500' },
    cancelado: { label: 'Cancelado', color: 'bg-red-500' }
  }

  const columns: Column<ExpedientePago>[] = [
    {
      key: 'ocCodigo',
      header: 'Código',
      className: 'text-left w-40 max-w-44 min-w-36',
      render: (value: string, row: ExpedientePago) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs bg-blue-100/20 dark:bg-blue-100/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded font-mono font-medium">
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      className: 'text-left text-xs w-56 max-w-64 min-w-48',
      render: (value: string) => (
        <div className="min-w-0">
          <div className="font-medium text-xs leading-none">
            {value}
          </div>
        </div>
      )
    },
    {
      key: 'montoContrato',
      header: 'Monto Contrato',
      className: 'text-right text-xs w-32 max-w-36 min-w-28',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <span className="font-semibold text-xs text-green-600">
            S/ {value?.toFixed(2) || '0.00'}
          </span>
        </div>
      )
    },
    {
      key: 'montoDisponible',
      header: 'Disponible',
      className: 'text-right text-xs w-28 max-w-32 min-w-24',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <span className="font-medium text-xs text-blue-600">
            S/ {value?.toFixed(2) || '0.00'}
          </span>
        </div>
      )
    },
    {
      key: 'montoComprometido',
      header: 'Comprometido',
      className: 'text-right text-xs w-28 max-w-32 min-w-24',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <span className="font-medium text-xs text-orange-600">
            S/ {value?.toFixed(2) || '0.00'}
          </span>
        </div>
      )
    },
    {
      key: 'fechas',
      header: 'Fechas',
      className: 'text-center text-sm w-32 max-w-36 min-w-28',
      render: (value: any, row: ExpedientePago) => (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px]">Inicio:</span>
            <span className="text-[10px]">
              {row.fechaInicioContrato ? new Date(row.fechaInicioContrato).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">Fin:</span>
            <span className="text-[10px]">
              {row.fechaFinContrato ? new Date(row.fechaFinContrato).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'text-center text-xs w-24 max-w-28 min-w-20'
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center text-sm w-32 max-w-36 min-w-28',
      render: (value: any, row: ExpedientePago) => (
        <div className="flex items-center gap-1 justify-center">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => {
              router.push(`/proveedor/ordenes/${row.ocCodigo}`)
            }}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver Detalle
          </Button>
        </div>
      )
    }
  ]

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Redirigir si no hay usuario autenticado
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Mis Expedientes
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestiona tus expedientes de pago
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow p-4">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar expedientes..."
              value={searchInput}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs h-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Filtro por estado */}
          <div className="w-48">
            <Select
              value={filters.estado || ''}
              onChange={(value) => handleEstadoFilter(value || '')}
              options={estadoOptions}
              placeholder="Todos los estados"
              className="h-8"
            />
          </div>

          {/* Botón de limpiar filtros - solo mostrar si hay filtros activos */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8 text-xs"
              onClick={handleClear}
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de expedientes */}
      <DataTable
        data={expedientes?.data || []}
        columns={columns}
        subtitle={`${expedientes?.total || 0} expedientes encontrados`}
        loading={isLoading}
        emptyMessage="No se encontraron expedientes"
        statusConfig={statusConfig}
        serverPagination={
          expedientes ? {
            currentPage: expedientes.page,
            totalPages: expedientes.totalPages,
            totalCount: expedientes.total,
            onPageChange: handlePageChange
          } : undefined
        }
        rowsPerPage={10}
        showPagination={true}
        className="shadow-lg"
      />

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar los expedientes
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}