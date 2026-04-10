import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import {
  GET_USUARIOS_PROVEEDOR_QUERY,
  GET_USUARIOS_PROVEEDOR_PAGINADO_QUERY,
  GET_USUARIO_PROVEEDOR_QUERY,
  GET_USUARIO_PROVEEDOR_BY_DNI_QUERY,
  GET_USUARIO_PROVEEDOR_BY_USERNAME_QUERY,
  GET_USUARIOS_PROVEEDOR_BY_PROVEEDOR_ID_QUERY,
  CREATE_USUARIO_PROVEEDOR_MUTATION,
  UPDATE_USUARIO_PROVEEDOR_MUTATION,
  DELETE_USUARIO_PROVEEDOR_MUTATION,
  CAMBIAR_ESTADO_USUARIO_PROVEEDOR_MUTATION,
  CAMBIAR_CONTRASENA_USUARIO_PROVEEDOR_MUTATION,
} from '@/graphql'

export interface UsuarioProveedor {
  id: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  dni: string
  username: string
  proveedor_id: string
  proveedor_nombre: string
  estado: 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO'
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface UsuarioProveedorInput {
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  dni: string
  username: string
  password: string
  proveedor_id: string
  proveedor_nombre: string
  estado?: 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO'
}

export interface UsuarioProveedorUpdateInput {
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string
  dni?: string
  username?: string
  password?: string
  proveedor_id?: string
  proveedor_nombre?: string
  estado?: 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO'
}

export interface UseUsuarioProveedorOptions {
  enabled?: boolean
}

export interface UseUsuarioProveedorReturn {
  usuarios: UsuarioProveedor[]
  loading: boolean
  error: any
  refetch: () => void
}

/**
 * Hook para obtener todos los usuarios proveedor
 */
export function useUsuariosProveedor(options: UseUsuarioProveedorOptions = {}): UseUsuarioProveedorReturn {
  const { enabled = true } = options

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['usuariosProveedor'],
    queryFn: async () => {
      const response = await graphqlRequest<{
        usuariosProveedor: UsuarioProveedor[]
      }>(GET_USUARIOS_PROVEEDOR_QUERY)

      return response.usuariosProveedor
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })

  return {
    usuarios: data || [],
    loading: isLoading,
    error,
    refetch
  }
}

export interface UsuarioProveedorPaginadoFilter {
  page?: number
  limit?: number
  searchTerm?: string
  estado?: UsuarioProveedor['estado']
  proveedor_id?: string
}

