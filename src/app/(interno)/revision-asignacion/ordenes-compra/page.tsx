'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOrdenesCompra, type OrdenCompra, type OrdenCompraFilter } from '@/hooks'
import { 
  FileText, 
  Calendar, 
  Building, 
  DollarSign, 
  Eye, 
  Plus,
  Filter,
  Download,
  Search
} from 'lucide-react'

export default function OrdenesCompraPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<OrdenCompraFilter>({
    page: 1,
    limit: 10
  })

  const { ordenesCompra, isLoading, error, refetch } = useOrdenesCompra(filters)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setFilters(prev => ({ ...prev, page }))
  }

  const handleSearch = (searchTerm: string) => {
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
      estados: estado ? [estado] : undefined,
      page: 1 
    }))
    setCurrentPage(1)
  }

  // Configuración de estados con colores del sistema
  const statusConfig = {
    pendiente: { label: 'Pendiente', color: 'bg-yellow-500' },
    aprobado: { label: 'Aprobado', color: 'bg-green-500' },
    rechazado: { label: 'Rechazado', color: 'bg-red-500' },
    en_revision: { label: 'En Revisión', color: 'bg-blue-500' },
    completado: { label: 'Completado', color: 'bg-emerald-500' },
    cancelado: { label: 'Cancelado', color: 'bg-gray-500' }
  }

  const columns: Column<OrdenCompra>[] = [
    {
      key: 'codigo_orden',
      header: 'Código',
      className: 'text-left w-32',
      render: (value: string, row: OrdenCompra) => (
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
      className: 'text-left text-xs',
      render: (value: string) => (
        <div className="min-w-0 max-w-xs">
          <div className="font-medium text-xs leading-none truncate">
            {value}
          </div>
        </div>
      )
    },
    {
      key: 'proveedor',
      header: 'Proveedor',
      className: 'text-left text-sm w-36',
      render: (value: any, row: OrdenCompra) => (
        <div className="min-w-0 max-w-full">
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {row.proveedor?.nombre_comercial || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'total',
      header: 'Monto',
      className: 'text-right text-xs',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1 w-20">
          <span className="font-semibold text-xs text-green-600">
            S/ {value?.toFixed(2) || '0.00'}
          </span>
        </div>
      )
    },
    {
      key: 'fechas',
      header: 'Fechas',
      className: 'text-center text-sm w-32',
      render: (value: any, row: OrdenCompra) => (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px]">Inicio:</span>
            <span className="text-[10px]">
              {row.fecha_ini ? new Date(row.fecha_ini).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">Fin:</span>
            <span className="text-[10px] ">
              {row.fecha_fin ? new Date(row.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'text-center text-xs w-24'
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center text-sm w-32',
      render: (value: any, row: OrdenCompra) => (
        <div className="flex items-center gap-1 justify-center">
          <Button
                      variant="subtle"
                      color="gray"
                      size="icon"
                      title="Ver detalles"
                    
                    >
                      <Eye className="h-3.5 w-3.5" />
            </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            color='blue'
            onClick={() => {
              router.push(`/revision-asignacion/ordenes-compra/${row.codigo_orden}`)
            }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Expediente
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Órdenes de Compra
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestiona y revisa las órdenes de compra del sistema
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
              placeholder="Buscar órdenes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs h-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Filtro por estado */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleEstadoFilter(e.target.value)}
            defaultValue=""
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="en_revision">En Revisión</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Botones de acción */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 text-xs"
          >
            <Filter className="w-4 h-4" />
            Más Filtros
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 text-xs"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabla de órdenes de compra */}
      <DataTable
        data={ordenesCompra?.data || []}
        columns={columns}
        subtitle={`${ordenesCompra?.total || 0} órdenes encontradas`}
        loading={isLoading}
        emptyMessage="No se encontraron órdenes de compra"
        statusConfig={statusConfig}
        serverPagination={
          ordenesCompra ? {
            currentPage: ordenesCompra.page,
            totalPages: ordenesCompra.totalPages,
            totalCount: ordenesCompra.total,
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
                Error al cargar las órdenes de compra
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