'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlantillaDocumento, usePlantillaDocumentoPorId, type PlantillaDocumentoInput } from '@/hooks/usePlantillaDocumento';
import { Button, Input, Select, FormatosSelector } from '@/components/ui';
import { useUpload } from '@/hooks/useUpload';
import Modal from '@/components/ui/modal';
import { FileText, Edit, CheckCircle, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlantillaDocumentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  plantillaDocumentoId?: string; // Si se proporciona, es modo edición
}

// Interfaz local para el formulario
interface PlantillaDocumentoFormData {
  nombrePlantilla: string;
  archivos: File[];
  plantillaUrl: string;
  formatosPermitidos: string;
  activo: boolean;
}

export default function PlantillaDocumentoForm({ isOpen, onClose, plantillaDocumentoId }: PlantillaDocumentoFormProps) {
  const [formData, setFormData] = useState<PlantillaDocumentoFormData>({
    nombrePlantilla: '',
    archivos: [],
    plantillaUrl: '',
    formatosPermitidos: '',
    activo: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<PlantillaDocumentoFormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!plantillaDocumentoId;
  
  // Hooks para mutaciones
  const { crearPlantillaDocumento, actualizarPlantillaDocumento, isCreating, isUpdating } = usePlantillaDocumento();
  const { data: plantillaData, isLoading: isLoadingPlantilla } = usePlantillaDocumentoPorId(plantillaDocumentoId || '');
  const { uploadMultipleFiles, deleteFile, isUploading } = useUpload();

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombrePlantilla: '',
      archivos: [],
      plantillaUrl: '',
      formatosPermitidos: '',
      activo: true
    });
    setErrors({});
    setOriginalData(null);
    setHasChanges(false);
  };

  // Cargar datos en modo edición
  useEffect(() => {
    if (isEditMode && plantillaData && !isLoadingPlantilla) {
      const loadedData = {
        nombrePlantilla: plantillaData.nombrePlantilla,
        archivos: [],
        plantillaUrl: plantillaData.plantillaUrl || '',
        formatosPermitidos: plantillaData.formatosPermitidos || '',
        activo: plantillaData.activo
      };
      
      setFormData(loadedData);
      setOriginalData(loadedData);
      setHasChanges(false);
    }
  }, [isEditMode, plantillaData, isLoadingPlantilla]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (originalData && isEditMode) {
      const hasAnyChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(hasAnyChanges);
    } else {
      setHasChanges(false);
    }
  }, [formData, originalData, isEditMode]);

  // Resetear cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombrePlantilla.trim()) {
      newErrors.nombrePlantilla = 'El nombre de la plantilla es requerido';
    } else if (formData.nombrePlantilla.length < 3) {
      newErrors.nombrePlantilla = 'El nombre debe tener al menos 3 caracteres';
    }

    const totalFiles = formData.plantillaUrl ? 1 : 0 + formData.archivos.length;
    if (totalFiles === 0) {
      newErrors.plantillaUrl = 'Debe subir al menos un archivo de plantilla';
    } else if (totalFiles > 1) {
      newErrors.plantillaUrl = 'Solo se permite un archivo de plantilla';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof PlantillaDocumentoFormData, value: string | boolean | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Función para manejar cambios en archivos
  const handleFileChange = (files: File[]) => {
    setFormData(prev => ({ ...prev, archivos: files }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let plantillaUrl: string = formData.plantillaUrl;
      
      // Subir archivos nuevos si hay
      if (formData.archivos.length > 0) {
        const resultado = await uploadMultipleFiles(formData.archivos, { 
          tipo: 'PLANTILLAS_DOCUMENTO',
          allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png'
          ]
        });
        
        if (resultado.successful.length > 0) {
          plantillaUrl = resultado.successful[0].url;
        }
        
        if (resultado.failed.length > 0) {
          toast.error(`Error al subir ${resultado.failed.length} archivo(s)`);
          return;
        }
      }

      const submitData: PlantillaDocumentoInput = {
        nombrePlantilla: formData.nombrePlantilla.trim(),
        plantillaUrl: plantillaUrl,
        formatosPermitidos: formData.formatosPermitidos || undefined,
        activo: formData.activo
      };

      if (isEditMode && plantillaDocumentoId) {
        // Delete old file if it exists and is different
        if (originalData?.plantillaUrl && originalData.plantillaUrl !== plantillaUrl) {
          try {
            await deleteFile(originalData.plantillaUrl);
          } catch (error) {
            console.error('Error deleting old file:', originalData.plantillaUrl, error);
            // Continue with update even if delete fails
          }
        }

        await actualizarPlantillaDocumento({ id: plantillaDocumentoId, input: submitData });
      } else {
        await crearPlantillaDocumento(submitData);
      }

      setOriginalData(formData);
      setHasChanges(false);
      onClose();
    } catch (error: any) {
      console.error('Error saving plantilla:', error);
      toast.error(error.message || 'Error al guardar la plantilla');
    }
  };

  // Helper function to extract filename from URL
  const getFileNameFromUrl = (url: string): string => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.includes('?') ? fileName.split('?')[0] : fileName;
  };

  // ─── File Upload Component ───────────────────────────────────────────────
  const FileUploadComponent = ({ showUpload = true }: { showUpload?: boolean }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const maxFiles = 1;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) return `El archivo "${file.name}" supera el límite de 10MB`;
      if (!allowedTypes.includes(file.type)) return `Archivo no permitido. Formatos válidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG`;
      return null;
    };

    const processFiles = (fileList: FileList | null) => {
      if (!fileList) return;
      const newFiles: File[] = [];
      const errors: string[] = [];
      
      Array.from(fileList).forEach(file => {
        if (formData.plantillaUrl || formData.archivos.length > 0) { 
          if (!errors.includes('Solo se permite un archivo')) errors.push('Solo se permite un archivo'); 
          return 
        }
        
        const validationError = validateFile(file);
        if (validationError) { errors.push(validationError); return }
        newFiles.push(file);
      });
      
      if (errors.length > 0) toast.error(errors.join('\n'));
      if (newFiles.length > 0) handleFileChange([...formData.archivos, ...newFiles]);
    };

    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); processFiles(e.dataTransfer.files) };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) };

    const removeFile = (index: number) => handleFileChange(formData.archivos.filter((_, i) => i !== index));
    const removeExistingFile = () => setFormData(prev => ({ ...prev, plantillaUrl: '' }));

    const totalUsed = formData.plantillaUrl ? 1 : 0 + formData.archivos.length;

    return (
      <div className="space-y-2">
        {showUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              multiple={false}
              onChange={(e) => processFiles(e.target.files)}
              className="hidden"
            />

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer
                transition-all duration-200
                ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
                ${totalUsed >= maxFiles ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <FileText className={`w-4 h-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">
                  {totalUsed >= maxFiles ? 'Límite de archivos alcanzado' : 'Seleccionar archivo de plantilla'}
                </p>
                <p className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX · máx. 10MB · {totalUsed}/{maxFiles}</p>
              </div>
              {totalUsed > 0 && (
                <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
                  {totalUsed} archivo{totalUsed !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </>
        )}

        {/* Archivo existente (URL) */}
        {formData.plantillaUrl && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="w-6 h-6 rounded flex items-center justify-center bg-green-600 shrink-0">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <a href={formData.plantillaUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-xs truncate hover:text-blue-600 hover:underline" style={{ color: 'var(--text-primary)' }}>
              {getFileNameFromUrl(formData.plantillaUrl)}
            </a>
            <button type="button" onClick={removeExistingFile}
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Mensaje cuando no hay archivos */}
        {!formData.plantillaUrl && !showUpload && (
          <p className="text-xs text-gray-400">No hay archivo de plantilla</p>
        )}

        {/* Archivos nuevos (Files) */}
        {formData.archivos.map((file, index) => (
          <div key={`new-${index}`} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-600 shrink-0">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
            <span className="shrink-0 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {(file.size / 1024 / 1024).toFixed(1)}MB
            </span>
            <button type="button" onClick={() => removeFile(index)}
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  const isLoading = isCreating || isUpdating || (isEditMode && isLoadingPlantilla) || isUploading;

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
      >
        {isEditMode ? (
          <Edit className="w-5 h-5" style={{ color: '#22c55e' }} />
        ) : (
          <FileText className="w-5 h-5" style={{ color: '#22c55e' }} />
        )}
      </div>
      <div>
        <h2 className="text-sm font-bold text-left w-full" style={{ color: 'var(--text-on-content-bg-heading)' }}>
          {isEditMode ? 'Editar Plantilla de Documento' : 'Crear Plantilla de Documento'}
        </h2>
        <p className="text-xs text-left w-full" style={{ color: 'var(--text-secondary)' }}>
          {isEditMode ? 'Modifica los datos de la plantilla de documento' : 'Registra una nueva plantilla de documento para los proveedores'}
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
        {/* Nombre de la Plantilla */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Nombre de la Plantilla{errors.nombrePlantilla && <span className="text-red-500">*</span>}
          </label>
          <Input
            type="text"
            value={formData.nombrePlantilla}
            onChange={(e) => handleInputChange('nombrePlantilla', e.target.value)}
            placeholder="Ej: Plantilla Valorización v2"
            disabled={isLoading}
            className={errors.nombrePlantilla ? 'border-red-400' : ''}
          />
          {errors.nombrePlantilla && (
            <p className="mt-1 text-xs text-red-400">{errors.nombrePlantilla}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formData.nombrePlantilla.length}/100 caracteres
          </p>
        </div>

        {/* Archivo de Plantilla - Usando FileUploadComponent */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Archivo de Plantilla{errors.plantillaUrl && <span className="text-red-500">*</span>}
          </label>
          
          <FileUploadComponent showUpload={!formData.plantillaUrl} />
          
          {errors.plantillaUrl && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              {errors.plantillaUrl}
            </p>
          )}
        </div>

        {/* Formatos Permitidos */}
        <div>
          <FormatosSelector
            value={formData.formatosPermitidos}
            onChange={(value) => handleInputChange('formatosPermitidos', value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Estado
          </label>
          <Select
            value={formData.activo ? 'activo' : 'inactivo'}
            onChange={(value) => handleInputChange('activo', value === 'activo')}
            options={[
              { value: 'activo', label: 'Activa' },
              { value: 'inactivo', label: 'Inactiva' }
            ]}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
}
