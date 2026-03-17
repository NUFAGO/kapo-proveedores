'use client';

import React, { useState } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button, DataTable } from '@/components/ui';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { usePlantillaDocumento, type PlantillaDocumento, type PlantillaDocumentoFiltros } from '@/hooks/usePlantillaDocumento';
import PlantillaDocumentoForm from './components/plantillaDocumentoForm';
import PlantillaDocumentoView from './components/plantillaDocumentoView';

export default function PlantillaDocumentoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaDocumento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlantillaId, setEditingPlantillaId] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // Construir filtros para la búsqueda
  const filters: PlantillaDocumentoFiltros | undefined = searchQuery
    ? { busqueda: searchQuery }
    : undefined;

  // Usar el hook personalizado con paginación y filtros
  const { data, isLoading, error, refetch } = usePlantillaDocumento(filters, limit, offset);

  // Extraer datos del resultado
  const plantillasDocumento = data?.plantillasDocumento || [];
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

  const handleViewPlantilla = (plantilla: PlantillaDocumento) => {
    setSelectedPlantilla(plantilla);
    setIsModalOpen(true);
  };

  const handleEditFromView = (plantilla: PlantillaDocumento) => {
    handleEditPlantilla(plantilla);
  };

  const handleEditPlantilla = (plantilla: PlantillaDocumento) => {
    setEditingPlantillaId(plantilla.id);
    setIsFormOpen(true);
  };

  const handleDeletePlantilla = (plantilla: PlantillaDocumento) => {
    // Placeholder para funcionalidad de eliminación
    console.log('Eliminar plantilla:', plantilla);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlantilla(null);
  };

  const handleOpenCreateForm = () => {
    setEditingPlantillaId(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPlantillaId(undefined);
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
        <span className="text-xs bg-green-100/20 dark:bg-green-200/10 text-green-600 dark:text-green-400 px-2 py-1 rounded font-mono">
          {value}
        </span>
      )
    },
    {
      key: 'nombrePlantilla',
      header: 'Nombre Plantilla',
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
      key: 'tipoDocumento',
      header: 'Tipo Documento',
      className: 'text-left text-xs',
      render: (value: any, row: PlantillaDocumento) => {
        if (row.tipoDocumento) {
          return (
            <span className="text-xs bg-blue-100/20 dark:bg-blue-200/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-medium">
              {row.tipoDocumento.nombre}
            </span>
          );
        }
        return (
          <span className="text-xs bg-gray-100/20 dark:bg-gray-200/10 text-gray-600 dark:text-gray-400 px-2 py-1 rounded font-mono">
            {row.tipoDocumentoId}
          </span>
        );
      }
    },
    {
      key: 'activo',
      header: 'Estado',
      className: 'text-center',
      render: (value: boolean) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          value 
            ? 'bg-green-100/20 dark:bg-green-200/10 text-green-500 dark:text-green-400' 
            : 'bg-red-100/20 dark:bg-red-200/10 text-red-500 dark:text-red-400'
        }`}>
          {value ? 'Activa' : 'Inactiva'}
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
      render: (value: any, row: PlantillaDocumento) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="subtle"
            color="gray"
            size="icon"
            title="Ver detalles"
            onClick={() => handleViewPlantilla(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="subtle"
            color="blue"
            size="icon"
            title="Editar"
            onClick={() => handleEditPlantilla(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="subtle"
            color="red"
            size="icon"
            title="Eliminar"
            onClick={() => handleDeletePlantilla(row)}
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
          Error al cargar las plantillas de documento: {error.message}
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
            Plantillas de Documento
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestión de todas las plantillas de documento del sistema
          </p>
        </div>
        <Button
          variant="custom"
          color="green"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreateForm}
        >
          Nueva Plantilla
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
              placeholder="Buscar por código, nombre, tipo documento..."
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

      {/* Tabla de Plantillas de Documento */}
      <DataTable
        data={plantillasDocumento}
        columns={columns}
        subtitle={`Total: ${totalCount} plantillas de documento`}
        showPagination={true}
        serverPagination={{
          currentPage,
          totalPages,
          totalCount,
          onPageChange: handlePageChange
        }}
        loading={isLoading}
        emptyMessage="Las plantillas de documento aparecerán aquí cuando se registren"
      />

      {/* Modal para ver detalles */}
      <PlantillaDocumentoView
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plantilla={selectedPlantilla}
        onEdit={handleEditFromView}
      />

      {/* Formulario para crear/editar plantillas de documento */}
      <PlantillaDocumentoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        plantillaDocumentoId={editingPlantillaId}
      />
    </div>
  );
}