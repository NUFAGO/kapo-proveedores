'use client';

import { useState, useEffect } from 'react';
import { useCrearTipoDocumento, useActualizarTipoDocumento, useTipoDocumento } from '@/hooks/useTipoDocumento';
import { Button, Input, Textarea, Select } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { FileText, Edit, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TipoDocumento } from '@/hooks/useTipoDocumento';

interface TipoDocumentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  tipoDocumentoId?: string; // Si se proporciona, es modo edición
}

export default function TipoDocumentoForm({ isOpen, onClose, tipoDocumentoId }: TipoDocumentoFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'activo' as 'activo' | 'inactivo'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!tipoDocumentoId;
  
  // Hooks para mutaciones
  const createTipoDocumento = useCrearTipoDocumento();
  const updateTipoDocumento = useActualizarTipoDocumento();
  const { data: tipoDocumentoData, isLoading: isLoadingTipo } = useTipoDocumento(tipoDocumentoId || '');

  // Opciones para el select de estado
  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ];

  // Cargar datos si está en modo edición
  useEffect(() => {
    if (isEditMode && tipoDocumentoData?.obtenerTipoDocumento) {
      const tipo = tipoDocumentoData.obtenerTipoDocumento;
      setFormData({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion || '',
        estado: tipo.estado
      });
    }
  }, [isEditMode, tipoDocumentoData]);

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: '',
        descripcion: '',
        estado: 'activo'
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del tipo de documento es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción del tipo de documento es requerida';
    } else if (formData.descripcion.trim().length < 5) {
      newErrors.descripcion = 'La descripción debe tener al menos 5 caracteres';
    } else if (formData.descripcion.trim().length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    if (!formData.estado) {
      newErrors.estado = 'El estado del tipo de documento es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      const submitData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        estado: formData.estado
      };

      if (isEditMode && tipoDocumentoId) {
        await updateTipoDocumento.mutateAsync({ 
          id: tipoDocumentoId, 
          input: submitData 
        });
        toast.success('Tipo de documento actualizado exitosamente');
      } else {
        await createTipoDocumento.mutateAsync(submitData);
        toast.success('Tipo de documento creado exitosamente');
      }
      
      onClose();
    } catch (error) {
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} el tipo de documento`);
      console.error('Error:', error);
    }
  };

  const isPending = createTipoDocumento.isPending || updateTipoDocumento.isPending;

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
          {isEditMode ? 'Editar Tipo de Documento' : 'Crear Tipo de Documento'}
        </h2>
        <p className="text-xs text-left w-full" style={{ color: 'var(--text-secondary)' }}>
          {isEditMode ? 'Modifica los datos del tipo de documento' : 'Registra un nuevo tipo de documento en el sistema'}
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex items-center justify-between px-4">
      <div></div>
      <div className="flex gap-2">
        <Button
          variant="custom"
          color="secondary"
          onClick={onClose}
          disabled={isPending}
          size="xs"
        >
          Cancelar
        </Button>
        <Button
          variant="custom"
          color="primary"
          onClick={handleSubmit}
          disabled={isPending || isLoadingTipo}
          loading={isPending}
          size="xs"
        >
          {isEditMode ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </div>
  );

  if (isEditMode && isLoadingTipo) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        size="md"
        showCloseButton={true}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Cargando datos del tipo de documento...</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={modalFooter}
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Tipo de Documento{errors.nombre && <span className="text-red-500">*</span>}
            </label>
            <Input
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              placeholder="Ej: Factura, Boleta, Contrato"
              className={errors.nombre ? 'border-red-500' : ''}
              disabled={isPending}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción{errors.descripcion && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe brevemente para qué se usa este tipo de documento"
              rows={3}
              className={errors.descripcion ? 'border-red-500' : ''}
              disabled={isPending}
              required
            />
            {errors.descripcion && (
              <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.descripcion.length}/500 caracteres
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado{errors.estado && <span className="text-red-500">*</span>}
            </label>
            <Select
              value={formData.estado}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  estado: value as 'activo' | 'inactivo'
                }));
                // Limpiar error del campo cuando se modifica
                if (errors.estado) {
                  setErrors(prev => ({
                    ...prev,
                    estado: ''
                  }));
                }
              }}
              options={estadoOptions}
              disabled={isPending}
              className={errors.estado ? 'border-red-500' : ''}
            />
            {errors.estado && (
              <p className="text-xs text-red-500 mt-1">{errors.estado}</p>
            )}
            
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-blue-800 dark:text-blue-200 font-bold">i</span>
            </div>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Información:</p>
              <ul className="space-y-1 text-xs">
                <li>• Los tipos de documento activos se usarán en la asignación de checklists</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}