export interface UsuarioProveedorConnection {
  data: UsuarioProveedor[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Admin: listado paginado (recomendado frente a `useUsuariosProveedor` que trae todo).
 */
export function useUsuariosProveedorPaginado(
  filter: UsuarioProveedorPaginadoFilter,
  options: UseUsuarioProveedorOptions = {}
) {
  const { enabled = true } = options
  const page = filter.page ?? 1
  const limit = filter.limit ?? 10

  return useQuery({
    queryKey: [
      'usuariosProveedorPaginado',
      page,
      limit,
      filter.searchTerm ?? '',
      filter.estado ?? '',
      filter.proveedor_id ?? '',
    ],
    queryFn: async () => {
      const response = await graphqlRequest<{
        usuariosProveedorPaginado: UsuarioProveedorConnection
      }>(GET_USUARIOS_PROVEEDOR_PAGINADO_QUERY, {
        filter: {
          page,
          limit,
          ...(filter.searchTerm?.trim() ? { searchTerm: filter.searchTerm.trim() } : {}),
          ...(filter.estado ? { estado: filter.estado } : {}),
          ...(filter.proveedor_id?.trim() ? { proveedor_id: filter.proveedor_id.trim() } : {}),
        },
      })
      return response.usuariosProveedorPaginado
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook para obtener un usuario proveedor por ID
 */
export function useUsuarioProveedor(id: string, options: UseUsuarioProveedorOptions = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: ['usuarioProveedor', id],
    queryFn: async () => {
      const response = await graphqlRequest<{
        usuarioProveedor: UsuarioProveedor
      }>(GET_USUARIO_PROVEEDOR_QUERY, { id })

      return response.usuarioProveedor
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener un usuario proveedor por DNI
 */
export function useUsuarioProveedorByDni(dni: string, options: UseUsuarioProveedorOptions = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: ['usuarioProveedorByDni', dni],
    queryFn: async () => {
      const response = await graphqlRequest<{
        usuarioProveedorByDni: UsuarioProveedor
      }>(GET_USUARIO_PROVEEDOR_BY_DNI_QUERY, { dni })

      return response.usuarioProveedorByDni
    },
    enabled: enabled && !!dni,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener usuarios proveedor por proveedor ID
 */
export function useUsuariosProveedorByProveedorId(proveedor_id: string, options: UseUsuarioProveedorOptions = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: ['usuariosProveedorByProveedorId', proveedor_id],
    queryFn: async () => {
      const response = await graphqlRequest<{
        usuariosProveedorByProveedorId: UsuarioProveedor[]
      }>(GET_USUARIOS_PROVEEDOR_BY_PROVEEDOR_ID_QUERY, { proveedor_id })

      return response.usuariosProveedorByProveedorId
    },
    enabled: enabled && !!proveedor_id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para crear un usuario proveedor
 */
export function useCreateUsuarioProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UsuarioProveedorInput) => {
      const response = await graphqlRequest<{
        createUsuarioProveedor: UsuarioProveedor
      }>(CREATE_USUARIO_PROVEEDOR_MUTATION, { data })

      return response.createUsuarioProveedor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedor'] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorPaginado'] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorByProveedorId'] })
    },
  })
}

/**
 * Hook para actualizar un usuario proveedor
 */
export function useUpdateUsuarioProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UsuarioProveedorUpdateInput }) => {
      const response = await graphqlRequest<{
        updateUsuarioProveedor: UsuarioProveedor
      }>(UPDATE_USUARIO_PROVEEDOR_MUTATION, { id, data })

      return response.updateUsuarioProveedor
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedor'] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorPaginado'] })
      queryClient.invalidateQueries({ queryKey: ['usuarioProveedor', id] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorByProveedorId'] })
    },
  })
}

/**
 * Hook para eliminar un usuario proveedor
 */
export function useDeleteUsuarioProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await graphqlRequest<{
        deleteUsuarioProveedor: UsuarioProveedor
      }>(DELETE_USUARIO_PROVEEDOR_MUTATION, { id })

      return response.deleteUsuarioProveedor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedor'] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorPaginado'] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorByProveedorId'] })
    },
  })
}

/**
 * Hook para cambiar el estado de un usuario proveedor
 */
export function useCambiarEstadoUsuarioProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string, estado: 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO' }) => {
      const response = await graphqlRequest<{
        cambiarEstadoUsuarioProveedor: UsuarioProveedor
      }>(CAMBIAR_ESTADO_USUARIO_PROVEEDOR_MUTATION, { id, estado })

      return response.cambiarEstadoUsuarioProveedor
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedor'] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorPaginado'] })
      queryClient.invalidateQueries({ queryKey: ['usuarioProveedor', id] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorByProveedorId'] })
    },
  })
}

export function useCambiarContrasenaUsuarioProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, nuevaPassword }: { id: string; nuevaPassword: string }) => {
      const response = await graphqlRequest<{
        cambiarContrasenaUsuarioProveedor: UsuarioProveedor
      }>(CAMBIAR_CONTRASENA_USUARIO_PROVEEDOR_MUTATION, { id, nuevaPassword })

      return response.cambiarContrasenaUsuarioProveedor
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedor'] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorPaginado'] })
      queryClient.invalidateQueries({ queryKey: ['usuarioProveedor', id] })
      queryClient.invalidateQueries({ queryKey: ['usuariosProveedorByProveedorId'] })
    },
  })
}
