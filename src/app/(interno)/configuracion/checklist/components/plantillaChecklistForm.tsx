'use client';

import { useState, useEffect } from 'react';
import { useCrearPlantillaChecklist, useActualizarPlantillaChecklist, usePlantillaChecklist, useCategoriasChecklist, usePlantillaDocumento } from '@/hooks';
import { Button, Input, Textarea, Select, SelectSearch } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { FileText, Edit, CheckCircle, Plus, X, AlertCircle } from 'lucide-react';
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
  const [showRequisitosModal, setShowRequisitosModal] = useState(false);
  const [selectedPlantillaDocumento, setSelectedPlantillaDocumento] = useState<string | null>('');

  const isEditMode = !!plantillaChecklistId;
  
  // Hooks para mutaciones
  const createPlantillaChecklist = useCrearPlantillaChecklist();
  const updatePlantillaChecklist = useActualizarPlantillaChecklist();
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
        categoriaChecklistId: plantillaData.categoriaChecklistId,
        activo: plantillaData.activo
      });
    }
  }, [isEditMode, plantillaData]);

  // Efecto adicional para cargar datos cuando el modal se abre en modo edición
  useEffect(() => {
    if (isOpen && isEditMode && plantillaData) {
      setFormData({
        nombre: plantillaData.nombre,
        descripcion: plantillaData.descripcion || '',
        categoriaChecklistId: plantillaData.categoriaChecklistId,
        activo: plantillaData.activo
      });
    }
  }, [isOpen, isEditMode, plantillaData]);

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
      setShowRequisitosModal(false);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const input = {
        ...formData,
        // Para nuevas plantillas, version y vigente se manejan automáticamente
        version: isEditMode ? undefined : 1,
        vigente: true, // Siempre vigente al crear/editar
        plantillaBaseId: isEditMode ? undefined : formData.categoriaChecklistId // Nueva plantilla apunta a sí misma
      };
      
      if (isEditMode) {
        await updatePlantillaChecklist.mutateAsync({
          id: plantillaChecklistId!,
          input
        });
        toast.success('Plantilla de checklist actualizada correctamente');
      } else {
        await createPlantillaChecklist.mutateAsync(input);
        toast.success('Plantilla de checklist creada correctamente');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la plantilla de checklist');
    }
  };

  const isLoading = createPlantillaChecklist.isPending || updatePlantillaChecklist.isPending;

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
          {isEditMode && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-primary">Requisitos de Documentos</h3>
                
                <div className="flex items-center gap-2">
                  <SelectSearch
                    value={selectedPlantillaDocumento}
                    onChange={setSelectedPlantillaDocumento}
                    options={plantillaDocumentoOptions}
                    placeholder="Buscar plantilla..."
                    className="w-64 text-xs"
                    isLoading={isLoadingPlantillasDocumento}
                    showSearchIcon={true}
                    onSearch={handleSearchPlantillas}
                    minCharsForSearch={2}
                  />
                  <Button
                    variant="subtle"
                    color="blue"
                    size="sm"
                    icon={<Plus className="h-3 w-3" />}
                    onClick={() => setShowRequisitosModal(true)}
                  >
                    Asignar Documentos
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Esta sección estará disponible cuando se implemente la gestión de requisitos</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal para asignar requisitos (placeholder) */}
      <Modal
        isOpen={showRequisitosModal}
        onClose={() => setShowRequisitosModal(false)}
        title={
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <span className="text-xs font-semibold text-text-primary">
                Asignar Documentos Requeridos
              </span>
              <div className="text-xs text-muted-foreground">
                Selecciona los documentos que serán obligatorios para esta plantilla
              </div>
            </div>
          </div>
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setShowRequisitosModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="custom"
              color="primary"
              onClick={() => setShowRequisitosModal(false)}
            >
              Guardar Asignación
            </Button>
          </div>
        }
      >
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Gestión de Requisitos
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Esta funcionalidad estará disponible cuando se implemente la sección de Tipos de Documento y Requisitos.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aquí podrás seleccionar qué documentos son obligatorios para cada plantilla.
          </p>
        </div>
      </Modal>
    </>
  );
}
