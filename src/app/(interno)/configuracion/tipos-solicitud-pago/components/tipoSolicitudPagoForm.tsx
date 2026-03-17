'use client';

import { useState, useEffect } from 'react';
import { useCrearTipoSolicitudPago, useActualizarTipoSolicitudPago, useTipoSolicitudPago } from '@/hooks/useTipoSolicitudPago';
import { Button, Input, Textarea, Select } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { FileText, Edit, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TipoSolicitudPago } from '@/hooks/useTipoSolicitudPago';

interface TipoSolicitudPagoFormProps {
  isOpen: boolean;
  onClose: () => void;
  tipoSolicitudPagoId?: string; // Si se proporciona, es modo edición
}

// Interfaz local para el formulario que permite categoría vacía
interface TipoSolicitudPagoFormData {
  nombre: string;
  descripcion: string;
  categoria: 'anticipado' | 'avance' | 'cierre' | 'entrega' | 'gasto' | 'ajuste' | '';
  permiteMultiple: boolean;
  permiteVincularReportes: boolean;
  estado: 'activo' | 'inactivo';
}

export default function TipoSolicitudPagoForm({ isOpen, onClose, tipoSolicitudPagoId }: TipoSolicitudPagoFormProps) {
  const [formData, setFormData] = useState<TipoSolicitudPagoFormData>({
    nombre: '',
    descripcion: '',
    categoria: '' as 'anticipado' | 'avance' | 'cierre' | 'entrega' | 'gasto' | 'ajuste' | '',
    permiteMultiple: false,
    permiteVincularReportes: false,
    estado: 'activo' as 'activo' | 'inactivo'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!tipoSolicitudPagoId;
  
  // Hooks para mutaciones
  const createTipoSolicitudPago = useCrearTipoSolicitudPago();
  const updateTipoSolicitudPago = useActualizarTipoSolicitudPago();
  const { data: tipoSolicitudPagoData, isLoading: isLoadingTipo } = useTipoSolicitudPago(tipoSolicitudPagoId || '');

  // Opciones para los selects
  const categoriaOptions = [
    { value: 'anticipado', label: 'Anticipado' },
    { value: 'avance', label: 'Avance' },
    { value: 'cierre', label: 'Cierre' },
    { value: 'entrega', label: 'Entrega' },
    { value: 'gasto', label: 'Gasto' },
    { value: 'ajuste', label: 'Ajuste' }
  ];

  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ];

  // Cargar datos si está en modo edición
  useEffect(() => {
    if (isEditMode && tipoSolicitudPagoData?.obtenerTipoSolicitudPago) {
      const tipo = tipoSolicitudPagoData.obtenerTipoSolicitudPago;
      setFormData({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion || '',
        categoria: tipo.categoria,
        permiteMultiple: tipo.permiteMultiple,
        permiteVincularReportes: tipo.permiteVincularReportes,
        estado: tipo.estado
      });
    }
  }, [isEditMode, tipoSolicitudPagoData]);

  // Resetear formulario cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: '',
        descripcion: '',
        categoria: '',
        permiteMultiple: false,
        permiteVincularReportes: false,
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

    if (!formData.categoria) {
      newErrors.categoria = 'La categoría es requerida';
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
      // Convertir formData a TipoSolicitudPagoInput (sin categoría vacía)
      const input = {
        ...formData,
        categoria: formData.categoria || 'anticipado' // Valor por defecto si está vacío
      };
      
      if (isEditMode) {
        await updateTipoSolicitudPago.mutateAsync({
          id: tipoSolicitudPagoId!,
          input
        });
        toast.success('Tipo de solicitud de pago actualizado correctamente');
      } else {
        await createTipoSolicitudPago.mutateAsync(input);
        toast.success('Tipo de solicitud de pago creado correctamente');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el tipo de solicitud de pago');
    }
  };

  const isLoading = createTipoSolicitudPago.isPending || updateTipoSolicitudPago.isPending;

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
          {isEditMode ? 'Editar Tipo de Solicitud de Pago' : 'Crear Tipo de Solicitud de Pago'}
        </h2>
        <p className="text-xs text-left w-full" style={{ color: 'var(--text-secondary)' }}>
          {isEditMode ? 'Modifica los datos del tipo de solicitud de pago' : 'Registra un nuevo tipo de solicitud de pago en el sistema'}
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
            placeholder="Ej: Adelanto de Viáticos"
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
            placeholder="Describe brevemente para qué se usa este tipo de solicitud de pago"
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

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Categoría{errors.categoria && <span className="text-red-500"> *</span>}
          </label>
          <Select
            value={formData.categoria}
            onChange={(value) => handleInputChange('categoria', value)}
            options={categoriaOptions}
            className={errors.categoria ? 'border-red-400' : ''}
            disabled={isLoading}
          />
          {errors.categoria && (
            <p className="mt-1 text-xs text-red-400">{errors.categoria}</p>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="permiteVincularReportes"
              checked={formData.permiteVincularReportes}
              onChange={(e) => handleInputChange('permiteVincularReportes', e.target.checked)}
              disabled={isLoading}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="permiteVincularReportes" className="text-xs text-text-primary">
              Permite vincular reportes
            </label>
          </div>
        </div>

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
