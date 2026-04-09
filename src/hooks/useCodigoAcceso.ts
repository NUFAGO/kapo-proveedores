import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  GENERAR_CODIGOS_COMPLETOS_MUTATION,
  VERIFICAR_CODIGO_ACCESO_QUERY,
  MARCAR_CODIGO_COMO_USADO_MUTATION,
  LISTAR_CODIGOS_ACCESO_QUERY,
  INVALIDAR_CODIGO_MUTATION
} from '@/graphql/queries/codigo-acceso.queries';

export interface CodigosGenerados {
  codigoProveedor: string;
  codigoAcceso: string;
  codigoVerificacion: string;
  codigoBD: {
    id: string;
    codigo: string;
    proveedorId: string;
    tipo: string;
    fechaExpiracion: string;
    activo: boolean;
  };
}

export interface VerificacionResponse {
  valido: boolean;
  proveedorId?: string;
  proveedor?: {
    id: string;
    ruc: string;
    razon_social: string;
    nombre_comercial?: string;
    estado: string;
    correo?: string;
    telefono?: string;
  };
  error?: string;
  tipo?: string;
}

export interface CodigoAcceso {
  id: string;
  codigo: string;
  proveedorId: string;
  proveedorRuc: string;
  proveedorNombre?: string;
  tipo: 'registro' | 'cambio' | 'recuperacion';
  fechaGeneracion: string | number; // Puede ser timestamp
  fechaExpiracion: string | number; // Puede ser timestamp
  usado: boolean;
  fechaUso?: string | number | null;
  creadoPor?: string;
  motivoInvalidacion?: string;
  activo: boolean;
}

export interface CodigosAccesoResponse {
  codigos: CodigoAcceso[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Hook para generar códigos completos
export function useGenerarCodigos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      proveedorId: string;
      proveedorRuc: string;
      proveedorNombre?: string;
      creadoPor?: string;
      diasValidez?: number;
    }) => {
      const response = await graphqlRequest<
        { generarCodigosCompletos: CodigosGenerados }
      >(GENERAR_CODIGOS_COMPLETOS_MUTATION, variables);
      
      return response.generarCodigosCompletos;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['codigosAcceso'] });
    },
    onError: (error) => {
      console.error('Error al generar códigos:', error);
    }
  });
}

// Hook para verificar código
export function useVerificarCodigo(codigo: string) {
  return useQuery({
    queryKey: ['verificarCodigo', codigo],
    queryFn: async () => {
      const response = await graphqlRequest<
        { verificarCodigoAcceso: VerificacionResponse }
      >(VERIFICAR_CODIGO_ACCESO_QUERY, { codigo });
      
      return response.verificarCodigoAcceso;
    },
    enabled: !!codigo,
    retry: false,
    staleTime: 0
  });
}

// Hook para marcar código como usado
export function useMarcarCodigoComoUsado() {
  return useMutation({
    mutationFn: async (variables: {
      codigo: string;
    }) => {
      const response = await graphqlRequest<
        { marcarCodigoComoUsado: boolean }
      >(MARCAR_CODIGO_COMO_USADO_MUTATION, variables);
      
      return response.marcarCodigoComoUsado;
    },
    onError: (error) => {
      console.error('Error al marcar código como usado:', error);
    }
  });
}

// Hook para listar códigos
export function useCodigosAcceso(
  filtros?: {
    proveedorId?: string;
    tipo?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ['codigosAcceso', filtros],
    queryFn: async () => {
      const response = await graphqlRequest<
        { codigosAcceso: CodigosAccesoResponse }
      >(LISTAR_CODIGOS_ACCESO_QUERY, { filtros });
      
      return response.codigosAcceso;
    },
    staleTime: 1000 * 60 * 5 // 5 minutos
  });
}

// Hook para invalidar código
export function useInvalidarCodigo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      codigo: string;
      motivo: string;
    }) => {
      const response = await graphqlRequest<
        { invalidarCodigo: boolean }
      >(INVALIDAR_CODIGO_MUTATION, variables);
      
      return response.invalidarCodigo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codigosAcceso'] });
    },
    onError: (error) => {
      console.error('Error al invalidar código:', error);
    }
  });
}

// Hook para acceso automático (combinar verificación + marcado como usado)
export function useAccesoConCodigo() {
  const queryClient = useQueryClient();

  const accederConCodigo = async (codigo: string) => {
    try {
      // 1. Verificar código
      const verificacion = await graphqlRequest<
        { verificarCodigoAcceso: VerificacionResponse }
      >(VERIFICAR_CODIGO_ACCESO_QUERY, { codigo });

      if (!verificacion.verificarCodigoAcceso.valido) {
        throw new Error(verificacion.verificarCodigoAcceso.error || 'Código inválido');
      }

      // 2. Marcar como usado
      await graphqlRequest<
        { marcarCodigoComoUsado: boolean }
      >(MARCAR_CODIGO_COMO_USADO_MUTATION, { codigo });

      // 3. Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['codigosAcceso'] });

      // 4. Retornar datos del proveedor
      return {
        exito: true,
        proveedor: verificacion.verificarCodigoAcceso.proveedor,
        tipo: verificacion.verificarCodigoAcceso.tipo
      };

    } catch (error) {
      console.error('Error en acceso con código:', error);
      throw error;
    }
  };

  return {
    accederConCodigo
  };
}
