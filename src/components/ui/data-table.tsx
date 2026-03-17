import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

export interface Column<T = any> {
  key: string
  header: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

export interface StatusConfig {
  [key: string]: {
    label: string
    color: string
  }
}

export interface DataTableProps<T = any> {
  data: T[]
  columns: Column<T>[]
  title?: string
  subtitle?: string
  rowsPerPage?: number
  showPagination?: boolean
  fixedRows?: number // Número de filas para calcular altura mínima (sin rellenar con vacías)
  serverPagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    onPageChange: (page: number) => void
  }
  statusConfig?: StatusConfig
  className?: string
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<T = any>({
  data,
  columns,
  title,
  subtitle,
  rowsPerPage = 10,
  showPagination = true,
  fixedRows,
  serverPagination,
  statusConfig = {
    active: { label: 'Activo', color: 'bg-green-500' },
    pending: { label: 'Pendiente', color: 'bg-yellow-500' },
    inactive: { label: 'Inactivo', color: 'bg-gray-500' }
  },
  className = '',
  emptyMessage = 'No hay datos disponibles',
  loading = false
}: DataTableProps<T>) {
  const [currentPageState, setCurrentPage] = useState(1)
  const [jumpToPage, setJumpToPage] = useState('')

  const displayRows = fixedRows || rowsPerPage
  const currentPage = serverPagination ? serverPagination.currentPage : currentPageState
  const totalPages = serverPagination ? serverPagination.totalPages : Math.ceil(data.length / displayRows)

  const paginatedData = useMemo(() => {
    if (serverPagination) {
      // For server-side pagination, data is already paginated
      return data
    }

    if (!showPagination) {
      return data
    }

    // For client-side pagination
    const displayRows = fixedRows || rowsPerPage
    const start = (currentPage - 1) * displayRows
    const end = start + displayRows
    return data.slice(start, end)
  }, [data, currentPage, rowsPerPage, fixedRows, showPagination, serverPagination])

  const paginationInfo = useMemo(() => {
    if (!showPagination) return ''

    const total = serverPagination ? serverPagination.totalCount : data.length

    if (total === 0) {
      return 'Sin registros'
    }

    if (total === 1) {
      return 'Mostrando 1 de 1'
    }

    const start = (currentPage - 1) * displayRows + 1
    const end = Math.min(currentPage * displayRows, serverPagination ? serverPagination.totalCount : data.length)
    return `Mostrando ${start}-${end} de ${total}`
  }, [currentPage, displayRows, data.length, showPagination, serverPagination])

  const pageNumbers = useMemo(() => {
    if (!showPagination || totalPages <= 1) return []

    const pages: (number | string)[] = []
    const delta = 1 // Number of pages to show around current

    if (totalPages <= 10) {
      // Show all pages if 10 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      const start = Math.max(2, currentPage - delta)
      const end = Math.min(totalPages - 1, currentPage + delta)

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page if not already included
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }, [currentPage, totalPages, showPagination])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      if (serverPagination) {
        serverPagination.onPageChange(page);
      } else {
        setCurrentPage(page);
      }
      setJumpToPage('')
    }
  }

  const handleJumpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage()
    }
  }

  const renderCell = (row: T, column: Column<T>) => {
    const value = (row as any)[column.key]

    if (column.render) {
      return column.render(value, row)
    }

    // Render especial para estados
    if (column.key === 'estado' && statusConfig[value]) {
      const status = statusConfig[value]
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
          {status.label}
        </span>
      )
    }

    // Render especial para métricas/porcentajes
    if (typeof value === 'number' && column.key === 'progreso') {
      return <span className="font-mono text-sm text-text-primary">{value}%</span>
    }

    return value
  }

  if (data.length === 0 && !loading) {
    return (
      <div className={`bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden ${className}`}>
        {/* Header */}
        {(title || subtitle) && (
          <div className="px-10 py-8 border-b border-border-color">
            {title && (
              <h1 className="text-lg font-medium text-text-primary mb-1 tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        <div className="px-10 py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-4 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-2">
            {emptyMessage}
          </h3>
          <p className="text-xs text-text-secondary">
            Los datos aparecerán aquí cuando se agreguen
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="px-10 py-4 border-b border-border-color">
          {title && (
            <h1 className="text-lg font-medium text-text-primary mb-1 tracking-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-background">
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-10 py-2.5 text-center text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border-color ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ minHeight: fixedRows ? `${fixedRows * 40}px` : '300px' }}>
            {loading ? (
              // Skeleton rows
              Array.from({ length: displayRows }, (_, rowIndex) => (
                <tr
                  key={`skeleton-${rowIndex}`}
                  className="border-b border-border-color last:border-b-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-10 py-2.5 text-center ${column.className || ''}`}
                    >
                      <div className="h-4 bg-[var(--skeleton-bg)] animate-pulse rounded"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-border-color hover:bg-accent transition-colors duration-150 last:border-b-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-10 py-2.5 text-center text-sm text-text-primary ${column.key === 'proyecto' ? 'font-medium' : ''} ${column.className || ''}`}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-10 py-2 border-t border-border-color">
          <div className="text-xs text-text-secondary">
            {paginationInfo}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                className="bg-transparent border border-border-color text-text-primary p-1 flex items-center justify-center cursor-pointer transition-all duration-150 rounded-sm hover:bg-[var(--hover-bg)] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  const newPage = currentPage - 1;
                  if (serverPagination) {
                    serverPagination.onPageChange(newPage);
                  } else {
                    goToPage(newPage);
                  }
                }}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex ">
                {pageNumbers.map((page, index) => (
                  <button
                    key={index}
                    className={`bg-transparent border-transparent text-text-secondary p-2 pr-3 text-xs font-medium cursor-pointer transition-all duration-150 rounded-sm min-w-9 hover:bg-[var(--hover-bg)] hover:text-text-primary ${page === currentPage ? 'bg-accent text-white border-accent' : ''}`}
                    onClick={() => {
                      const pageNum = page as number;
                      if (serverPagination) {
                        serverPagination.onPageChange(pageNum);
                      } else {
                        goToPage(pageNum);
                      }
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="bg-transparent border border-border-color text-text-primary p-1 flex items-center justify-center cursor-pointer transition-all duration-150 rounded-sm hover:bg-[var(--hover-bg)] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  const newPage = currentPage + 1;
                  if (serverPagination) {
                    serverPagination.onPageChange(newPage);
                  } else {
                    goToPage(newPage);
                  }
                }}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border-color">
                <label htmlFor="pageJump" className="text-xs text-text-secondary whitespace-nowrap">
                  Ir a:
                </label>
                <input
                  id="pageJump"
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyPress={handleJumpKeyPress}
                  onBlur={handleJumpToPage}
                  placeholder={currentPage.toString()}
                  className="w-15 p-1 border border-border-color rounded-sm text-xs text-center transition-all duration-150 focus:outline-none focus:border-accent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DataTable