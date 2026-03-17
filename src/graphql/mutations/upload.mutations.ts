/**
 * Mutaciones para SUBIDA DE ARCHIVOS
 */

export const ELIMINAR_ARCHIVO_MUTATION = `
  mutation EliminarArchivo($url: String!) {
    eliminarArchivo(url: $url)
  }
`;

export const SUBIR_ARCHIVO_MUTATION = `
  mutation SubirArchivo($file: Upload!, $config: UploadConfigInput!) {
    subirArchivo(file: $file, config: $config) {
      url
      filename
      originalName
      size
      mimetype
    }
  }
`;

export const SUBIR_MULTIPLES_ARCHIVOS_MUTATION = `
  mutation SubirMultiplesArchivos($files: [Upload!]!, $config: UploadConfigInput!) {
    subirMultiplesArchivos(files: $files, config: $config) {
      successful {
        url
        filename
        originalName
        size
        mimetype
      }
      failed {
        filename
        error
      }
    }
  }
`;
