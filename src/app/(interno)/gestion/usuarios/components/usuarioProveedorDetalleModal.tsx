'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  useUsuarioProveedor,
  useCambiarContrasenaUsuarioProveedor,
} from '@/hooks'
import toast from 'react-hot-toast'
import { Users, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react'

const MIN_PASSWORD_LENGTH = 6

function badgeVariantEstado(estado: string) {
  const u = estado.toUpperCase()
  if (u === 'ACTIVO') return 'default' as const
  if (u === 'PENDIENTE') return 'secondary' as const
  if (u === 'BLOQUEADO') return 'destructive' as const
  return 'outline' as const
}

function formatearFecha(iso: string | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function CampoCompacto({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-none">
        {label}
      </div>
      <div className="mt-0.5 text-xs text-text-primary leading-snug break-words">{children}</div>
    </div>
  )
}

export interface UsuarioProveedorDetalleModalProps {
  isOpen: boolean
  onClose: () => void
  usuarioId: string | null
}

export default function UsuarioProveedorDetalleModal({
  isOpen,
  onClose,
  usuarioId,
}: UsuarioProveedorDetalleModalProps) {
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mostrarPasswords, setMostrarPasswords] = useState(false)

  const { data: usuario, isLoading, isError, error, refetch } = useUsuarioProveedor(
    usuarioId ?? '',
    { enabled: isOpen && !!usuarioId }
  )

  const cambiarContrasena = useCambiarContrasenaUsuarioProveedor()

  useEffect(() => {
    if (!isOpen) {
      setNuevaPassword('')
      setConfirmarPassword('')
      setMostrarPasswords(false)
    }
  }, [isOpen])

  const nombreCompleto = useMemo(() => {
    if (!usuario) return ''
    return [usuario.nombres, usuario.apellido_paterno, usuario.apellido_materno]
      .filter(Boolean)
      .join(' ')
  }, [usuario])

  const handleCambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioId) return

    const n = nuevaPassword.trim()
    const c = confirmarPassword.trim()

    if (n.length < MIN_PASSWORD_LENGTH) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
      return
    }
    if (n !== c) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      await cambiarContrasena.mutateAsync({ id: usuarioId, nuevaPassword: n })
      toast.success('Contraseña actualizada')
      setNuevaPassword('')
      setConfirmarPassword('')
      refetch()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Error al cambiar la contraseña'
      toast.error(msg)
    }
  }

  const inputType = mostrarPasswords ? 'text' : 'password'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-text-primary block truncate leading-tight">
              {isLoading ? 'Cargando…' : nombreCompleto || 'Usuario proveedor'}
            </span>
            {usuario?.dni ? (
              <span className="text-[11px] text-muted-foreground font-mono">DNI {usuario.dni}</span>
            ) : null}
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" className="text-xs h-7 px-3" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-text-secondary">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-[11px]">Cargando…</p>
          </div>
        ) : isError ? (
          <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-950/30 px-2 py-2 text-[11px] text-red-800 dark:text-red-200">
            {error instanceof Error ? error.message : 'No se pudo cargar el usuario'}
          </div>
        ) : usuario ? (
          <>
            <div className="rounded-md border border-border-color bg-muted/20 px-2.5 py-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <CampoCompacto label="DNI">
                  <span className="font-mono">{usuario.dni}</span>
                </CampoCompacto>
                <CampoCompacto label="Usuario">{usuario.username?.trim() || '—'}</CampoCompacto>
                <div className="col-span-2">
                  <CampoCompacto label="Nombre completo">{nombreCompleto || '—'}</CampoCompacto>
                </div>
                <div className="col-span-2">
                  <CampoCompacto label="Proveedor">
                    {usuario.proveedor_nombre?.trim() || '—'}
                  </CampoCompacto>
                </div>
                <CampoCompacto label="Estado">
                  <Badge variant={badgeVariantEstado(usuario.estado)} className="text-[10px] py-0 h-5">
                    {usuario.estado}
                  </Badge>
                </CampoCompacto>
                <CampoCompacto label="Alta">{formatearFecha(usuario.fecha_creacion)}</CampoCompacto>
                <div className="col-span-2 border-t border-border-color/60 pt-2 mt-0.5">
                  <CampoCompacto label="Última actualización">
                    {formatearFecha(usuario.fecha_actualizacion)}
                  </CampoCompacto>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleCambiarContrasena}
              className="rounded-md border border-border-color px-2.5 py-2 space-y-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <KeyRound className="w-3.5 h-3.5 text-primary shrink-0" />
                Nueva contraseña
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Mín. {MIN_PASSWORD_LENGTH} caracteres. Solo uso admin.
              </p>
              <div>
                <label className="sr-only" htmlFor="detalle-usuario-nueva-pw">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Input
                    id="detalle-usuario-nueva-pw"
                    type={inputType}
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    className="h-8 pr-9 text-xs border-border-color"
                    autoComplete="new-password"
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary p-0.5"
                    onClick={() => setMostrarPasswords((v) => !v)}
                    aria-label={mostrarPasswords ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                  >
                    {mostrarPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="sr-only" htmlFor="detalle-usuario-confirmar-pw">
                  Confirmar contraseña
                </label>
                <Input
                  id="detalle-usuario-confirmar-pw"
                  type={inputType}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="h-8 text-xs border-border-color"
                  autoComplete="new-password"
                  placeholder="Confirmar"
                />
              </div>
              <div className="flex justify-end pt-0.5">
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-7 px-3"
                  loading={cambiarContrasena.isPending}
                  disabled={cambiarContrasena.isPending}
                >
                  Guardar contraseña
                </Button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </Modal>
  )
}
