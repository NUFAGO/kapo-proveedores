'use client';

import { useState, useEffect } from 'react';
import { useCreateUsuarioProveedor } from '@/hooks';
import { verificarCodigoAcceso, type VerificacionCodigoResponse } from '@/hooks/useVerificarCodigoAcceso';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/modal';
import NotificationModal from '@/components/ui/notification-modal';
import { UserPlus, CheckCircle, Eye, EyeOff } from 'lucide-react';
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
    codigo_acceso: '',
    proveedor_id: '',
    proveedor_nombre: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO'
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [proveedorData, setProveedorData] = useState<any>(null);
  const [codigoVerificado, setCodigoVerificado] = useState(false);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [mostrarContrasenna, setMostrarContrasenna] = useState(false);

  const createUsuarioProveedor = useCreateUsuarioProveedor();

  useEffect(() => {
    if (!isOpen) setMostrarContrasenna(false);
  }, [isOpen]);

  const CAMPOS_TRIM_BLUR = new Set([
    'nombres',
    'apellido_paterno',
    'apellido_materno',
    'dni',
    'username',
    'codigo_acceso',
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son requeridos';
    if (!formData.apellido_paterno.trim()) newErrors.apellido_paterno = 'El apellido paterno es requerido';
    if (!formData.apellido_materno.trim()) newErrors.apellido_materno = 'El apellido materno es requerido';
    const dniLimpio = formData.dni.trim();
    if (!dniLimpio) {
      newErrors.dni = 'El DNI es requerido';
    } else if (dniLimpio.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }
    if (!formData.username.trim()) newErrors.username = 'El username es requerido';
    if (!formData.password.trim()) newErrors.password = 'La contraseña es requerida';
    if (!formData.codigo_acceso.trim()) {
      newErrors.codigo_acceso = 'El código de acceso es requerido';
    } else if (!codigoVerificado) {
      newErrors.codigo_acceso = 'Debe verificar el código de acceso';
    }

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

    // Si se modifica el código de acceso, resetear la verificación
    if (name === 'codigo_acceso') {
      setCodigoVerificado(false);
      setProveedorData(null);
      setFormData(prev => ({
        ...prev,
        proveedor_id: '',
        proveedor_nombre: ''
      }));
    }
  };

  const handleBlurTrim = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name;
    if (!CAMPOS_TRIM_BLUR.has(name)) return;
    const trimmed = e.target.value.trim();
    if (trimmed === e.target.value) return;
    setFormData((prev) => ({ ...prev, [name]: trimmed }));
  };

  const handleVerificarCodigo = async () => {
    const codigoLimpio = formData.codigo_acceso.trim();
    if (!codigoLimpio) {
      toast.error('Ingrese un código de acceso');
      return;
    }

    setFormData((prev) => ({ ...prev, codigo_acceso: codigoLimpio }));

    setVerificandoCodigo(true);
    
    try {
      const result = await verificarCodigoAcceso(codigoLimpio);
      
      if (result.valido && result.proveedor) {
        const proveedor = result.proveedor;
        setProveedorData(proveedor);
        setFormData(prev => ({
          ...prev,
          proveedor_id: proveedor.id,
          proveedor_nombre: proveedor.razon_social,
          estado: 'ACTIVO' // Estado automático cuando se verifica el código
        }));
        setCodigoVerificado(true);
        toast.success('Código verificado correctamente');
      } else {
        setCodigoVerificado(false);
        setProveedorData(null);
        setFormData(prev => ({
          ...prev,
          proveedor_id: '',
          proveedor_nombre: '',
          estado: 'ACTIVO' // Resetear a ACTIVO
        }));
        toast.error(result.error || 'Código inválido o expirado. Volver a comunicarse con soporte');
      }
    } catch (error) {
      setCodigoVerificado(false);
      setProveedorData(null);
      setFormData(prev => ({
        ...prev,
        proveedor_id: '',
        proveedor_nombre: '',
        estado: 'ACTIVO' // Resetear a ACTIVO
      }));
      toast.error('Error al verificar el código. Volver a comunicarse con soporte');
      console.error('Error:', error);
    } finally {
      setVerificandoCodigo(false);
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
      // Eliminar codigo_acceso antes de enviar; quitar espacios accidentales al pegar
      const { codigo_acceso, ...rest } = formData;
      const dataToSend = {
        ...rest,
        nombres: rest.nombres.trim(),
        apellido_paterno: rest.apellido_paterno.trim(),
        apellido_materno: rest.apellido_materno.trim(),
        dni: rest.dni.trim(),
        username: rest.username.trim(),
      };
      
      await createUsuarioProveedor.mutateAsync(dataToSend);
      toast.success('Usuario proveedor creado exitosamente');
      
      // Limpiar formulario
      setFormData({
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        dni: '',
        username: '',
        password: '',
        codigo_acceso: '',
        proveedor_id: '',
        proveedor_nombre: '',
        estado: 'ACTIVO'
      });
      
      setProveedorData(null);
      setCodigoVerificado(false);
      setErrors({});
      setShowConfirmModal(false);
      onClose();
    } catch (error: any) {
      console.error('Error al crear usuario proveedor:', error);
      
      // Manejar errores específicos de GraphQL
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('E11000 duplicate key error') && error.message.includes('username_1')) {
          toast.error('El nombre de usuario ya está en uso. Por favor, elige otro nombre de usuario.');
        } else if (error.message.includes('E11000 duplicate key error') && error.message.includes('dni_1')) {
          toast.error('El DNI ya está registrado. Por favor, verifica los datos.');
        } else if (error.message.includes('GraphQL errors:')) {
          // Extraer mensaje específico de error de GraphQL
          const graphqlError = error.message.replace('GraphQL errors: ', '');
          toast.error(`Error al crear usuario: ${graphqlError}`);
        } else {
          toast.error('Error al crear usuario proveedor. Por favor, intenta nuevamente.');
        }
      } else {
        toast.error('Error al crear usuario proveedor. Por favor, intenta nuevamente.');
      }
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
                onBlur={handleBlurTrim}
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
                onBlur={handleBlurTrim}
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
                onBlur={handleBlurTrim}
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
                onBlur={handleBlurTrim}
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
                onBlur={handleBlurTrim}
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
              <div className="relative">
                <Input
                  name="password"
                  type={mostrarContrasenna ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Ingresa contraseña"
                  className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  onClick={() => setMostrarContrasenna((v) => !v)}
                  aria-label={mostrarContrasenna ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContrasenna ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código de Acceso*
              </label>
              <div className="flex gap-2">
                <Input
                  name="codigo_acceso"
                  value={formData.codigo_acceso}
                  onChange={handleInputChange}
                  onBlur={handleBlurTrim}
                  required
                  placeholder="Ingresa código de acceso"
                  className={errors.codigo_acceso ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="custom"
                  color="secondary"
                  onClick={handleVerificarCodigo}
                  disabled={verificandoCodigo || !formData.codigo_acceso.trim()}
                  loading={verificandoCodigo}
                  size="xs"
                >
                  Verificar
                </Button>
              </div>
              {errors.codigo_acceso && (
                <p className="text-xs text-red-500 mt-1">{errors.codigo_acceso}</p>
              )}
            </div>

            {codigoVerificado && proveedorData && (
              <div className="md:col-span-2">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Proveedor Verificado
                    </span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <div><strong>RUC:</strong> {proveedorData.ruc}</div>
                    <div><strong>Razón Social:</strong> {proveedorData.razon_social}</div>
                    <div><strong>Nombre Comercial:</strong> {proveedorData.nombre_comercial}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación */}
      <NotificationModal
        isOpen={showConfirmModal}
        onClose={handleCancelCreate}
        type="info"
        message="Confirmar Creación"
        description={
          <div className="space-y-6">
            <p className="text-xs">Estás por crear un nuevo usuario proveedor con los siguientes datos:</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="flex flex-col justify-between h-full">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Nombre:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formData.nombres} {formData.apellido_paterno} {formData.apellido_materno}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">DNI:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formData.dni}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between h-full">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Usuario:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formData.username}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Proveedor:</span>
                    <p className="text-gray-900 dark:text-gray-100 text-xs">{formData.proveedor_nombre}</p>
                  </div>
                </div>
              </div>
            </div>
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
