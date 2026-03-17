import { useCallback, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  SUBIR_ARCHIVO_MUTATION,
  SUBIR_MULTIPLES_ARCHIVOS_MUTATION,
  ELIMINAR_ARCHIVO_MUTATION,
  OBTENER_UPLOAD_CONFIG_QUERY
} from '@/graphql';
import { UPLOAD_CONFIGS } from '@/types/upload.types';

export interface UploadConfig {
  tipo: string;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export interface FileUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface BatchUploadResult {
  successful: FileUploadResult[];
  failed: Array<{
    filename: string;
    error: string;
  }>;
}

export interface UploadConfigResponse {
  maxFileSize: number;
  allowedTypes: string[];
  accept: string;
}

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Query para obtener configuración de subida
  const { data: configData, isFetching: configLoading } = useQuery({
    queryKey: ['uploadConfig'],
    queryFn: () => graphqlRequest(OBTENER_UPLOAD_CONFIG_QUERY, { tipo: 'DOCUMENTOS_PROVEEDOR' }),
    enabled: false, // No ejecutar automáticamente
  });

  // Mutación para subir un archivo
  const subirArchivoMutation = useMutation({
    mutationFn: (variables: { file: File; config: UploadConfig }) =>
      graphqlRequest(SUBIR_ARCHIVO_MUTATION, variables)
  });

  // Mutación para subir múltiples archivos
  const subirMultiplesArchivosMutation = useMutation({
    mutationFn: (variables: { files: File[]; config: UploadConfig }) =>
      graphqlRequest(SUBIR_MULTIPLES_ARCHIVOS_MUTATION, variables)
  });

  // Mutación para eliminar un archivo
  const eliminarArchivoMutation = useMutation({
    mutationFn: (variables: { url: string }) =>
      graphqlRequest(ELIMINAR_ARCHIVO_MUTATION, variables)
  });

  // Obtener configuración de subida para un tipo específico
  const getUploadConfig = useCallback(async (tipo: string): Promise<UploadConfigResponse> => {
    try {
      const result = await graphqlRequest(OBTENER_UPLOAD_CONFIG_QUERY, { tipo });
      return result.obtenerUploadConfig;
    } catch (error) {
      console.warn('Error al obtener configuración del servidor, usando configuración local:', error);
      const config = UPLOAD_CONFIGS[tipo as keyof typeof UPLOAD_CONFIGS];
      return {
        maxFileSize: config.maxFileSize,
        allowedTypes: [...config.allowedTypes],
        accept: config.accept
      };
    }
  }, []);

  // Subir un archivo individual
  const uploadFile = useCallback(async (
    file: File,
    config: UploadConfig
  ): Promise<FileUploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Crear FormData para el archivo
      const formData = new FormData();

      // 1. Primero agregar operations
      formData.append('operations', JSON.stringify({
        query: SUBIR_ARCHIVO_MUTATION,
        variables: {
          file: null,
          config: {
            tipo: config.tipo,
            ...(config.maxFileSize && { maxFileSize: config.maxFileSize }),
            ...(config.allowedTypes && { allowedTypes: config.allowedTypes })
          }
        }
      }));

      // 2. Segundo agregar map
      formData.append('map', JSON.stringify({ '0': ['variables.file'] }));

      // 3. Tercero agregar el archivo (después de map)
      formData.append('0', file);

      // Hacer la petición fetch directamente para soportar multipart/form-data
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8082/graphql', {
        method: 'POST',
        body: formData,
        headers: {
          // No Content-Type, el navegador lo establece automáticamente para FormData
        }
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Error al subir archivo');
      }

      const uploadResult = result.data.subirArchivo;
      setProgress(100);
      return uploadResult;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  // Subir múltiples archivos
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    config: UploadConfig
  ): Promise<BatchUploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Crear FormData para múltiples archivos
      const formData = new FormData();
      const filesMap: { [key: string]: string[] } = {};

      // Preparar el mapa de archivos
      files.forEach((file, index) => {
        filesMap[index.toString()] = [`variables.files.${index}`];
      });

      // 1. Primero agregar operations
      formData.append('operations', JSON.stringify({
        query: SUBIR_MULTIPLES_ARCHIVOS_MUTATION,
        variables: {
          files: new Array(files.length).fill(null),
          config: {
            tipo: config.tipo,
            ...(config.maxFileSize && { maxFileSize: config.maxFileSize }),
            ...(config.allowedTypes && { allowedTypes: config.allowedTypes })
          }
        }
      }));

      // 2. Segundo agregar map
      formData.append('map', JSON.stringify(filesMap));

      // 3. Tercero agregar los archivos (después de map)
      files.forEach((file, index) => {
        formData.append(index.toString(), file);
      });

      // Hacer la petición fetch
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8082/graphql', {
        method: 'POST',
        body: formData,
        headers: {
          // No Content-Type, el navegador lo establece automáticamente para FormData
        }
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Error al subir archivos');
      }

      const uploadResult = result.data.subirMultiplesArchivos;
      setProgress(100);
      return uploadResult;
    } catch (error) {
      console.error('Error al subir múltiples archivos:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  // Eliminar un archivo
  const deleteFile = useCallback(async (url: string): Promise<boolean> => {
    try {
      const result = await eliminarArchivoMutation.mutateAsync({ url });
      return result.eliminarArchivo;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw error;
    }
  }, [eliminarArchivoMutation]);

  // Validar archivo antes de subir
  const validateFile = useCallback((file: File, config: UploadConfigResponse): string | null => {
    // Validar tamaño
    if (file.size > config.maxFileSize) {
      const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
      return `El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`;
    }

    // Validar tipo
    if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${config.allowedTypes.join(', ')}`;
    }

    return null;
  }, []);

  return {
    // Estado
    isUploading,
    progress,
    configLoading,

    // Métodos
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getUploadConfig,
    validateFile
  };
};
