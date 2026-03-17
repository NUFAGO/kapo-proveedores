'use client';

import React, { useState } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button, DataTable } from '@/components/ui';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useTiposSolicitudPago, type TipoSolicitudPago, type TipoSolicitudPagoFiltros } from '@/hooks/useTipoSolicitudPago';
import TipoSolicitudPagoForm from './components/tipoSolicitudPagoForm';
import TipoSolicitudPagoView from './components/tipoSolicitudPagoView';

export default function TipoSolicitudPagoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<TipoSolicitudPago | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTipoId, setEditingTipoId] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // Construir filtros para la búsqueda
  const filters: TipoSolicitudPagoFiltros | undefined = searchQuery
    ? { nombre: searchQuery }
    : undefined;

  // Usar el hook personalizado con paginación y filtros
  const { data, isLoading, error, refetch } = useTiposSolicitudPago(filters, limit, offset);

  // Extraer datos del resultado
  const tiposSolicitudPago = data?.tiposSolicitudPago || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset page on search
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewTipo = (tipo: TipoSolicitudPago) => {
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleEditFromView = (tipo: TipoSolicitudPago) => {
    handleEditTipo(tipo);
  };

  const handleEditTipo = (tipo: TipoSolicitudPago) => {
    setEditingTipoId(tipo.id);
    setIsFormOpen(true);
  };

  const handleDeleteTipo = (tipo: TipoSolicitudPago) => {
    // Placeholder para funcionalidad de eliminación
    console.log('Eliminar tipo:', tipo);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTipo(null);
  };

  const handleOpenCreateForm = () => {
    setEditingTipoId(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTipoId(undefined);
    // Refrescar datos después de crear/editar
    refetch();
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      className: 'text-left w-20',
      render: (value: string) => (
        <span className="text-xs bg-purple-100/20 dark:bg-purple-200/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded font-mono">
          {value}
        </span>
      )
    },
    {
      key: 'nombre',
      header: 'Nombre',
      className: 'text-left text-sm',
      render: (value: string) => (
        <div className="min-w-0 max-w-full">
          <div className="font-medium text-xs leading-none truncate">
            {value}
          </div>
        </div>
      )
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      className: 'text-left text-xs',
      render: (value?: string) => (
        <div 
          className="line-clamp-2 max-w-xs" 
          title={value || 'Sin descripción'}
        >
          {value || 'Sin descripción'}
        </div>
      )
    },
    {
      key: 'categoria',
      header: 'Categoría',
      className: 'text-left text-xs',
      render: (value: string) => (
        <span className="text-xs bg-orange-100/20 dark:bg-orange-200/10 text-orange-400 dark:text-orange-400 px-2 py-1 rounded capitalize font-medium">
          {value}
        </span>
      )
    },
    {
      key: 'permiteMultiple',
      header: 'Múltiple',
      className: 'text-center',
      render: (value: boolean) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          value 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {value ? 'SÍ' : 'NO'}
        </span>
      )
    },
    {
      key: 'permiteVincularReportes',
      header: 'Reportes',
      className: 'text-center',
      render: (value: boolean) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          value 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {value ? 'SÍ' : 'NO'}
        </span>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'text-center',
      render: (value: 'activo' | 'inactivo') => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          value === 'activo' 
            ? 'bg-green-100/20 dark:bg-green-200/10 text-green-500 dark:text-green-400' 
            : 'bg-red-100/20 dark:bg-red-200/10 text-red-500 dark:text-red-400'
        }`}>
          {value === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'fechaCreacion',
      header: 'Fecha Creación',
      className: 'text-left text-xs',
      render: (value: string) => (
        <span className="text-xs">
          {new Date(value).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'w-32 text-center',
      render: (value: any, row: TipoSolicitudPago) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="subtle"
            color="gray"
            size="icon"
            title="Ver detalles"
            onClick={() => handleViewTipo(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="subtle"
            color="blue"
            size="icon"
            title="Editar"
            onClick={() => handleEditTipo(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="subtle"
            color="red"
            size="icon"
            title="Eliminar"
            onClick={() => handleDeleteTipo(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <div className="text-red-400 text-sm">
          Error al cargar los tipos de solicitud de pago: {error.message}
        </div>
        <Button onClick={() => refetch()} variant="subtle" color="gray">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Tipos de Solicitud de Pago
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestión de todos los tipos de solicitud de pago del sistema
          </p>
        </div>
        <Button
          variant="custom"
          color="purple"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreateForm}
        >
          Nuevo Tipo
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow p-4">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              type="text"
              placeholder="Buscar tipos de solicitud de pago..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 text-xs h-8"
            />
          </div>

          {/* Botón limpiar búsqueda */}
          {searchQuery && (
            <Button
              onClick={clearSearch}
              variant="custom"
              color="violet"
              icon={<X className="h-4 w-4" />}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de Tipos de Solicitud de Pago */}
      <DataTable
        data={tiposSolicitudPago}
        columns={columns}
        subtitle={`Total: ${totalCount} tipos de solicitud de pago`}
        showPagination={true}
        serverPagination={{
          currentPage,
          totalPages,
          totalCount,
          onPageChange: handlePageChange
        }}
        loading={isLoading}
        emptyMessage="Los tipos de solicitud de pago aparecerán aquí cuando se registren"
      />

      {/* Modal para ver detalles */}
      <TipoSolicitudPagoView
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tipo={selectedTipo}
        onEdit={handleEditFromView}
      />

      {/* Formulario para crear/editar tipos de solicitud de pago */}
      <TipoSolicitudPagoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        tipoSolicitudPagoId={editingTipoId}
      />
    </div>
  );
}