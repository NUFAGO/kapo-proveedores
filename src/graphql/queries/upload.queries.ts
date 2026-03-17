/**
 * Queries para SUBIDA DE ARCHIVOS
 */

export const OBTENER_UPLOAD_CONFIG_QUERY = `
  query ObtenerUploadConfig($tipo: String!) {
    obtenerUploadConfig(tipo: $tipo) {
      maxFileSize
      allowedTypes
      accept
    }
  }
`;
