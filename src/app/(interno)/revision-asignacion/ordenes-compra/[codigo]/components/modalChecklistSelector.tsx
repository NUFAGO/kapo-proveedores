'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { SelectSearch, SelectSearchOption } from '@/components/ui/select-search';
import Modal from '@/components/ui/modal';
import { Plus, FileText, AlertCircle, FolderOpen, Layers, CheckCircle,CheckSquareIcon } from 'lucide-react';
import { FiCheckSquare } from "react-icons/fi";
import toast from 'react-hot-toast';
import { useCategoriasChecklist, usePlantillasChecklist } from '@/hooks';
import type { CategoriaChecklist, PlantillaChecklist } from '@/hooks';

type ModalType = 'solicitud-pago' | 'documento-oc';

interface ModalChecklistSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  ordenCompraId: string;
  onSuccess?: (item: any) => void;
}

export default function ModalChecklistSelector({ 
  isOpen, 
  onClose, 
  type, 
  ordenCompraId, 
  onSuccess
}: ModalChecklistSelectorProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Configuracion segun el tipo de modal
  const modalConfig = {
    'solicitud-pago': {
      title: 'Agregar Solicitud de Pago',
      tipoUso: 'pago' as const,
      placeholderCategoria: 'Buscar categoria de pago...',
      submitText: 'Agregar',
      icon: <Plus className="w-4 h-4" />,
      successMessage: 'Solicitud de pago agregada exitosamente',
      errorMessage: 'Error al agregar la solicitud de pago',
      infoMessage: 'Al agregar esta solicitud, se preparara para el envio posterior con todos los requisitos que el proveedor debera cumplir.'
    },
    'documento-oc': {
      title: 'Agregar Documentos OC',
      tipoUso: 'documentos_oc' as const,
      placeholderCategoria: 'Buscar categoria de documentos...',
      submitText: 'Agregar',
      icon: <FileText className="w-4 h-4" />,
      successMessage: 'Documentos OC agregados exitosamente',
      errorMessage: 'Error al agregar documentos OC',
      infoMessage: 'Al seleccionar esta plantilla, se prepararan los documentos OC requeridos segun los requisitos definidos para su posterior envio.'
    }
  };

  const config = modalConfig[type];

  // Funciones de utilidad para el estilo de cards
  const getPlantillaIcon = (categoriaNombre: string) => {
    if (categoriaNombre.toLowerCase().includes('adelanto')) return <Plus className="w-4 h-4" />;
    if (categoriaNombre.toLowerCase().includes('valorización')) return <CheckCircle className="w-4 h-4" />;
    if (categoriaNombre.toLowerCase().includes('liquidación')) return <Layers className="w-4 h-4" />;
    if (categoriaNombre.toLowerCase().includes('contrato')) return <FileText className="w-4 h-4" />;
    if (categoriaNombre.toLowerCase().includes('tdr')) return <FolderOpen className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getPlantillaColor = (categoriaNombre: string) => {
    if (categoriaNombre.toLowerCase().includes('adelanto')) return 'from-blue-500 to-blue-600';
    if (categoriaNombre.toLowerCase().includes('valorización')) return 'from-green-500 to-green-600';
    if (categoriaNombre.toLowerCase().includes('liquidación')) return 'from-purple-500 to-purple-600';
    if (categoriaNombre.toLowerCase().includes('contrato')) return 'from-orange-500 to-orange-600';
    if (categoriaNombre.toLowerCase().includes('tdr')) return 'from-cyan-500 to-cyan-600';
    return 'from-gray-500 to-gray-600';
  };

  // Usar hooks existentes para cargar datos
  const { data: categoriasData, isLoading: loadingCategorias } = useCategoriasChecklist({
    tipoUso: config.tipoUso,
    estado: 'activo'
  }, 100, 0); // Límite alto para obtener todos

  const { data: plantillasData, isLoading: loadingPlantillas } = usePlantillasChecklist(
    categoriaSeleccionada ? {
      categoriaChecklistId: categoriaSeleccionada,
      activo: true
    } : undefined,
    100, 0
  );

  const categorias = categoriasData?.categoriasChecklist || [];
  const plantillas = plantillasData?.plantillasChecklist || [];
  const loading = loadingCategorias || loadingPlantillas;

  const handleCategoriaChange = (categoriaId: string | null) => {
    setCategoriaSeleccionada(categoriaId || '');
    setPlantillaSeleccionada('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!categoriaSeleccionada) {
      newErrors.categoria = 'Debe seleccionar una categoría';
    }
    
    if (!plantillaSeleccionada) {
      newErrors.plantilla = 'Debe seleccionar una plantilla';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Preparar datos para el estado global
      const nuevoItem = {
        id: `${type}-${Date.now()}`, // ID temporal
        tipo: type,
        ordenCompraId,
        categoriaChecklistId: categoriaSeleccionada,
        plantillaChecklistId: plantillaSeleccionada,
        categoria: categorias.find((cat: CategoriaChecklist) => cat.id === categoriaSeleccionada),
        plantilla: plantillas.find((pl: PlantillaChecklist) => pl.id === plantillaSeleccionada),
        timestamp: new Date().toISOString()
      };

      // TODO: Aquí se agregaría al estado global
      // Por ejemplo: dispatch(addItem(nuevoItem))
      
      console.log('📋 [PREPARADO] Item para estado global:', nuevoItem);
      
      toast.success(config.successMessage);
      onClose();
      onSuccess?.(nuevoItem);
    } catch (error) {
      console.error('Error:', error);
      toast.error(config.errorMessage);
    }
  };

  const resetForm = () => {
    setCategoriaSeleccionada('');
    setPlantillaSeleccionada('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Convertir categorías a opciones para SelectSearch
  const categoriaOptions: SelectSearchOption[] = categorias.map((cat: CategoriaChecklist) => ({
    value: cat.id,
    label: cat.nombre
  }));

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
      >
        {type === 'documento-oc' ? (
          <FileText className="w-5 h-5" style={{ color: '#2563eb' }} />
        ) : (
          <Plus className="w-5 h-5" style={{ color: '#2563eb' }} />
        )}
      </div>
      <div>
        <h2 className="text-sm font-bold text-left w-full" style={{ color: 'var(--text-on-content-bg-heading)' }}>
          {config.title}
        </h2>
        <p className="text-xs text-left w-full" style={{ color: 'var(--text-secondary)' }}>
          {type === 'documento-oc' 
            ? 'Configura los documentos base requeridos para este expediente'
            : 'Crea una nueva solicitud de pago para el proveedor'
          }
        </p>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="md"
      footer={
        <div className="flex items-center justify-between px-4">
          <div></div>
          <div className="flex gap-2">
            <Button
              variant="custom"
              color="secondary"
              onClick={handleClose}
              disabled={loading}
              size="xs"
            >
              Cancelar
            </Button>
            <Button
              variant="custom"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !categoriaSeleccionada || !plantillaSeleccionada}
              loading={loading}
              size="xs"
            >
              {config.icon}
              {config.submitText}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-xs text-gray-600 mb-4">
          <strong>OC:</strong> {ordenCompraId}
        </div>

        {/* Select de Categoria Checklist usando SelectSearch */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Categoría Checklist{errors.categoria && <span className="text-red-500">*</span>}
          </label>
          <SelectSearch
            value={categoriaSeleccionada}
            onChange={handleCategoriaChange}
            options={categoriaOptions}
            placeholder={config.placeholderCategoria}
            isLoading={loadingCategorias}
            showSearchIcon={true}
            className={errors.categoria ? 'border-red-400' : ''}
          />
          {errors.categoria && (
            <p className="mt-1 text-xs text-red-400">{errors.categoria}</p>
          )}
        </div>

        {/* Lista de Plantillas Checklist - Cards estilo sistema */}
        <div className="h-80">
          <label className="block text-xs font-medium text-text-primary mb-1">
            Plantilla Checklist{errors.plantilla && <span className="text-red-500">*</span>}
          </label>
          
          <div className="h-72 border border-gray-200 rounded-lg overflow-hidden">
            {!categoriaSeleccionada ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Selecciona una categoría</p>
                  <p className="text-xs mt-1">Para ver las plantillas disponibles</p>
                </div>
              </div>
            ) : loadingPlantillas ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm">Cargando plantillas...</p>
                </div>
              </div>
            ) : plantillas.length > 0 ? (
              <div className="h-full overflow-y-auto p-2 space-y-3">
                {plantillas.map((plantilla: PlantillaChecklist) => (
                  <label
                    key={plantilla.id}
                    className={`block cursor-pointer transition-all ${
                      plantillaSeleccionada === plantilla.id 
                        ? '' 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className={`bg-white dark:bg-gray-900/10 rounded-md card-shadow-hover overflow-hidden ${
                      plantillaSeleccionada === plantilla.id ? 'border-blue-500' : 'border-gray-200'
                    } `}>
                      {/* Header con gradiente */}
                      <div className='h-1 bg-linear-to-r from-purple-500/30 to-blue-400/30 dark:from-purple-600/20 dark:to-blue-500/20' />

                      <div className="p-3">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Radio button */}
                            <input
                              type="radio"
                              name="plantilla"
                              value={plantilla.id}
                              checked={plantillaSeleccionada === plantilla.id}
                              onChange={(e) => {
                                setPlantillaSeleccionada(e.target.value);
                                setErrors({ ...errors, plantilla: '' });
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            
                            {/* Icono e información */}
                            <div className={`w-8 h-8 rounded-lg bg-linear-to-r ${getPlantillaColor(plantilla.categoria?.nombre || '')} flex items-center justify-center text-white`}>
                              {getPlantillaIcon(plantilla.categoria?.nombre || '')}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                {plantilla.codigo}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                                {plantilla.nombre}
                              </p>
                            </div>
                          </div>
                          
                          {/* Estado */}
                          <div className="flex items-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              plantilla.activo 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {plantilla.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>

                        {/* Descripción */}
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                          {plantilla.descripcion || 'Sin descripción disponible'}
                        </p>

                        {/* Metadatos */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            <span>{plantilla.categoria?.nombre || 'Sin categoría'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckSquareIcon className="w-3 h-3" />
                            <span>{plantilla.requisitos?.filter((req: any) => req.activo).length || 0} requisitos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No se encontraron plantillas para esta categoría</p>
                  <p className="text-xs mt-1">Intenta seleccionar otra categoría</p>
                </div>
              </div>
            )}
          </div>
          {errors.plantilla && (
            <p className="mt-1 text-xs text-red-400">{errors.plantilla}</p>
          )}
        </div>
        
      </form>
    </Modal>
  );
}
