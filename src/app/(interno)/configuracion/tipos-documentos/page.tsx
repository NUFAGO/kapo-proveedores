'use client';

import React, { useState } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button, DataTable } from '@/components/ui';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useTiposDocumento, type TipoDocumento, type TipoDocumentoFiltros } from '@/hooks/useTipoDocumento';
import TipoDocumentoForm from './components/tipoDocumentoForm';
import TipoDocumentoView from './components/tipoDocumentoView';

export default function TipoDocumentoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<TipoDocumento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTipoId, setEditingTipoId] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // Construir filtros para la búsqueda
  const filters: TipoDocumentoFiltros | undefined = searchQuery
    ? { nombre: searchQuery }
    : undefined;

  // Usar el hook personalizado con paginación y filtros
  const { data, isLoading, error, refetch } = useTiposDocumento(filters, limit, offset);

  // Extraer datos del resultado
  const tiposDocumento = data?.listarTiposDocumento?.tiposDocumento || [];
  const totalCount = data?.listarTiposDocumento?.totalCount || 0;
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

  const handleViewTipo = (tipo: TipoDocumento) => {
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleEditTipo = (tipo: TipoDocumento) => {
    setEditingTipoId(tipo.id);
    setIsFormOpen(true);
  };

  const handleEditFromView = (tipo: TipoDocumento) => {
    setEditingTipoId(tipo.id);
    setIsFormOpen(true);
  };

  const handleDeleteTipo = (tipo: TipoDocumento) => {
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
        <span className="text-xs bg-blue-100/20 dark:bg-blue-100/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded font-mono">
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
      key: 'estado',
      header: 'Estado',
      className: 'text-center',
      render: (value: 'activo' | 'inactivo') => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          value === 'activo' 
            ? 'bg-green-300/20 text-green-400 dark:bg-green-500/10 dark:text-green-300' 
            : 'bg-red-100/20 text-red-400 dark:bg-red-100/20 dark:text-red-300'
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
      render: (value: any, row: TipoDocumento) => (
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
          Error al cargar los tipos de documento: {error.message}
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
            Tipos de Documento
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestión de todos los tipos de documento del sistema
          </p>
        </div>
        <Button
          variant="custom"
          color="blue"
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
              placeholder="Buscar tipos de documento..."
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

      {/* Tabla de Tipos de Documento */}
      <DataTable
        data={tiposDocumento}
        columns={columns}
        subtitle={`Total: ${totalCount} tipos de documento`}
        showPagination={true}
        serverPagination={{
          currentPage,
          totalPages,
          totalCount,
          onPageChange: handlePageChange
        }}
        loading={isLoading}
        emptyMessage="Los tipos de documento aparecerán aquí cuando se registren"
      />

      {/* Modal para ver detalles */}
      <TipoDocumentoView
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tipo={selectedTipo}
        onEdit={handleEditFromView}
      />

      {/* Formulario para crear/editar tipos de documento */}
      <TipoDocumentoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        tipoDocumentoId={editingTipoId}
      />
    </div>
  );
}