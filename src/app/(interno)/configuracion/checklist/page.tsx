'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, FileText, Copy, Layers, Grid, List, Filter, ChevronDown, ChevronRight, Star, Clock, Users, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { FiCheckSquare } from "react-icons/fi";
import { Button, DataTable } from '@/components/ui';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { usePlantillasChecklist, usePlantillasChecklistInfinite, type PlantillaChecklist, type PlantillaChecklistFiltros } from '@/hooks/usePlantillaChecklist';
import PlantillaChecklistForm from './components/plantillaChecklistForm';
import PlantillaChecklistView from './components/plantillaChecklistView';

export default function PlantillaChecklistPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaChecklist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlantillaId, setEditingPlantillaId] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const tableLimit = 10;
  const gridPageSize = 12;
  const offset = (currentPage - 1) * tableLimit;

  // Construir filtros para la búsqueda
  const filters: PlantillaChecklistFiltros | undefined = searchQuery || selectedCategory
    ? { 
        nombre: searchQuery || undefined,
        categoriaChecklistId: selectedCategory || undefined
      }
    : undefined;

  // Usar hook diferente según el modo de vista
  const paginatedQuery = usePlantillasChecklist(filters, tableLimit, offset);
  const infiniteQuery = usePlantillasChecklistInfinite(filters, gridPageSize);

  const fetchNextPageRef = useRef(infiniteQuery.fetchNextPage);
  fetchNextPageRef.current = infiniteQuery.fetchNextPage;
  const isFetchingNextRef = useRef(infiniteQuery.isFetchingNextPage);
  isFetchingNextRef.current = infiniteQuery.isFetchingNextPage;

  // Seleccionar el query apropiado según el modo
  const { data, isLoading, error, refetch } = viewMode === 'list' ? paginatedQuery : {
    data: {
      plantillasChecklist: infiniteQuery.data?.pages.flatMap(page => page.data) || [],
      totalCount: infiniteQuery.data?.pages[0]?.totalCount || 0
    },
    isLoading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch
  };

  // Extraer datos del resultado
  const plantillasChecklist = data?.plantillasChecklist || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / tableLimit);

  const hasMore = Boolean(infiniteQuery.hasNextPage);

  useEffect(() => {
    if (viewMode !== 'grid' || !hasMore) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (isFetchingNextRef.current) return;
        void fetchNextPageRef.current();
      },
      { root: null, rootMargin: '160px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode, hasMore, plantillasChecklist.length, searchQuery, selectedCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewPlantilla = (plantilla: PlantillaChecklist) => {
    setSelectedPlantilla(plantilla);
    setIsModalOpen(true);
  };

  const handleEditFromView = (plantilla: PlantillaChecklist) => {
    handleEditPlantilla(plantilla);
  };

  const handleEditPlantilla = (plantilla: PlantillaChecklist) => {
    setEditingPlantillaId(plantilla.id);
    setIsFormOpen(true);
  };

  const handleDeletePlantilla = (plantilla: PlantillaChecklist) => {
    console.log('Eliminar plantilla:', plantilla);
  };

  const handleDuplicatePlantilla = (plantilla: PlantillaChecklist) => {
    console.log('Duplicar plantilla:', plantilla);
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
    refetch();
  };

  const toggleCardExpansion = (plantillaId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(plantillaId)) {
      newExpanded.delete(plantillaId);
    } else {
      newExpanded.add(plantillaId);
    }
    setExpandedCards(newExpanded);
  };

  const getPlantillaIcon = (categoriaNombre: string) => {
    if (categoriaNombre?.toLowerCase().includes('pago')) return <Layers className="w-4 h-4" />;
    if (categoriaNombre?.toLowerCase().includes('documento')) return <FileText className="w-4 h-4" />;
    return <FolderOpen className="w-5 h-5" />;
  };

  const getPlantillaColor = (categoriaNombre: string) => {
    if (categoriaNombre?.toLowerCase().includes('pago')) return 'from-blue-500 to-blue-600';
    if (categoriaNombre?.toLowerCase().includes('documento')) return 'from-green-500 to-green-600';
    return 'from-purple-500/50 to-purple-600/90';
  };

  // Skeleton para las cards
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900/20 group relative rounded-md card-shadow-hover overflow-hidden animate-pulse">
      {/* Header con gradiente */}
      <div className="h-1 bg-linear-to-r from-gray-300 dark:from-gray-600 to-gray-300 dark:to-gray-600" />

      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-gray-600" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-3/4" />
              <div className="flex items-center gap-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-8" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        </div>

        {/* Descripción */}
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-full" />
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-2/3" />

        {/* Categoría */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16" />
          </div>
        </div>

        {/* Expandible */}
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="w-full flex items-center justify-between p-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12" />
            </div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-6" />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
      </div>
    </div>
  );

  // Vista Grid - Cards modernas
  const PlantillaCard = ({ plantilla }: { plantilla: PlantillaChecklist }) => {
    const isExpanded = expandedCards.has(plantilla.id);
    const isActive = plantilla.activo;
    
    return (
      <div className={`bg-white dark:bg-gray-900/20 group relative rounded-md card-shadow-hover overflow-hidden`}>
        {/* Header con gradiente */}
        <div className='h-1 bg-linear-to-r from-purple-500/30 to-blue-400/30 dark:from-purple-600/20 dark:to- -500/20' />

        <div className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-linear-to-r ${getPlantillaColor(plantilla.categoria?.nombre || '')} flex items-center justify-center text-white`}>
                {getPlantillaIcon(plantilla.categoria?.nombre || '')}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                  {plantilla.nombre}
                </h3>
                <div className="flex items-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="subtle"
                color="blue"
                size="icon"
                title="Ver detalles"
                onClick={() => handleViewPlantilla(plantilla)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="subtle"
                color="gray"
                size="icon"
                title="Duplicar"
                onClick={() => handleDuplicatePlantilla(plantilla)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Descripción */}
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {plantilla.descripcion || 'Sin descripción'}
          </p>

          {/* Categoría */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <FolderOpen className="w-3 h-3" />
              <span>{plantilla.categoria?.nombre || 'Sin categoría'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <FiCheckSquare className="w-3 h-3" />
              <span>{plantilla.requisitos?.filter((req: any) => req.activo).length || 0} requisitos</span>
            </div>
          </div>

          {/* Expandible - Requisitos preview */}
          <div className="border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => toggleCardExpansion(plantilla.id)}
              className="w-full flex items-center justify-between p-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <span className="flex items-center gap-1">
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Requisitos
              </span>
              <span className='text-xs'>{plantilla.requisitos?.filter((req: any) => req.activo).length || 0}</span>
            </button>
            
            {isExpanded && (
              <div className="pb-3 px-3 space-y-2">
                {(() => {
                  const requisitosActivos = plantilla.requisitos?.filter((req: any) => req.activo) || [];
                  return requisitosActivos.slice(0, 3).map((requisito: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        requisito.obligatorio ? 'bg-red-400' : 'bg-gray-300'
                      }`} />
                      <span className="text-gray-600 dark:text-gray-300 truncate">
                        {requisito.plantillaDocumento?.nombrePlantilla || 'Requisito'}
                      </span>
                      {requisito.obligatorio && (
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  ));
                })()}
                {(() => {
                  const requisitosActivos = plantilla.requisitos?.filter((req: any) => req.activo) || [];
                  return requisitosActivos.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                      +{requisitosActivos.length - 3} más...
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="subtle"
              color="blue"
              size="sm"
              onClick={() => handleEditPlantilla(plantilla)}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => handleDeletePlantilla(plantilla)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <div className="text-red-400 text-sm">
          Error al cargar las plantillas de checklist: {error.message}
        </div>
        <Button onClick={() => refetch()} variant="subtle" color="gray">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Plantillas de Checklist
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            Gestiona las plantillas de documentos y requisitos para tus procesos
          </p>
        </div>
        <Button
          variant="custom"
          color="purple"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreateForm}
        >
          Nueva Plantilla
        </Button>
      </div>

      {/* Barra de herramientas */}
      <div className="bg-background/90 rounded-lg card-shadow p-4">
        <div className="flex gap-4 items-center">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar plantillas..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              icon={<Filter className="h-4 w-4" />}
            >
              Filtros
            </Button>
            
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'custom' : 'subtle'}
                color={viewMode === 'grid' ? 'white' : 'transparent'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'custom' : 'subtle'}
                color={viewMode === 'list' ? 'white' : 'transparent'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Clear search */}
            {searchQuery && (
              <Button
                onClick={clearSearch}
                variant="subtle"
                color="violet"
                size="sm"
                icon={<X className="h-4 w-4" />}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {viewMode === 'grid' ? (
        /* Vista Grid */
        <>
          {plantillasChecklist.length === 0 && !isLoading ? (
            <div className="rounded-xl p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No hay plantillas de checklist
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  Debes crear tu primera plantilla de checklist para empezar a gestionar los requisitos de documentos.
                </p>
                <Button
                  variant="custom"
                  color="purple"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={handleOpenCreateForm}
                >
                  Crear Primera Plantilla
                </Button>
              </div>
            </div>
          ) : (
            <div className="-mb-6 px-2 pt-1">
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonCard key={`skeleton-${index}`} />
                  ))
                ) : (
                  plantillasChecklist.map((plantilla: PlantillaChecklist) => (
                    <PlantillaCard key={plantilla.id} plantilla={plantilla} />
                  ))
                )}
              </div>

              {hasMore ? (
                <div
                  ref={loadMoreSentinelRef}
                  className="h-4 w-full shrink-0"
                  aria-hidden
                />
              ) : null}

              {infiniteQuery.isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size={20} />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Vista Lista tradicional */
        <div className="bg-white dark:bg-gray-800 rounded-xl ">
          <DataTable
            data={plantillasChecklist}
            rowsPerPage={tableLimit}
            columns={[
              {
                key: 'nombre',
                header: 'Nombre',
                render: (value: string, row: PlantillaChecklist) => (
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-linear-to-r ${getPlantillaColor(row.categoria?.nombre || '')} flex items-center justify-center text-white`}>
                      {getPlantillaIcon(row.categoria?.nombre || '')}
                    </div>
                    <div className='flex'>
                      <div className="font-semibold text-xs">{value}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'categoria',
                header: 'Categoría',
                render: (value: any) => (
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {value?.nombre || 'Sin categoría'}
                  </span>
                )
              },
              {
                key: 'requisitos',
                header: 'Requisitos',
                render: (value: any[]) => (
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {value?.length || 0} ítems
                  </span>
                )
              },
              {
                key: 'activo',
                header: 'Estado',
                render: (value: boolean) => (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    value 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {value ? 'Activo' : 'Inactivo'}
                  </span>
                )
              },
              {
                key: 'acciones',
                header: 'Acciones',
                render: (value: any, row: PlantillaChecklist) => (
                  <div className="flex items-center gap-1.5">
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
            ]}
            subtitle={`Total: ${totalCount} plantillas`}
            showPagination={true}
            serverPagination={{
              currentPage,
              totalPages,
              totalCount,
              onPageChange: handlePageChange
            }}
            loading={isLoading}
            emptyMessage="Las plantillas aparecerán aquí cuando las crees"
          />
        </div>
      )}

      {/* Modal para ver detalles */}
      <PlantillaChecklistView
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plantilla={selectedPlantilla}
        onEdit={handleEditFromView}
      />

      {/* Formulario para crear/editar */}
      <PlantillaChecklistForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        plantillaChecklistId={editingPlantillaId}
      />
    </div>
  );
}