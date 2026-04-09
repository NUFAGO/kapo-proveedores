'use client';

import React, { useState } from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Select, type SelectOption } from '@/components/ui/select';
import { useProveedores, type Proveedor, type ProveedorFilter } from '@/hooks';
import ProveedorViewModal from './components/proveedorViewModal';
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Settings,
  Plus,
  Filter,
  Search,
  RotateCcw,
  Users
} from 'lucide-react';

export default function ProveedoresPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ProveedorFilter>({
    page: 1,
    limit: 10
  });
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { proveedores, isLoading, error, refetch } = useProveedores(filters);

  // Opciones para los selects
  const estadoOptions: SelectOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'suspendido', label: 'Suspendido' }
  ];

  const tipoOptions: SelectOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'persona_natural', label: 'Persona Natural' },
    { value: 'persona_juridica', label: 'Persona Jurídica' }
  ];

  const subContrataOptions: SelectOption[] = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Con subcontratación' },
    { value: 'false', label: 'Sin subcontratación' }
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSearch = (searchTerm: string) => {
    setSearchInput(searchTerm);
    setFilters(prev => ({ 
      ...prev, 
      searchTerm: searchTerm || undefined,
      page: 1 
    }));
    setCurrentPage(1);
  };

  const handleEstadoFilter = (estado: string) => {
    setFilters(prev => ({ 
      ...prev, 
      estado: estado || undefined,
      page: 1 
    }));
    setCurrentPage(1);
  };

  const handleTipoFilter = (tipo: string) => {
    setFilters(prev => ({ 
      ...prev, 
      tipo: tipo || undefined,
      page: 1 
    }));
    setCurrentPage(1);
  };

  const handleSubContrataFilter = (subContrata: string) => {
    setFilters(prev => ({ 
      ...prev, 
      sub_contrata: subContrata === 'true' ? true : subContrata === 'false' ? false : undefined,
      page: 1 
    }));
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 10
    });
    setCurrentPage(1);
  };

  // Verificar si hay filtros activos para mostrar el botón de limpiar
  const hasActiveFilters = Boolean(
    filters.searchTerm || 
    filters.estado || 
    filters.tipo ||
    filters.sub_contrata !== undefined
  );

  // Configuración de estados con colores del sistema
  const statusConfig = {
    activo: { label: 'Activo', color: 'bg-green-500' },
    inactivo: { label: 'Inactivo', color: 'bg-gray-500' },
    suspendido: { label: 'Suspendido', color: 'bg-red-500' }
  };

  const columns: Column<Proveedor>[] = [
    {
      key: 'ruc',
      header: 'RUC',
      className: 'text-left w-32 max-w-32',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs bg-blue-100/20 dark:bg-blue-100/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded font-mono font-medium truncate">
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'razon_social',
      header: 'Razón Social',
      className: 'text-left text-xs w-64 max-w-64',
      render: (value: string, row: Proveedor) => (
        <div className="min-w-0 max-w-56">
          <div className="font-medium text-xs leading-none truncate">
            {value}
          </div>
          {row.nombre_comercial && (
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
              {row.nombre_comercial}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      className: 'text-left text-xs w-40 max-w-40',
      render: (value: any, row: Proveedor) => (
        <div className="min-w-0 max-w-full">
          {row.departamento && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {row.departamento}
                {row.provincia && `, ${row.provincia}`}
                {row.distrito && `, ${row.distrito}`}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'rubro',
      header: 'Rubro',
      className: 'text-left text-xs w-32 max-w-32',
      render: (value: string) => (
        <div className="min-w-0 max-w-full">
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {value || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'text-center text-xs w-24 max-w-24'
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center text-sm w-32 max-w-32',
      render: (value: any, row: Proveedor) => (
        <div className="flex items-center gap-1 justify-center">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setSelectedProveedor(row);
              setIsModalOpen(true);
            }}
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Proveedores
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestiona todos los proveedores del sistema
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
              placeholder="Buscar proveedores..."
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

          {/* Filtro por tipo */}
          <div className="w-48">
            <Select
              value={filters.tipo || ''}
              onChange={(value) => handleTipoFilter(value || '')}
              options={tipoOptions}
              placeholder="Todos los tipos"
              className="h-8"
            />
          </div>

          {/* Filtro por subcontratación */}
          <div className="w-48">
            <Select
              value={filters.sub_contrata === true ? 'true' : filters.sub_contrata === false ? 'false' : ''}
              onChange={(value) => handleSubContrataFilter(value || '')}
              options={subContrataOptions}
              placeholder="Subcontratación"
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

      {/* Tabla de proveedores */}
      <DataTable
        data={proveedores?.data || []}
        columns={columns}
        subtitle={`${proveedores?.total || 0} proveedores encontrados`}
        loading={isLoading}
        emptyMessage="No se encontraron proveedores"
        statusConfig={statusConfig}
        serverPagination={
          proveedores ? {
            currentPage: proveedores.page,
            totalPages: proveedores.totalPages,
            totalCount: proveedores.total,
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
              <Building className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar los proveedores
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista de proveedor */}
      <ProveedorViewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProveedor(null);
        }}
        proveedor={selectedProveedor}
      />
    </div>
  );
}