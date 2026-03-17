import React, { useCallback, useState } from 'react';
import { useUpload } from '@/hooks/useUpload';
import { Button } from './button';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onUpload: (result: any) => void;
  config: {
    tipo: string;
    maxFileSize?: number;
    allowedTypes?: string[];
    multiple?: boolean;
    accept?: string;
  };
  disabled?: boolean;
  className?: string;
}

export function FileUpload({ 
  onUpload, 
  config, 
  disabled = false, 
  className = '' 
}: FileUploadProps) {
  const { uploadFile, uploadMultipleFiles, validateFile, isUploading } = useUpload();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    // Validar cada archivo
    for (const file of filesArray) {
      const error = validateFile(file, {
        maxFileSize: config.maxFileSize || 10 * 1024 * 1024,
        allowedTypes: config.allowedTypes || [],
        accept: config.accept || '*'
      });

      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);
    setFiles(prev => config.multiple ? [...prev, ...validFiles] : validFiles);

    // Subir archivos automáticamente
    try {
      if (config.multiple && validFiles.length > 1) {
        const result = await uploadMultipleFiles(validFiles, config);
        onUpload(result);
      } else {
        const result = await uploadFile(validFiles[0], config);
        onUpload(result);
      }
    } catch (error) {
      console.error('Error al subir archivos:', error);
      setErrors(prev => [...prev, 'Error al subir archivos']);
    }
  }, [config, validateFile, uploadFile, uploadMultipleFiles, onUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de drag and drop */}
      <div 
        className={`border-2 border-dashed rounded-lg transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={disabled ? undefined : handleDrag}
        onDragLeave={disabled ? undefined : handleDrag}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
        onClick={disabled ? undefined : openFileDialog}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isUploading ? 'Subiendo archivo...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
          </p>
          <p className="text-sm text-gray-500">
            {config.accept && `Formatos aceptados: ${config.accept}`}
            {config.maxFileSize && ` • Máximo: ${formatFileSize(config.maxFileSize)}`}
          </p>
          {!disabled && (
            <Button type="button" variant="outline" className="mt-4" disabled={isUploading}>
              Seleccionar archivos
            </Button>
          )}
        </div>
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={config.multiple}
        accept={config.accept}
        onChange={handleChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Archivos seleccionados:</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-2">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errores */}
      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Errores:</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Progreso */}
      {isUploading && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <span className="text-sm text-gray-500">Subiendo...</span>
          </div>
        </div>
      )}
    </div>
  );
}
