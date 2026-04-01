'use client';

import { useState, useEffect } from 'react';
import { useCrearPlantillaChecklist, useActualizarPlantillaChecklist, usePlantillaChecklist, useCategoriasChecklist, usePlantillaDocumento, useGuardarPlantillaChecklist } from '@/hooks';
import { Button, Input, Textarea, Select, SelectSearch } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { FileText, Edit, CheckCircle, Plus, X, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PlantillaChecklist } from '@/hooks/usePlantillaChecklist';

interface PlantillaChecklistFormProps {
  isOpen: boolean;
  onClose: () => void;
  plantillaChecklistId?: string;
}

interface PlantillaChecklistFormData {
  nombre: string;
  descripcion: string;
  categoriaChecklistId: string;
  activo: boolean;
}

export default function PlantillaChecklistForm({ isOpen, onClose, plantillaChecklistId }: PlantillaChecklistFormProps) {
  const [formData, setFormData] = useState<PlantillaChecklistFormData>({
    nombre: '',
    descripcion: '',
    categoriaChecklistId: '',
    activo: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requisitos, setRequisitos] = useState<any[]>([]);
  const [selectedPlantillaDocumento, setSelectedPlantillaDocumento] = useState<string | null>('');

  const isEditMode = !!plantillaChecklistId;
  
  // Hook inteligente para crear o actualizar
  const guardarPlantillaChecklist = useGuardarPlantillaChecklist();
  const { data: plantillaData, isLoading: isLoadingPlantilla } = usePlantillaChecklist(plantillaChecklistId || '');
  
  // Hook para obtener categorías disponibles
  const { data: categoriasData } = useCategoriasChecklist();
  
  // Hook para obtener plantillas de documento con función de búsqueda
  const { data: plantillasDocumentoData, isLoading: isLoadingPlantillasDocumento, buscarPlantillas } = usePlantillaDocumento({ activo: true });

  // Opciones iniciales para el select search de plantillas de documento
  const plantillaDocumentoOptions = plantillasDocumentoData?.plantillasDocumento?.map((plantilla: any) => ({
    value: plantilla.id,
    label: `${plantilla.nombrePlantilla} - ${plantilla.tipoDocumento?.nombre || 'Sin tipo'}`
  })) || [];

  // Función para buscar plantillas usando el hook
  const handleSearchPlantillas = async (searchTerm: string) => {
    return await buscarPlantillas(searchTerm);
  };

  // Opciones para los selects
  const categoriaOptions = categoriasData?.categoriasChecklist?.map((cat: any) => ({
    value: cat.id,
    label: `${cat.nombre} (${cat.tipoUso === 'pago' ? 'Pago' : 'Documentos OC'})`
  })) || [];

  const estadoOptions = [
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' }
  ];

  // Cargar datos si está en modo edición
  useEffect(() => {
    if (isEditMode && plantillaData) {
      setFormData({
        nombre: plantillaData.nombre,
        descripcion: plantillaData.descripcion || '',
        categoriaChecklistId: plantillaData.categoriaChecklistId || '',
        activo: plantillaData.activo ?? true
      });
      
      // Cargar requisitos reales
      if (plantillaData.requisitos) {
        setRequisitos(plantillaData.requisitos.map((req: any) => ({
          id: req.id,
          orden: req.orden,
          nombre: req.plantillaDocumento?.nombrePlantilla || req.formulario?.nombre || 'Sin nombre',
          obligatorio: req.obligatorio,
          activo: req.activo,
          tipoRequisito: req.tipoRequisito,
          plantillaDocumentoId: req.plantillaDocumentoId,
          formularioId: req.formularioId
        })));
      }
    }
  }, [plantillaData, isEditMode]);

  // Resetear formulario cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: '',
        descripcion: '',
        categoriaChecklistId: '',
        activo: true
      });
      setErrors({});
      setRequisitos([]);
      setSelectedPlantillaDocumento(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddRequisito = () => {
    if (selectedPlantillaDocumento) {
      const selectedOption = plantillaDocumentoOptions.find(opt => opt.value === selectedPlantillaDocumento);
      
      if (selectedOption && !requisitos.find(r => r.nombre === selectedOption.label.split(' - ')[0])) {
        const nuevoRequisito = {
          id: Date.now().toString(),
          orden: requisitos.length + 1,
          nombre: selectedOption.label.split(' - ')[0],
          obligatorio: true,
          activo: true,
          tipoRequisito: 'documento',
          plantillaDocumentoId: selectedPlantillaDocumento
        };
        
        setRequisitos(prev => [...prev, nuevoRequisito]);
        setSelectedPlantillaDocumento('');
      }
    }
  };

  const handleToggleObligatorio = (id: string) => {
    setRequisitos(prev => prev.map(req => 
      req.id === id ? { ...req, obligatorio: !req.obligatorio } : req
    ));
  };

  const handleToggleActivo = (id: string) => {
    setRequisitos(prev => prev.map(req => 
      req.id === id ? { ...req, activo: !req.activo } : req
    ));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.categoriaChecklistId) {
      newErrors.categoriaChecklistId = 'La categoría es requerida';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Separar requisitos por tipo
      const requisitosActualizar = requisitos.filter(req => 
        // Requisitos existentes: IDs de MongoDB (24 caracteres hexadecimales)
        /^[0-9a-fA-F]{24}$/.test(req.id)
      );
      const nuevosRequisitos = requisitos.filter(req => 
        // Requisitos nuevos: IDs que NO son de MongoDB válidos
        !/^[0-9a-fA-F]{24}$/.test(req.id)
      );

      // Preparar datos para la mutation inteligente
      const input = {
        id: isEditMode ? plantillaChecklistId : undefined,
        datosPlantilla: {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          categoriaChecklistId: formData.categoriaChecklistId,
          activo: formData.activo
        },
        requisitos: nuevosRequisitos.map(req => {
          const requisitoParaBackend = {
            checklistId: isEditMode ? plantillaChecklistId! : '', // Se asignará en backend
            tipoRequisito: req.tipoRequisito || 'documento',
            plantillaDocumentoId: req.plantillaDocumentoId,
            formularioId: req.formularioId,
            obligatorio: req.obligatorio,
            orden: req.orden,
            activo: req.activo
          };
          return requisitoParaBackend;
        }),
        requisitosActualizar: requisitosActualizar.map(req => ({
          id: req.id,
          checklistId: isEditMode ? plantillaChecklistId! : undefined,
          tipoRequisito: req.tipoRequisito || 'documento',
          plantillaDocumentoId: req.plantillaDocumentoId,
          formularioId: req.formularioId,
          obligatorio: req.obligatorio,
          orden: req.orden,
          activo: req.activo
        })),
        requisitosDesactivar: [] // Por ahora no desactivamos, solo actualizamos el estado activo
      };

      await guardarPlantillaChecklist.mutateAsync(input);
      toast.success(isEditMode ? 'Plantilla de checklist actualizada correctamente' : 'Plantilla de checklist creada correctamente');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la plantilla de checklist');
    }
  };

  const isLoading = guardarPlantillaChecklist.isPending;

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
      >
        {isEditMode ? (
          <Edit className="w-5 h-5" style={{ color: '#2563eb' }} />
        ) : (
          <FileText className="w-5 h-5" style={{ color: '#2563eb' }} />
        )}
      </div>
      <div>
        <h2 className="text-sm font-bold text-left w-full" style={{ color: 'var(--text-on-content-bg-heading)' }}>
          {isEditMode ? 'Editar Plantilla de Checklist' : 'Crear Plantilla de Checklist'}
        </h2>
        <p className="text-xs text-left w-full" style={{ color: 'var(--text-secondary)' }}>
          {isEditMode ? 'Modifica los datos de la plantilla de checklist' : 'Registra una nueva plantilla de checklist en el sistema'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        size="lg"
        footer={
          <div className="flex items-center justify-between px-4">
            <div></div>
            <div className="flex gap-2">
              <Button
                variant="custom"
                color="secondary"
                onClick={onClose}
                disabled={isLoading}
                size="xs"
              >
                Cancelar
              </Button>
              <Button
                variant="custom"
                color="primary"
                onClick={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                size="xs"
              >
                {isEditMode ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Nombre{errors.nombre && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Ej: Adelanto Textil v2"
              className={errors.nombre ? 'border-red-400' : ''}
              disabled={isLoading}
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Descripción{errors.descripcion && <span className="text-red-500"> *</span>}
            </label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Describe brevemente para qué se usa esta plantilla de checklist"
              rows={3}
              disabled={isLoading}
            />
            {errors.descripcion && (
              <p className="mt-1 text-xs text-red-400">{errors.descripcion}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.descripcion.length}/500 caracteres
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Categoría{errors.categoriaChecklistId && <span className="text-red-500"> *</span>}
              </label>
              <Select
                value={formData.categoriaChecklistId}
                onChange={(value) => handleInputChange('categoriaChecklistId', value)}
                options={categoriaOptions}
                className={errors.categoriaChecklistId ? 'border-red-400' : ''}
                disabled={isLoading}
              />
              {errors.categoriaChecklistId && (
                <p className="mt-1 text-xs text-red-400">{errors.categoriaChecklistId}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Estado
              </label>
              <Select
                value={formData.activo.toString()}
                onChange={(value) => handleInputChange('activo', value === 'true')}
                options={estadoOptions}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Sección de Requisitos */}
          <div className="space-y-3">
            
            <h3 className="text-xs font-semibold text-text-primary">Requisitos de Documentos</h3>
              
            <div className="flex items-center justify-between mb-3">
             
                <div className="flex items-center gap-2">
                  <SelectSearch
                    value={selectedPlantillaDocumento}
                    onChange={setSelectedPlantillaDocumento}
                    options={plantillaDocumentoOptions}
                    placeholder="Buscar plantilla de documento..."
                    className="w-100 text-xs"
                    isLoading={isLoadingPlantillasDocumento}
                    showSearchIcon={true}
                    onSearch={handleSearchPlantillas}
                    minCharsForSearch={2}
                  />
                  <Button
                    variant="subtle"
                    color="blue"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={handleAddRequisito}
                    disabled={!selectedPlantillaDocumento}
                    type="button"
                  >
                    Añadir documento
                  </Button>
                </div>
              </div>
              
              {/* Tabla de Requisitos */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/40 px-4 py-2 border-b">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Requisitos Asignados
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/40">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Orden
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Nombre de Plantilla
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                          Obligatorio
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                          Estado
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {requisitos.map((requisito) => (
                        <tr key={requisito.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                            {requisito.orden}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                            {requisito.nombre}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={requisito.obligatorio}
                              onChange={() => handleToggleObligatorio(requisito.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              requisito.activo 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {requisito.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                type="button"
                                onClick={() => handleToggleActivo(requisito.id)}
                                className={`${requisito.activo 
                                  ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300' 
                                  : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                                }`}
                                title={requisito.activo ? 'Desactivar requisito' : 'Reactivar requisito'}
                              >
                                {requisito.activo ? <Trash2 className="w-3 h-3" /> : <RotateCcw className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {requisitos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                            No hay documentos asignados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </form>
      </Modal>

      </>
  );
}
