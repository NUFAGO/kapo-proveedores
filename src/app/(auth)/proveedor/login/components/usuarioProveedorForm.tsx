'use client';

import { useState } from 'react';
import { useCreateUsuarioProveedor } from '@/hooks';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/modal';
import NotificationModal from '@/components/ui/notification-modal';
import { UserPlus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface UsuarioProveedorFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsuarioProveedorForm({ isOpen, onClose }: UsuarioProveedorFormProps) {
  const [formData, setFormData] = useState({
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    dni: '',
    username: '',
    password: '',
    proveedor_id: '',
    proveedor_nombre: '',
    estado: 'PENDIENTE' as 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO'
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUsuarioProveedor = useCreateUsuarioProveedor();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son requeridos';
    if (!formData.apellido_paterno.trim()) newErrors.apellido_paterno = 'El apellido paterno es requerido';
    if (!formData.apellido_materno.trim()) newErrors.apellido_materno = 'El apellido materno es requerido';
    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (formData.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }
    if (!formData.username.trim()) newErrors.username = 'El username es requerido';
    if (!formData.password.trim()) newErrors.password = 'La contraseña es requerida';
    if (!formData.proveedor_id.trim()) newErrors.proveedor_id = 'El ID del proveedor es requerido';
    if (!formData.proveedor_nombre.trim()) newErrors.proveedor_nombre = 'El nombre del proveedor es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    try {
      await createUsuarioProveedor.mutateAsync(formData);
      toast.success('Usuario proveedor creado exitosamente');
      
      // Limpiar formulario
      setFormData({
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        dni: '',
        username: '',
        password: '',
        proveedor_id: '',
        proveedor_nombre: '',
        estado: 'PENDIENTE'
      });
      
      setErrors({});
      setShowConfirmModal(false);
      onClose();
    } catch (error) {
      toast.error('Error al crear usuario proveedor');
      console.error('Error:', error);
    }
  };

  const handleCancelCreate = () => {
    setShowConfirmModal(false);
  };

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
      >
        <UserPlus className="w-5 h-5" style={{ color: '#2563eb' }} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-left w-full" style={{ color: 'var(--text-on-content-bg-heading)' }}>
          Crear Usuario Proveedor
        </h2>
        <p className="text-xs text-left w-full" style={{ color: 'var(--text-secondary)' }}>
          Registra un nuevo usuario para el proveedor
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
          disabled={createUsuarioProveedor.isPending}
          size="xs"
        >
          Cancelar
        </Button>
        <Button
          variant="custom"
          color="primary"
          onClick={handleSubmit}
          disabled={createUsuarioProveedor.isPending}
          loading={createUsuarioProveedor.isPending}
          size="xs"
        >
          Crear Usuario
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        size="md"
        footer={modalFooter}
        showCloseButton={true}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombres*
              </label>
              <Input
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                required
                placeholder="Ingresa nombres"
                className={errors.nombres ? 'border-red-500' : ''}
              />
              {errors.nombres && (
                <p className="text-xs text-red-500 mt-1">{errors.nombres}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido Paterno*
              </label>
              <Input
                name="apellido_paterno"
                value={formData.apellido_paterno}
                onChange={handleInputChange}
                required
                placeholder="Ingresa apellido paterno"
                className={errors.apellido_paterno ? 'border-red-500' : ''}
              />
              {errors.apellido_paterno && (
                <p className="text-xs text-red-500 mt-1">{errors.apellido_paterno}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido Materno*
              </label>
              <Input
                name="apellido_materno"
                value={formData.apellido_materno}
                onChange={handleInputChange}
                required
                placeholder="Ingresa apellido materno"
                className={errors.apellido_materno ? 'border-red-500' : ''}
              />
              {errors.apellido_materno && (
                <p className="text-xs text-red-500 mt-1">{errors.apellido_materno}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                DNI*
              </label>
              <Input
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                required
                placeholder="Ingresa DNI"
                maxLength={8}
                minLength={8}
                className={errors.dni ? 'border-red-500' : ''}
              />
              {errors.dni && (
                <p className="text-xs text-red-500 mt-1">{errors.dni}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username*
              </label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Ingresa username"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña*
              </label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Ingresa contraseña"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID Proveedor*
              </label>
              <Input
                name="proveedor_id"
                value={formData.proveedor_id}
                onChange={handleInputChange}
                required
                placeholder="Ingresa ID del proveedor"
                className={errors.proveedor_id ? 'border-red-500' : ''}
              />
              {errors.proveedor_id && (
                <p className="text-xs text-red-500 mt-1">{errors.proveedor_id}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Proveedor*
              </label>
              <Input
                name="proveedor_nombre"
                value={formData.proveedor_nombre}
                onChange={handleInputChange}
                required
                placeholder="Ingresa nombre del proveedor"
                className={errors.proveedor_nombre ? 'border-red-500' : ''}
              />
              {errors.proveedor_nombre && (
                <p className="text-xs text-red-500 mt-1">{errors.proveedor_nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado*
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACTIVO">Activo</option>
                <option value="BLOQUEADO">Bloqueado</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación */}
      <NotificationModal
        isOpen={showConfirmModal}
        onClose={handleCancelCreate}
        type="info"
        message="¿Confirmar Creación?"
        description={
          <div className="space-y-2">
            <p>Estás por crear un nuevo usuario proveedor con los siguientes datos:</p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-xs space-y-1">
              <div><strong>Nombre:</strong> {formData.nombres} {formData.apellido_paterno} {formData.apellido_materno}</div>
              <div><strong>DNI:</strong> {formData.dni}</div>
              <div><strong>Proveedor:</strong> {formData.proveedor_nombre}</div>
              <div><strong>Estado:</strong> {formData.estado}</div>
            </div>
            <p>¿Deseas continuar?</p>
          </div>
        }
        confirmText="Confirmar Creación"
        cancelText="Cancelar"
        onConfirm={handleConfirmCreate}
        onCancel={handleCancelCreate}
        loading={createUsuarioProveedor.isPending}
      />
    </>
  );
}