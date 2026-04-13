import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { toast } from 'react-hot-toast';

export interface PlantillaDocumento {
  id: string;
  codigo: string;
  nombrePlantilla: string;
  plantillaUrl: string;
  formatosPermitidos?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface PlantillaDocumentoFiltros {
  nombrePlantilla?: string;
  codigo?: string;
  activo?: boolean;
  busqueda?: string;
}

export interface PlantillaDocumentoConnection {
  plantillasDocumento: PlantillaDocumento[];
  totalCount: number;
}

export interface PlantillaDocumentoInput {
  nombrePlantilla: string;
  plantillaUrl: string;
  formatosPermitidos?: string;
  activo: boolean;
}

const LISTAR_PLANTILLAS_DOCUMENTO = `
  query ListarPlantillasDocumento($limit: Int, $offset: Int, $filters: PlantillaDocumentoFiltros) {
    listarPlantillasDocumento(limit: $limit, offset: $offset, filters: $filters) {
      plantillasDocumento {
        id
        codigo
        nombrePlantilla
        plantillaUrl
        formatosPermitidos
        activo
        fechaCreacion
        fechaActualizacion
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
      nombrePlantilla
      plantillaUrl
      formatosPermitidos
      activo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

const CREAR_PLANTILLA_DOCUMENTO = `
  mutation CrearPlantillaDocumento($input: PlantillaDocumentoInput!) {
    crearPlantillaDocumento(input: $input) {
      id
      codigo
      nombrePlantilla
      plantillaUrl
      formatosPermitidos
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
      nombrePlantilla
      plantillaUrl
      formatosPermitidos
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
    staleTime: 1000 * 60 * 5,
  });

  const buscarPlantillas = async (searchTerm: string, limit: number = 20) => {
    try {
      const response = await graphqlRequest(LISTAR_PLANTILLAS_DOCUMENTO, {
        limit,
        offset: 0,
        filters: {
          ...filters,
          busqueda: searchTerm
        }
      });
      
      return response.listarPlantillasDocumento?.plantillasDocumento?.map((plantilla: PlantillaDocumento) => ({
        value: plantilla.id,
        label: `${plantilla.nombrePlantilla} (${plantilla.codigo})`
      })) || [];
    } catch (error) {
      console.error('Error buscando plantillas:', error);
      return [];
    }
  };

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
    buscarPlantillas,
    crearPlantillaDocumento: crearMutation.mutateAsync,
    actualizarPlantillaDocumento: actualizarMutation.mutateAsync,
    eliminarPlantillaDocumento: eliminarMutation.mutateAsync,
    isCreating: crearMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isDeleting: eliminarMutation.isPending,
  };
}

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
    staleTime: 1000 * 60 * 5,
  });
}
