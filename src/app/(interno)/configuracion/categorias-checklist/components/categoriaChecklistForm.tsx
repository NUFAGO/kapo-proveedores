'use client';

import { useState, useEffect } from 'react';
import { useCrearCategoriaChecklist, useActualizarCategoriaChecklist, useCategoriaChecklist } from '@/hooks/useCategoriaChecklist';
import { Button, Input, Textarea, Select } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { FileText, Edit, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CategoriaChecklist } from '@/hooks/useCategoriaChecklist';

interface CategoriaChecklistFormProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaChecklistId?: string; // Si se proporciona, es modo edición
}

// Interfaz local para el formulario que permite tipoUso vacío
interface CategoriaChecklistFormData {
  nombre: string;
  descripcion: string;
  tipoUso: 'pago' | 'documentos_oc' | '';
  permiteMultiple: boolean;
  estado: 'activo' | 'inactivo';
}

export default function CategoriaChecklistForm({ isOpen, onClose, categoriaChecklistId }: CategoriaChecklistFormProps) {
  const [formData, setFormData] = useState<CategoriaChecklistFormData>({
    nombre: '',
    descripcion: '',
    tipoUso: '' as 'pago' | 'documentos_oc' | '',
    permiteMultiple: false,
    estado: 'activo' as 'activo' | 'inactivo'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!categoriaChecklistId;
  
  // Hooks para mutaciones
  const createCategoriaChecklist = useCrearCategoriaChecklist();
  const updateCategoriaChecklist = useActualizarCategoriaChecklist();
  const { data: categoriaChecklistData, isLoading: isLoadingCategoria } = useCategoriaChecklist(categoriaChecklistId || '');

  // Opciones para los selects
  const tipoUsoOptions = [
    { value: 'pago', label: 'Pago' },
    { value: 'documentos_oc', label: 'Documentos OC' }
  ];

  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ];

  // Cargar datos si está en modo edición
  useEffect(() => {
    if (isEditMode && categoriaChecklistData?.obtenerCategoriaChecklist) {
      const categoria = categoriaChecklistData.obtenerCategoriaChecklist;
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        tipoUso: categoria.tipoUso,
        permiteMultiple: categoria.permiteMultiple || false,
        estado: categoria.estado
      });
    }
  }, [isEditMode, categoriaChecklistData]);

  // Resetear formulario cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: '',
        descripcion: '',
        tipoUso: '',
        permiteMultiple: false,
        estado: 'activo'
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Si el tipoUso cambia a 'documentos_oc', resetear los campos opcionales
    if (field === 'tipoUso' && value === 'documentos_oc') {
      setFormData(prev => ({ 
        ...prev, 
        tipoUso: value,
        permiteMultiple: false
      }));
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

    if (!formData.tipoUso) {
      newErrors.tipoUso = 'El tipo de uso es requerido';
    }

    if (!formData.estado) {
      newErrors.estado = 'El estado es requerido';
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
      // Convertir formData a CategoriaChecklistInput (solo incluir campos opcionales si aplica)
      const input = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipoUso: formData.tipoUso as 'pago' | 'documentos_oc',
        estado: formData.estado,
        ...(formData.tipoUso === 'pago' && {
          permiteMultiple: formData.permiteMultiple
        })
      };
      
      if (isEditMode) {
        await updateCategoriaChecklist.mutateAsync({
          id: categoriaChecklistId!,
          input
        });
        toast.success('Categoría de checklist actualizada correctamente');
      } else {
        await createCategoriaChecklist.mutateAsync(input);
        toast.success('Categoría de checklist creada correctamente');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la categoría de checklist');
    }
  };

  const isLoading = createCategoriaChecklist.isPending || updateCategoriaChecklist.isPending;

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
          {isEditMode ? 'Editar Categoría de Checklist' : 'Crear Categoría de Checklist'}
        </h2>
        <p className="text-xs text-left w-full" style={{ color: 'var(--text-secondary)' }}>
          {isEditMode ? 'Modifica los datos de la categoría de checklist' : 'Registra una nueva categoría de checklist en el sistema'}
        </p>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
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
            placeholder="Ej: Documentos de Pago"
            className={errors.nombre ? 'border-red-400' : ''}
            disabled={isLoading}
          />
          {errors.nombre && (
            <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Descripción{errors.descripcion && <span className="text-red-500"> *</span>}
          </label>
          <Textarea
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            placeholder="Describe brevemente para qué se usa esta categoría de checklist"
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

        {/* Tipo de Uso */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Tipo de Uso{errors.tipoUso && <span className="text-red-500"> *</span>}
          </label>
          <Select
            value={formData.tipoUso}
            onChange={(value) => handleInputChange('tipoUso', value)}
            options={tipoUsoOptions}
            className={errors.tipoUso ? 'border-red-400' : ''}
            disabled={isLoading}
          />
          {errors.tipoUso && (
            <p className="mt-1 text-xs text-red-400">{errors.tipoUso}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formData.tipoUso === 'pago' 
              ? 'Esta categoría se usará para checklists de pagos'
              : formData.tipoUso === 'documentos_oc'
              ? 'Esta categoría se usará para checklists de documentos OC'
              : 'Selecciona el tipo de uso para esta categoría'
            }
          </p>
        </div>

        {/* Checkboxes - solo visibles para tipoUso = 'pago' */}
        {formData.tipoUso === 'pago' && (
          <div className="space-y-3 bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
              Opciones adicionales para pagos:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permiteMultiple"
                checked={formData.permiteMultiple}
                onChange={(e) => handleInputChange('permiteMultiple', e.target.checked)}
                disabled={isLoading}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="permiteMultiple" className="text-xs text-text-primary">
                Permite múltiples solicitudes
              </label>
            </div>
          </div>
        )}

        {/* Estado */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Estado{errors.estado && <span className="text-red-500"> *</span>}
          </label>
          <Select
            value={formData.estado}
            onChange={(value) => handleInputChange('estado', value)}
            options={estadoOptions}
            className={errors.estado ? 'border-red-400' : ''}
            disabled={isLoading}
          />
          {errors.estado && (
            <p className="mt-1 text-xs text-red-400">{errors.estado}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
