import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { toast } from 'react-hot-toast';

// Types
export interface PlantillaDocumento {
  id: string;
  codigo: string;
  tipoDocumentoId: string;
  nombrePlantilla: string;
  plantillaUrl: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
  tipoDocumento?: {
    _id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
  };
}

export interface PlantillaDocumentoFiltros {
  tipoDocumentoId?: string;
  nombrePlantilla?: string;
  codigo?: string;
  activo?: boolean;
  busqueda?: string;
  tipoDocumento?: string;
}

export interface PlantillaDocumentoConnection {
  plantillasDocumento: PlantillaDocumento[];
  totalCount: number;
}

export interface PlantillaDocumentoInput {
  tipoDocumentoId: string;
  nombrePlantilla: string;
  plantillaUrl: string;
  activo: boolean;
}

// GraphQL Queries
const LISTAR_PLANTILLAS_DOCUMENTO = `
  query ListarPlantillasDocumento($limit: Int, $offset: Int, $filters: PlantillaDocumentoFiltros) {
    listarPlantillasDocumento(limit: $limit, offset: $offset, filters: $filters) {
      plantillasDocumento {
        id
        codigo
        tipoDocumentoId
        nombrePlantilla
        plantillaUrl
        activo
        fechaCreacion
        fechaActualizacion
        tipoDocumento {
          _id
          codigo
          nombre
          descripcion
        }
      }
      totalCount
    }
  }
`;

const OBTENER_PLANTILLA_DOCUMENTO = `
  query ObtenerPlantillaDocumento($id: ID!) {
    obtenerPlantillaDocumento(id: $id) {
      id
      codigo
      tipoDocumentoId
      nombrePlantilla
      plantillaUrl
      activo
      fechaCreacion
      fechaActualizacion
      tipoDocumento {
        _id
        codigo
        nombre
        descripcion
      }
    }
  }
`;

const CREAR_PLANTILLA_DOCUMENTO = `
  mutation CrearPlantillaDocumento($input: PlantillaDocumentoInput!) {
    crearPlantillaDocumento(input: $input) {
      id
      codigo
      tipoDocumentoId
      nombrePlantilla
      plantillaUrl
      activo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

const ACTUALIZAR_PLANTILLA_DOCUMENTO = `
  mutation ActualizarPlantillaDocumento($id: ID!, $input: PlantillaDocumentoInput!) {
    actualizarPlantillaDocumento(id: $id, input: $input) {
      id
      codigo
      tipoDocumentoId
      nombrePlantilla
      plantillaUrl
      activo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

const ELIMINAR_PLANTILLA_DOCUMENTO = `
  mutation EliminarPlantillaDocumento($id: ID!) {
    eliminarPlantillaDocumento(id: $id)
  }
`;

// Hook principal
export function usePlantillaDocumento(
  filters?: PlantillaDocumentoFiltros,
  limit?: number,
  offset?: number
) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['plantillas-documento', filters, limit, offset],
    queryFn: async () => {
      const response = await graphqlRequest(LISTAR_PLANTILLAS_DOCUMENTO, {
        limit,
        offset,
        filters
      });
      return response.listarPlantillasDocumento as PlantillaDocumentoConnection;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutación para crear
  const crearMutation = useMutation({
    mutationFn: async (input: PlantillaDocumentoInput) => {
      const response = await graphqlRequest(CREAR_PLANTILLA_DOCUMENTO, {
        input
      });
      return response.crearPlantillaDocumento as PlantillaDocumento;
    },
    onSuccess: () => {
      toast.success('Plantilla de documento creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['plantillas-documento'] });
      queryClient.invalidateQueries({ queryKey: ['plantilla-documento'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la plantilla de documento');
    },
  });

  // Mutación para actualizar
  const actualizarMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PlantillaDocumentoInput }) => {
      const response = await graphqlRequest(ACTUALIZAR_PLANTILLA_DOCUMENTO, {
        id,
        input
      });
      return response.actualizarPlantillaDocumento as PlantillaDocumento;
    },
    onSuccess: () => {
      toast.success('Plantilla de documento actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['plantillas-documento'] });
      queryClient.invalidateQueries({ queryKey: ['plantilla-documento'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar la plantilla de documento');
    },
  });

  // Mutación para eliminar
  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await graphqlRequest(ELIMINAR_PLANTILLA_DOCUMENTO, {
        id
      });
      return response.eliminarPlantillaDocumento as boolean;
    },
    onSuccess: () => {
      toast.success('Plantilla de documento eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['plantillas-documento'] });
      queryClient.invalidateQueries({ queryKey: ['plantilla-documento'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar la plantilla de documento');
    },
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    crearPlantillaDocumento: crearMutation.mutateAsync,
    actualizarPlantillaDocumento: actualizarMutation.mutateAsync,
    eliminarPlantillaDocumento: eliminarMutation.mutateAsync,
    isCreating: crearMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isDeleting: eliminarMutation.isPending,
  };
}

// Hook para obtener una plantilla específica
export function usePlantillaDocumentoPorId(id: string) {
  return useQuery({
    queryKey: ['plantilla-documento', id],
    queryFn: async () => {
      const response = await graphqlRequest(OBTENER_PLANTILLA_DOCUMENTO, {
        id
      });
      return response.obtenerPlantillaDocumento as PlantillaDocumento;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
