'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  File,
  FormInput,
  Upload,
  X,
  FileInput,
  PencilLine,
  Info,
  ChevronDown,
  ChevronRight,
  History,
  Link2,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import {
  Requisito,
  TipoPagoOC,
  DocumentoOC,
} from '@/hooks/useExpedientePago'
import {
  useReportesSolicitudPagoPorProveedorInfinite,
  type ReporteSolicitudPagoRow,
} from '@/hooks/useReporteSolicitudPago'
import { useAuthProveedor } from '@/context/auth-proveedor-context'
import toast from 'react-hot-toast'
import {
  validateChecklistSubmission,
  validateChecklistSubsanacionParcial,
  buildChecklistBatchSolicitud,
  buildChecklistBatchDocumentoOC,
  buildChecklistSubsanacion,
  collectChecklistFilesUploadQueue,
  requisitosArchivosDesdeUploads,
  logChecklistBatchInput,
  logChecklistSubsanacionInput,
  etiquetaRequisito,
  type ChecklistProveedorBatchInput,
  type ChecklistProveedorSubsanacionInput,
} from './checklistPayload'
import { useUpload } from '@/hooks/useUpload'
import NotificationModal from '@/components/ui/notification-modal'
import {
  useAprobacionYDetalleChecklistPorEntidad,
  type EntidadAprobacionRef,
} from '@/hooks/useAprobacionYDetalleChecklistPorEntidad'
import type { DocumentoSubidoRevisionGql } from '@/hooks/useDetalleChecklistRevisionAprobacion'
import { cn } from '@/lib/utils'

interface ChecklistModalProps {
  isOpen: boolean
  onClose: () => void
  expedienteId: string
  /**
   * Detalle/subsanar: una sola query `aprobacionRevisionPorEntidad` vía
   * `useAprobacionYDetalleChecklistPorEntidad` (aprobación + documentos subidos).
   */
  entidadAprobacion?: EntidadAprobacionRef | null
  /** Saldo disponible del expediente; limita el monto en solicitud de pago. */
  montoDisponible?: number
  tiposPago: TipoPagoOC[]
  documentos: DocumentoOC[]
  selectedTipoPagoId?: string // ID del tipo de pago seleccionado
  selectedDocumentoId?: string // ID del documento OC seleccionado
  onFileUpload?: (requisitoId: string, file: File) => void
  onFormSubmit?: (requisitoId: string, formData: any) => void
  /** Envío al backend (`procesarChecklistProveedor`). Si resuelve sin error, el modal se cierra. */
  onPayloadReady?: (input: ChecklistProveedorBatchInput) => void | Promise<void>
  /** Subsanación (`procesarChecklistSubsanacion`): misma sesión; solo requisitos con archivos nuevos. */
  onSubsanacionReady?: (input: ChecklistProveedorSubsanacionInput) => void | Promise<void>
  onSubmitSolicitud?: (monto: number) => void
}

const MONTO_TOPE_EPS = 0.005

const ESTADO_ENTREGA_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  OBSERVADO: 'Observado',
  RECHAZADO: 'Rechazado',
}

/** Misma regla que `AprobacionChecklistRevisionModal`: última versión por requisito + desempate por fecha. */
function groupDocsByRequisitoProveedor(docs: DocumentoSubidoRevisionGql[]) {
  const map = new Map<string, DocumentoSubidoRevisionGql[]>()
  for (const d of docs) {
    const rid = d.requisitoDocumentoId?.trim()
    if (!rid) continue
    const arr = map.get(rid) ?? []
    arr.push(d)
    map.set(rid, arr)
  }
  return map
}

function parseFechaSubidaMsProveedor(iso: string): number {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : 0
}

function pickUltimaEntregaDelGrupoProveedor(docs: DocumentoSubidoRevisionGql[]): DocumentoSubidoRevisionGql {
  if (docs.length === 0) {
    throw new Error('pickUltimaEntregaDelGrupoProveedor: lista vacía')
  }
  return docs.reduce((a, b) => {
    if (b.version !== a.version) return b.version > a.version ? b : a
    const tb = parseFechaSubidaMsProveedor(b.fechaSubida)
    const ta = parseFechaSubidaMsProveedor(a.fechaSubida)
    return tb >= ta ? b : a
  })
}

function ordenEntregasMasRecientePrimeroProveedor(
  a: DocumentoSubidoRevisionGql,
  b: DocumentoSubidoRevisionGql
): number {
  if (b.version !== a.version) return b.version - a.version
  return parseFechaSubidaMsProveedor(b.fechaSubida) - parseFechaSubidaMsProveedor(a.fechaSubida)
}

function badgeVariantEstadoDocProveedor(estado: string) {
  const u = estado.toUpperCase()
  if (u === 'APROBADO') return 'default' as const
  if (u === 'OBSERVADO') return 'secondary' as const
  if (u === 'RECHAZADO') return 'destructive' as const
  return 'outline' as const
}

function ProveedorFilaEntregaDoc({
  doc,
  modo,
}: {
  doc: DocumentoSubidoRevisionGql
  modo: 'vigente' | 'historial'
}) {
  return (
    <div
      className={cn(
        'rounded-md border p-3 space-y-2',
        modo === 'historial' ? 'bg-muted/5 border-dashed' : 'bg-background/50'
      )}
    >
      <div className="flex flex-wrap items-center ">
        {modo === 'historial' ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Versión anterior
          </span>
        ) : null}
      </div>
      {doc.archivos?.length ? (
        <ul className="">
          {doc.archivos.map((a, i) => (
            <li key={`${a.url}-${i}`}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
              >
                <Link2 className="h-3 w-3 shrink-0" />
                {a.nombreOriginal}
              </a>
              <span className="ml-2 text-[10px] text-muted-foreground">
                {(a.tamanioBytes / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Sin archivos en la entrega.</p>
      )}
      {doc.comentariosRevision?.trim() ? (
        <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-900 dark:text-amber-100">
          {modo === 'vigente' ? (
            <>
              <span className="font-medium text-muted-foreground">Comentario del revisor: </span>
              {doc.comentariosRevision}
            </>
          ) : (
            <>Comentario previo: {doc.comentariosRevision}</>
          )}
        </p>
      ) : null}
    </div>
  )
}

function RequisitoEntregasRevisionProveedor({
  entregasGrupo,
}: {
  entregasGrupo: DocumentoSubidoRevisionGql[]
}) {
  const [historialAbierto, setHistorialAbierto] = useState(false)

  if (entregasGrupo.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin entrega registrada para este requisito.</p>
  }

  const entregaActual = pickUltimaEntregaDelGrupoProveedor(entregasGrupo)
  const entregasAnteriores = entregasGrupo
    .filter((d) => d.id !== entregaActual.id)
    .sort(ordenEntregasMasRecientePrimeroProveedor)

  return (
    <div className="space-y-3">
      <ProveedorFilaEntregaDoc doc={entregaActual} modo="vigente" />

      {entregasAnteriores.length > 0 ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 w-full gap-2 text-xs text-muted-foreground sm:w-auto"
            aria-expanded={historialAbierto}
            onClick={() => setHistorialAbierto((v) => !v)}
          >
            {historialAbierto ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <History className="h-3 w-3 shrink-0" aria-hidden />
          </Button>
          {historialAbierto ? (
            <ul className="space-y-3 border-l-2 border-dashed border-border pl-3 list-none">
              {entregasAnteriores.map((doc) => (
                <li key={doc.id}>
                  <ProveedorFilaEntregaDoc doc={doc} modo="historial" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

type ProveedorChecklistModo = 'creacion' | 'lectura' | 'edicion' | 'pendiente'

/** Placeholder mientras carga `aprobacionRevisionPorEntidad` (solo cuando hay `entidadAprobacion`). */
function ChecklistModalRevisionSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Cargando datos de revisión"
    >
      <div className="rounded-lg border border-border-color/60 bg-muted/15 p-4 space-y-3">
        <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
        <div className="h-3 w-full rounded-md bg-muted/80 animate-pulse" />
        <div className="h-3 w-5/6 rounded-md bg-muted/80 animate-pulse" />
      </div>
      <div className="rounded-lg bg-muted/20 p-3 space-y-2">
        <div className="h-3 w-36 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-full rounded-md bg-muted/70 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-28 rounded-md bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border-color/50 p-4 space-y-3 bg-card/50"
          >
            <div className="h-4 w-1/2 rounded-md bg-muted animate-pulse" />
            <div className="h-14 w-full rounded-md bg-muted/50 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

function toastErroresChecklist(errors: string[]) {
  if (errors.length === 0) return
  const duration = Math.min(14_000, 5000 + errors.length * 1200)
  toast.error(
    (t) => (
      <div
        className="flex flex-col gap-1 min-w-0 max-w-[min(100vw-2rem,22rem)]"
        onClick={() => toast.dismiss(t.id)}
        role="alert"
      >
        <span className="font-semibold">
          {errors.length === 1 ? errors[0] : 'Corrige lo siguiente:'}
        </span>
        {errors.length > 1 && (
          <ul className="mt-1 list-disc pl-4 text-sm leading-snug space-y-1 opacity-95">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    ),
    { duration }
  )
}

export function ChecklistModal({ 
  isOpen, 
  onClose,
  expedienteId,
  entidadAprobacion = null,
  montoDisponible,
  tiposPago, 
  documentos,
  selectedTipoPagoId,
  selectedDocumentoId,
  onFileUpload,
  onFormSubmit,
  onPayloadReady,
  onSubsanacionReady,
  onSubmitSolicitud
}: ChecklistModalProps) {
  const { user: proveedorUser } = useAuthProveedor()
  const revisionData = useAprobacionYDetalleChecklistPorEntidad(
    entidadAprobacion ?? null,
    isOpen && Boolean(entidadAprobacion?.entidadId && entidadAprobacion?.entidadTipo)
  )
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File[]>>(new Map())
  const [montoSolicitud, setMontoSolicitud] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { uploadMultipleFiles, isUploading } = useUpload()
  const [confirmEnvioOpen, setConfirmEnvioOpen] = useState(false)
  const [pendingEnvio, setPendingEnvio] = useState<
    | { kind: 'creacion'; input: ChecklistProveedorBatchInput }
    | { kind: 'subsanacion'; input: ChecklistProveedorSubsanacionInput }
    | null
  >(null)
  const [reportesPickerOpen, setReportesPickerOpen] = useState(false)
  const [selectedReporteIds, setSelectedReporteIds] = useState<Set<string>>(
    () => new Set()
  )
  const scrollReportesRef = useRef<HTMLDivElement>(null)
  const reportesLoadMoreRef = useRef<HTMLDivElement>(null)
  const montoEdicionSembradoRef = useRef(false)

  const proveedorIdReportes = proveedorUser?.proveedor_id?.trim() ?? ''

  const reportesInfinite = useReportesSolicitudPagoPorProveedorInfinite(
    proveedorIdReportes,
    {
      enabled:
        isOpen &&
        Boolean(selectedTipoPagoId) &&
        reportesPickerOpen &&
        Boolean(proveedorIdReportes),
      filter: { vinculado: false },
    }
  )

  const reportesListaPlana = useMemo((): ReporteSolicitudPagoRow[] => {
    const pages = reportesInfinite.data?.pages
    if (!pages?.length) return []
    const byId = new Map<string, ReporteSolicitudPagoRow>()
    for (const p of pages) {
      for (const r of p.data) {
        byId.set(r.id, r)
      }
    }
    return [...byId.values()]
  }, [reportesInfinite.data])

  useEffect(() => {
    if (!reportesPickerOpen || !isOpen) return
    const root = scrollReportesRef.current
    const target = reportesLoadMoreRef.current
    if (!root || !target) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        if (
          reportesInfinite.hasNextPage &&
          !reportesInfinite.isFetchingNextPage
        ) {
          void reportesInfinite.fetchNextPage()
        }
      },
      { root, rootMargin: '120px', threshold: 0 }
    )
    obs.observe(target)
    return () => obs.disconnect()
  }, [
    reportesPickerOpen,
    isOpen,
    reportesInfinite.hasNextPage,
    reportesInfinite.isFetchingNextPage,
    reportesInfinite.fetchNextPage,
    reportesListaPlana.length,
  ])

  useEffect(() => {
    if (!isOpen) {
      setUploadedFiles(new Map())
      setMontoSolicitud('')
      setIsSubmitting(false)
      setConfirmEnvioOpen(false)
      setPendingEnvio(null)
      setReportesPickerOpen(false)
      setSelectedReporteIds(new Set())
      montoEdicionSembradoRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    setReportesPickerOpen(false)
    setSelectedReporteIds(new Set())
  }, [selectedTipoPagoId])

  const requisitosSeleccionActual = useMemo((): Requisito[] => {
    if (selectedTipoPagoId) {
      return tiposPago.find((t) => t.id === selectedTipoPagoId)?.checklist?.requisitos ?? []
    }
    if (selectedDocumentoId) {
      return documentos.find((d) => d.id === selectedDocumentoId)?.checklist?.requisitos ?? []
    }
    return []
  }, [selectedTipoPagoId, selectedDocumentoId, tiposPago, documentos])

  const revisionEntregasPorRequisito = useMemo(() => {
    const docs = revisionData.data?.detalle?.documentosSubidos
    if (!docs?.length) {
      return {
        ultimaPorRequisito: new Map<string, DocumentoSubidoRevisionGql>(),
        grupoPorRequisito: new Map<string, DocumentoSubidoRevisionGql[]>(),
      }
    }
    const grupoPorRequisito = groupDocsByRequisitoProveedor(docs)
    const ultimaPorRequisito = new Map<string, DocumentoSubidoRevisionGql>()
    for (const [rid, arr] of grupoPorRequisito) {
      if (arr.length > 0) ultimaPorRequisito.set(rid, pickUltimaEntregaDelGrupoProveedor(arr))
    }
    return { ultimaPorRequisito, grupoPorRequisito }
  }, [revisionData.data?.detalle?.documentosSubidos])

  const proveedorModoChecklist: ProveedorChecklistModo = useMemo(() => {
    if (!entidadAprobacion) return 'creacion'
    if (!revisionData.isSuccess || !revisionData.data?.aprobacion) return 'pendiente'
    if (revisionData.data.aprobacion.estado === 'OBSERVADO') return 'edicion'
    return 'lectura'
  }, [entidadAprobacion, revisionData.isSuccess, revisionData.data?.aprobacion])

  /** Solo cuando se consulta revisión por entidad (no en creación). */
  const mostrarSkeletonRevisionDatos = useMemo(
    () =>
      isOpen &&
      Boolean(entidadAprobacion?.entidadId && entidadAprobacion?.entidadTipo) &&
      proveedorModoChecklist === 'pendiente' &&
      revisionData.isFetching,
    [
      isOpen,
      entidadAprobacion?.entidadId,
      entidadAprobacion?.entidadTipo,
      proveedorModoChecklist,
      revisionData.isFetching,
    ]
  )

  const subsanarMontoBloquea = useMemo(() => {
    if (proveedorModoChecklist !== 'edicion' || !entidadAprobacion) return false
    if (entidadAprobacion.entidadTipo !== 'solicitud_pago') return false
    const raw = montoSolicitud.trim()
    if (raw === '') return true
    const n = Number(raw.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0) return true
    if (
      typeof montoDisponible === 'number' &&
      Number.isFinite(montoDisponible) &&
      n > montoDisponible + MONTO_TOPE_EPS
    ) {
      return true
    }
    return false
  }, [proveedorModoChecklist, entidadAprobacion, montoSolicitud, montoDisponible])

  const revisionActivaLecturaOEdicion =
    proveedorModoChecklist === 'lectura' || proveedorModoChecklist === 'edicion'

  /** Solo en lectura el monto es texto fijo; en edición se edita como en creación. */
  const montoSoloLectura = proveedorModoChecklist === 'lectura'

  useEffect(() => {
    if (!isOpen) return
    if (proveedorModoChecklist !== 'edicion' || !selectedTipoPagoId) return
    if (!revisionData.isSuccess || !revisionData.data?.aprobacion) return
    if (montoEdicionSembradoRef.current) return
    montoEdicionSembradoRef.current = true
    const m = revisionData.data.aprobacion.montoSolicitado
    if (m != null && Number.isFinite(Number(m))) {
      setMontoSolicitud(Number(m).toFixed(2))
    }
  }, [
    isOpen,
    proveedorModoChecklist,
    selectedTipoPagoId,
    revisionData.isSuccess,
    revisionData.data?.aprobacion?.id,
    revisionData.data?.aprobacion?.montoSolicitado,
  ])

  const buildResumenConfirmacion = (requisitos: Requisito[]) => {
    const sorted = [...requisitos].sort((a, b) => a.orden - b.orden)
    return sorted.map((r) => {
      const nombre = etiquetaRequisito(r)
      if (r.tipoRequisito === 'documento') {
        const files = uploadedFiles.get(r.id) ?? []
        const nombresArchivos =
          files.length > 0 ? files.map((f) => f.name).join(', ') : '—'
        return { key: r.id, nombre, detalle: nombresArchivos, esDocumento: true as const }
      }
      return {
        key: r.id,
        nombre,
        detalle: 'Formulario',
        esDocumento: false as const,
      }
    })
  }

  /** Valida y abre el modal de confirmación con el resumen (no envía aún). */
  const handlePrimarySubmit = () => {
    if (entidadAprobacion && proveedorModoChecklist === 'edicion') {
      const aprob = revisionData.data?.aprobacion
      if (!aprob?.id) {
        toast.error('No hay aprobación cargada.')
        return
      }
      if (String(aprob.estado).toUpperCase() !== 'OBSERVADO') {
        toast.error('Solo puedes subsanar cuando la aprobación está observada.')
        return
      }
      const requisitos = requisitosSeleccionActual
      if (requisitos.length === 0) {
        toast.error('No se encontraron requisitos para esta entidad.')
        return
      }
      const ultimaEntregaEstadoPorRequisito = new Map<string, string | null>()
      for (const r of requisitos) {
        if (r.tipoRequisito !== 'documento') continue
        const ent = revisionEntregasPorRequisito.ultimaPorRequisito.get(r.id)
        ultimaEntregaEstadoPorRequisito.set(r.id, ent?.estado ?? null)
      }
      const v = validateChecklistSubsanacionParcial({
        requisitos,
        uploadedFiles,
        tieneUsuarioProveedor: Boolean(proveedorUser),
        ultimaEntregaEstadoPorRequisito,
      })
      if (!v.valid) {
        toastErroresChecklist(v.errors)
        return
      }
      if (!proveedorUser) {
        toast.error('Debes iniciar sesión como proveedor para enviar la subsanación.')
        return
      }

      let montoSubsanacionOpcional: number | undefined
      if (entidadAprobacion.entidadTipo === 'solicitud_pago') {
        const rawM = montoSolicitud.trim()
        if (rawM === '') {
          toast.error('Ingresa el monto de la solicitud.')
          return
        }
        const mActual = Number(rawM.replace(',', '.'))
        if (!Number.isFinite(mActual) || mActual < 0) {
          toast.error('El monto debe ser un número válido.')
          return
        }
        if (
          montoDisponible != null &&
          Number.isFinite(montoDisponible) &&
          mActual > montoDisponible + MONTO_TOPE_EPS
        ) {
          toast.error('El monto no puede ser mayor al disponible a pagar.')
          return
        }
        const prevRaw = aprob.montoSolicitado
        const mPrev =
          prevRaw != null && Number.isFinite(Number(prevRaw)) ? Number(prevRaw) : NaN
        if (!Number.isFinite(mPrev) || Math.abs(mActual - mPrev) > MONTO_TOPE_EPS) {
          montoSubsanacionOpcional = mActual
          toast(
            'El monto de la solicitud cambió: se actualizará en el expediente y en el kanban al confirmar.',
            { duration: 4200, icon: 'ℹ️' }
          )
        }
      }

      const subsInput = buildChecklistSubsanacion({
        expedienteId,
        context: entidadAprobacion.entidadTipo,
        entidadId: entidadAprobacion.entidadId,
        aprobacionId: aprob.id,
        proveedorUser,
        montoSolicitadoOpcional: montoSubsanacionOpcional,
      })
      if (collectChecklistFilesUploadQueue(requisitos, uploadedFiles).length === 0) {
        toast.error('Incluye al menos un requisito con archivos para subsanar.')
        return
      }
      if (!onSubsanacionReady) {
        toast.error('Envío de subsanación no disponible.')
        return
      }
      setPendingEnvio({ kind: 'subsanacion', input: subsInput })
      setConfirmEnvioOpen(true)
      return
    }

    if (entidadAprobacion) {
      return
    }
    if (!selectedTipoPagoId && !selectedDocumentoId) {
      toast.error('Selecciona un tipo de pago o un documento OC desde la orden.')
      return
    }

    if (selectedTipoPagoId) {
      const tipo = tiposPago.find((t) => t.id === selectedTipoPagoId)
      if (!tipo) {
        toast.error('No se encontró el tipo de pago seleccionado.')
        return
      }
      const requisitos = tipo.checklist?.requisitos ?? []
      const v = validateChecklistSubmission({
        mode: 'solicitud_pago',
        montoSolicitudStr: montoSolicitud,
        montoDisponibleExpediente: montoDisponible,
        requisitos,
        uploadedFiles,
        tieneUsuarioProveedor: Boolean(proveedorUser),
      })
      if (!v.valid) {
        toastErroresChecklist(v.errors)
        return
      }
      if (!proveedorUser) {
        toast.error('Debes iniciar sesión como proveedor para enviar el checklist.')
        return
      }
      const monto = Number(montoSolicitud.trim().replace(',', '.'))
      const batchInput = buildChecklistBatchSolicitud({
        expedienteId,
        tipoPagoOCId: tipo.id,
        montoSolicitado: monto,
        proveedorUser: proveedorUser,
        reporteSolicitudPagoIds:
          selectedReporteIds.size > 0 ? [...selectedReporteIds] : undefined,
      })
      setPendingEnvio({ kind: 'creacion', input: batchInput })
      setConfirmEnvioOpen(true)
      return
    }

    if (selectedDocumentoId) {
      const doc = documentos.find((dn) => dn.id === selectedDocumentoId)
      if (!doc) {
        toast.error('No se encontró el documento OC seleccionado.')
        return
      }
      const requisitos = doc.checklist?.requisitos ?? []
      const v = validateChecklistSubmission({
        mode: 'documento_oc',
        montoSolicitudStr: '',
        requisitos,
        uploadedFiles,
        tieneUsuarioProveedor: Boolean(proveedorUser),
      })
      if (!v.valid) {
        toastErroresChecklist(v.errors)
        return
      }
      if (!proveedorUser) {
        toast.error('Debes iniciar sesión como proveedor para enviar el checklist.')
        return
      }
      const batchInput = buildChecklistBatchDocumentoOC({
        expedienteId,
        documentoOCId: doc.id,
        proveedorUser: proveedorUser,
      })
      setPendingEnvio({ kind: 'creacion', input: batchInput })
      setConfirmEnvioOpen(true)
    }
  }

  /** Ejecuta el envío tras confirmar en NotificationModal (misma lógica que antes al enviar). */
  const handleConfirmarEnvio = async () => {
    if (!pendingEnvio) return

    const obtenerRequisitosParaUpload = (): Requisito[] => {
      if (pendingEnvio.kind === 'subsanacion') {
        return requisitosSeleccionActual
      }
      const input = pendingEnvio.input
      if (input.context === 'solicitud_pago' && input.tipoPagoOCId) {
        return tiposPago.find((t) => t.id === input.tipoPagoOCId)?.checklist?.requisitos ?? []
      }
      if (input.context === 'documento_oc' && input.documentoOCId) {
        return documentos.find((d) => d.id === input.documentoOCId)?.checklist?.requisitos ?? []
      }
      return []
    }

    const inputConUrlsReales = async (
      input: ChecklistProveedorBatchInput | ChecklistProveedorSubsanacionInput
    ): Promise<ChecklistProveedorBatchInput | ChecklistProveedorSubsanacionInput> => {
      const requisitos = obtenerRequisitosParaUpload()
      const queue = collectChecklistFilesUploadQueue(requisitos, uploadedFiles)
      if (queue.length === 0) {
        return { ...input, requisitosArchivos: [] }
      }
      const batch = await uploadMultipleFiles(queue.map((q) => q.file), {
        tipo: 'DOCUMENTOS_PROVEEDOR',
      })
      if (batch.failed.length > 0) {
        const msg = batch.failed.map((f) => `${f.filename}: ${f.error}`).join('; ')
        throw new Error(`Error al subir archivos: ${msg}`)
      }
      if (batch.successful.length !== queue.length) {
        throw new Error('No se subieron todos los archivos; intente de nuevo')
      }
      const requisitosArchivos = requisitosArchivosDesdeUploads(requisitos, queue, batch.successful)
      return { ...input, requisitosArchivos }
    }

    if (pendingEnvio.kind === 'subsanacion') {
      if (!onSubsanacionReady) return
      setIsSubmitting(true)
      let input: ChecklistProveedorSubsanacionInput
      try {
        input = (await inputConUrlsReales(
          pendingEnvio.input
        )) as ChecklistProveedorSubsanacionInput
      } catch (e) {
        console.error(e)
        toast.error(e instanceof Error ? e.message : 'Error al subir los archivos')
        setIsSubmitting(false)
        return
      }
      try {
        logChecklistSubsanacionInput(input)
        await Promise.resolve(onSubsanacionReady(input))
        setConfirmEnvioOpen(false)
        setPendingEnvio(null)
        onClose()
      } catch {
        // useProcesarChecklistSubsanacion muestra toast en onError
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const pendingBatchInput = pendingEnvio.input

    if (onPayloadReady) {
      setIsSubmitting(true)
      let input: ChecklistProveedorBatchInput
      try {
        input = (await inputConUrlsReales(
          pendingBatchInput
        )) as ChecklistProveedorBatchInput
      } catch (e) {
        console.error(e)
        toast.error(e instanceof Error ? e.message : 'Error al subir los archivos')
        setIsSubmitting(false)
        return
      }
      try {
        logChecklistBatchInput(input)
        await Promise.resolve(onPayloadReady(input))
        if (
          input.context === 'solicitud_pago' &&
          input.montoSolicitado != null
        ) {
          onSubmitSolicitud?.(input.montoSolicitado)
        }
        setConfirmEnvioOpen(false)
        setPendingEnvio(null)
        onClose()
      } catch {
        // El hook useProcesarChecklistProveedor ya muestra toast.error en onError
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (
      pendingBatchInput.context === 'solicitud_pago' &&
      pendingBatchInput.montoSolicitado != null
    ) {
      onSubmitSolicitud?.(pendingBatchInput.montoSolicitado)
    }
    setConfirmEnvioOpen(false)
    setPendingEnvio(null)
  }

  const handleCancelarConfirmEnvio = () => {
    if (isSubmitting || isUploading) return
    setConfirmEnvioOpen(false)
    setPendingEnvio(null)
  }

  const reportesMarcadosParaConfirmacion = useMemo(() => {
    const conDetalle = reportesListaPlana.filter((r) =>
      selectedReporteIds.has(r.id)
    )
    const vistos = new Set(conDetalle.map((r) => r.id))
    const soloId = [...selectedReporteIds].filter((id) => !vistos.has(id))
    return { conDetalle, soloId }
  }, [reportesListaPlana, selectedReporteIds])

  const renderBloqueReportesVinculacionSolicitud = () => {
    const { conDetalle, soloId } = reportesMarcadosParaConfirmacion
    const hayAlguno = conDetalle.length > 0 || soloId.length > 0
    return (
      <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] p-3 space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          Reportes a vincular
        </p>
        <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
          Los siguientes reportes se vincularán a esta solicitud de pago al confirmar el envío
        </p>
        {!hayAlguno ? (
          <p className="text-xs text-[var(--text-secondary)] italic py-1">
            No marcaste ningún reporte operativo para vincular.
          </p>
        ) : (
          <ul className="space-y-2 max-h-[min(28vh,12rem)] overflow-y-auto pr-1">
            {conDetalle.map((r) => {
              const fechaStr = r.fecha
                ? new Date(r.fecha).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '—'
              return (
                <li
                  key={r.id}
                  className="rounded-md border border-[var(--border-color)] bg-[var(--muted)]/40 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)] font-mono tabular-nums">
                    {r.codigo?.trim() || '—'}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                    Ref. {r.identificadorSolicitudPago?.trim() || '—'} · {fechaStr}
                  </p>
                  {r.maestroResponsable ? (
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                      {r.maestroResponsable}
                    </p>
                  ) : null}
                </li>
              )
            })}
            {soloId.map((id) => (
              <li
                key={id}
                className="rounded-md border border-[var(--border-color)] bg-[var(--muted)]/40 px-3 py-2"
              >
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  Reporte seleccionado
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-mono break-all">
                  {id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const confirmacionDescription =
    pendingEnvio &&
    (() => {
      if (pendingEnvio.kind === 'subsanacion') {
        const rows = [...requisitosSeleccionActual]
          .sort((a, b) => a.orden - b.orden)
          .flatMap((r) => {
            if (r.tipoRequisito !== 'documento') return []
            const files = uploadedFiles.get(r.id) ?? []
            if (files.length === 0) return []
            return [
              {
                key: r.id,
                nombre: etiquetaRequisito(r),
                detalle: files.map((f) => f.name).join(', '),
              },
            ]
          })
        return (
          <div className="space-y-4 text-left">
            <p className="text-[11px] text-[var(--text-secondary)]">
              Solo se registrarán las entregas nuevas indicadas. El kanban volverá a revisión.
            </p>
            {pendingEnvio.input.context === 'solicitud_pago' &&
              (() => {
                const raw = montoSolicitud.trim().replace(',', '.')
                const n = Number(raw)
                if (!Number.isFinite(n)) return null
                return (
                  <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">
                      Monto solicitado
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      S/{' '}
                      {n.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                      {pendingEnvio.input.montoSolicitado != null
                        ? 'Este monto reemplazará al anterior en la solicitud y en la aprobación.'
                        : 'Sin cambio de monto en backend (mismo valor que el envío observado).'}
                    </p>
                  </div>
                )
              })()}
            {pendingEnvio.input.context === 'solicitud_pago'
              ? renderBloqueReportesVinculacionSolicitud()
              : null}
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                Requisitos a subsanar
              </p>
              <ul className="space-y-2 max-h-[min(40vh,16rem)] overflow-y-auto pr-1">
                {rows.map((row) => (
                  <li
                    key={row.key}
                    className="rounded-md border border-[var(--border-color)] bg-[var(--muted)]/40 px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                      {row.nombre}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 break-words">
                      <span className="font-medium text-[var(--text-secondary)]">Archivo(s): </span>
                      {row.detalle}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] text-center">
              Revisa y confirma para enviar la subsanación.
            </p>
          </div>
        )
      }

      const requisitosLista: Requisito[] = selectedTipoPagoId
        ? tiposPago.find((t) => t.id === selectedTipoPagoId)?.checklist?.requisitos ?? []
        : selectedDocumentoId
          ? documentos.find((d) => d.id === selectedDocumentoId)?.checklist?.requisitos ?? []
          : []
      const filas = buildResumenConfirmacion(requisitosLista)
      const pendingBatchInput = pendingEnvio.input
      const esSolicitud = pendingBatchInput.context === 'solicitud_pago'
      const monto = pendingBatchInput.montoSolicitado

      return (
        <div className="space-y-4 text-left">
          {esSolicitud && monto != null && Number.isFinite(monto) && (
            <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">
                Monto solicitado
              </p>
              <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                S/{' '}
                {monto.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          )}
          {esSolicitud ? renderBloqueReportesVinculacionSolicitud() : null}
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Requisitos y archivos</p>
            <ul className="space-y-2 max-h-[min(40vh,16rem)] overflow-y-auto pr-1">
              {filas.map((row) => (
                <li
                  key={row.key}
                  className="rounded-md border border-[var(--border-color)] bg-[var(--muted)]/40 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                    {row.nombre}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 break-words">
                    <span className="font-medium text-[var(--text-secondary)]">
                      {row.esDocumento ? 'Archivo(s): ' : ''}
                    </span>
                    {row.detalle}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    })()

  const handleFileChange = (requisitoId: string, files: File[]) => {
    setUploadedFiles(prev => new Map(prev.set(requisitoId, files)))
    files.forEach(file => onFileUpload?.(requisitoId, file))
  }

  const addFiles = (requisitoId: string, newFiles: File[]) => {
    const existingFiles = uploadedFiles.get(requisitoId) || []
    const updatedFiles = [...existingFiles, ...newFiles]
    handleFileChange(requisitoId, updatedFiles)
  }

  const removeFile = (requisitoId: string, index: number) => {
    const existingFiles = uploadedFiles.get(requisitoId) || []
    const updatedFiles = existingFiles.filter((_, i) => i !== index)
    handleFileChange(requisitoId, updatedFiles)
  }

  const downloadPlantilla = (plantilla: any) => {
    window.open(plantilla.plantillaUrl, '_blank')
  }

  const getFormatosPermitidos = (formatos?: string) => {
    if (!formatos) return 'Todos los formatos'
    return formatos.split(',').map(f => f.trim().toUpperCase()).join(', ')
  }

  const getMimeTypesPermitidos = (formatos?: string) => {
    if (!formatos) return '*'
    
    const formatMap: { [key: string]: string } = {
      'DOC': '.doc',
      'DOCX': '.docx',
      'PDF': '.pdf',
      'TXT': '.txt',
      'XLS': '.xls',
      'XLSX': '.xlsx',
      'PPT': '.ppt',
      'PPTX': '.pptx',
      'JPG': '.jpg',
      'JPEG': '.jpeg',
      'PNG': '.png',
      'GIF': '.gif'
    }
    
    return formatos
      .split(',')
      .map(f => f.trim().toUpperCase())
      .map(ext => formatMap[ext] || `.${ext.toLowerCase()}`)
      .join(',')
  }

  const getTipoIcon = (tipo: 'documento' | 'formulario') => {
    return tipo === 'documento' ? <FileText className="h-4 w-4" /> : <FormInput className="h-4 w-4" />
  }

  const renderRequisito = (
    requisito: Requisito,
    revisionOpciones?: {
      entregasGrupo: DocumentoSubidoRevisionGql[]
      soloLectura: boolean
    } | null
  ) => {
    const files = uploadedFiles.get(requisito.id) || []
    const hasFiles = files.length > 0
    const entregasGrupo = revisionOpciones?.entregasGrupo ?? []
    const entregaVigente =
      entregasGrupo.length > 0 ? pickUltimaEntregaDelGrupoProveedor(entregasGrupo) : null
    /** Solo lectura: sin subida. Edición (OBSERVADO): muestra entrega previa + misma UI de subida que en creación. */
    const ocultarSubida = revisionOpciones?.soloLectura === true
    const mostrarBloqueEntrega = revisionOpciones != null
    
    return (
      <div key={requisito.id} className="bg-card border rounded-lg p-3 space-y-3">
        {/* Header del requisito */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getTipoIcon(requisito.tipoRequisito)}
            <div className="text-xs font-semibold max-sm:text-xs truncate">
              {requisito.tipoRequisito === 'documento' 
                ? requisito.plantillaDocumento?.nombrePlantilla || `Requisito ${requisito.orden}`
                : requisito.formulario?.nombre || `Requisito ${requisito.orden}`
              }
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {requisito.obligatorio && (
              <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
            )}
            {entregaVigente && (
              <Badge variant={badgeVariantEstadoDocProveedor(entregaVigente.estado)} className="text-xs">
                {ESTADO_ENTREGA_LABEL[entregaVigente.estado] ?? entregaVigente.estado}
              </Badge>
            )}
            {hasFiles && !ocultarSubida && (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
              </Badge>
            )}
          </div>
        </div>

        {/* Contenido del requisito */}
        {requisito.tipoRequisito === 'documento' && requisito.plantillaDocumento && (
          <div className="space-y-3">
            {/* Plantilla */}
            <div className="bg-muted/30 rounded p-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold mb-1 max-sm:text-xs">Plantilla de documento</div>
                  <p className="text-xs text-muted-foreground max-sm:text-xs">
                    Formatos: {getFormatosPermitidos(requisito.plantillaDocumento.formatosPermitidos)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPlantilla(requisito.plantillaDocumento)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>

            {mostrarBloqueEntrega && (
              <div className="rounded-md bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Entregas</p>
                <RequisitoEntregasRevisionProveedor entregasGrupo={entregasGrupo} />
              </div>
            )}

            {/* Upload: creación y edición (subsanar). En solo lectura no se muestra. */}
            {!ocultarSubida && (
              <div>
                <label className="block text-xs font-semibold mb-2 max-sm:text-xs">
                  Subir documento {requisito.obligatorio && <span className="text-red-500">*</span>}
                </label>
                <FileUploadComponent 
                  requisito={requisito}
                  onFilesSelect={(newFiles) => addFiles(requisito.id, newFiles)}
                  onFileRemove={(index) => removeFile(requisito.id, index)}
                  files={files}
                />
              </div>
            )}
          </div>
        )}

        {requisito.tipoRequisito === 'formulario' && (
          <div className="bg-muted/30 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary max-sm:text-xs">{requisito.formulario?.nombre || 'Formulario no configurado'}</span>
              <Button variant="outline" size="sm">
                <FormInput className="h-3 w-3 mr-1" />
                Abrir formulario
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Componente mejorado para subida de múltiples archivos
  const FileUploadComponent = ({ 
    requisito, 
    onFilesSelect, 
    onFileRemove, 
    files 
  }: { 
    requisito: Requisito
    onFilesSelect: (files: File[]) => void
    onFileRemove: (index: number) => void
    files: File[]
  }) => {
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const maxFiles = 4
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = getMimeTypesPermitidos(requisito.plantillaDocumento?.formatosPermitidos)

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) return `El archivo "${file.name}" supera el límite de 5MB`
      // Validación básica de extensión
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      const allowedExts = allowedTypes.split(',').filter(t => t.startsWith('.'))
      if (!allowedExts.includes(fileExt) && allowedTypes !== '*') {
        return `Tipo de archivo no permitido. Formatos permitidos: ${getFormatosPermitidos(requisito.plantillaDocumento?.formatosPermitidos)}`
      }
      return null
    }

    const processFiles = (fileList: FileList | null) => {
      if (!fileList) return
      const newFiles: File[] = []
      const errors: string[] = []
      
      Array.from(fileList).forEach(file => {
        if (files.length + newFiles.length >= maxFiles) { 
          if (!errors.includes(`Máximo ${maxFiles} archivos permitidos`)) {
            errors.push(`Máximo ${maxFiles} archivos permitidos`)
          }
          return 
        }
        
        const exists = [...files, ...newFiles].some(f => 
          f.name === file.name && f.size === file.size
        )
        if (exists) { 
          errors.push(`Archivo duplicado: ${file.name}`)
          return 
        }
        
        const validationError = validateFile(file)
        if (validationError) { 
          errors.push(validationError)
          return 
        }
        
        newFiles.push(file)
      })
      
      if (errors.length > 0) {
        alert(errors.join('\n'))
      }
      
      if (newFiles.length > 0) {
        onFilesSelect(newFiles)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      processFiles(e.dataTransfer.files)
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }

    return (
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes}
          multiple
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />

        {/* Drop zone para subir archivos */}
        {files.length < maxFiles && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer
              transition-all duration-200
              ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
            `}
          >
            <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <FileText className={`w-4 h-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700">
                {isDragOver ? 'Suelta los archivos aquí' : 'Haz clic o arrastra archivos'}
              </p>
              <p className="text-xs text-gray-400">
                {getFormatosPermitidos(requisito.plantillaDocumento?.formatosPermitidos)} · máx. 5MB · {files.length}/{maxFiles}
              </p>
            </div>
            {files.length > 0 && (
              <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {files.length} archivo{files.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Lista de archivos subidos */}
        {files.map((file, index) => (
          <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-green-600 shrink-0">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate dark:text-gray-300">
                {file.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFileRemove(index)}
              className="shrink-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 text-red-600 dark:text-red-400"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {/* Mensaje cuando se alcanza el límite */}
        {files.length >= maxFiles && (
          <div className="text-center py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              Se alcanzó el límite de {maxFiles} archivos
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderTipoPago = (tipoPago: TipoPagoOC) => {
    const requisitos = tipoPago.checklist?.requisitos || []

    return (
      <div key={tipoPago.id} className="bg-card border rounded-lg p-4 space-y-4">
        {/* Header del tipo de pago */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base max-sm:text-sm">{tipoPago.checklist?.nombre}</h3>
            <p className="text-xs text-muted-foreground max-sm:text-xs">{tipoPago.checklist?.descripcion}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">{tipoPago.categoria?.nombre}</Badge>
              <Badge variant="outline" className="text-xs">Orden {tipoPago.orden}</Badge>
              {tipoPago.requiereAnteriorPagado && (
                <Badge variant="destructive" className="text-xs">Requiere anterior pagado</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Requisitos */}
        {requisitos.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-muted-foreground max-sm:text-xs">Requisitos</h4>
            {requisitos
              .sort((a, b) => a.orden - b.orden)
              .map((r) => renderRequisito(r))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-xs max-sm:text-xs">No hay requisitos configurados para esta solicitud</p>
          </div>
        )}
      </div>
    )
  }

  const renderDocumento = (documento: DocumentoOC) => {
    const requisitos = documento.checklist?.requisitos || []

    return (
      <div key={documento.id} className="bg-card border border-green-200 rounded-lg p-4 space-y-4">
        {/* Header del documento */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <File className="h-5 w-5 text-green-600 dark:text-green-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base max-sm:text-sm">{documento.checklist?.nombre}</h3>
            <p className="text-xs text-muted-foreground max-sm:text-xs">{documento.checklist?.descripcion}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">{documento.checklist?.categoria?.nombre}</Badge>
              {documento.obligatorio && (
                <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
              )}
              <Badge variant="outline" className="text-xs">{documento.estado}</Badge>
            </div>
          </div>
        </div>

        {/* Requisitos */}
        {requisitos.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-muted-foreground max-sm:text-xs">Requisitos</h4>
            {requisitos
              .sort((a, b) => a.orden - b.orden)
              .map((r) => renderRequisito(r))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-xs max-sm:text-xs">No hay requisitos configurados para este documento</p>
          </div>
        )}
      </div>
    )
  }

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/20">
        <FileText className="w-5 h-5 text-green-600 dark:text-green-300" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-text-primary">
          {selectedTipoPagoId ? 'Requisitos de Solicitud' : 
           selectedDocumentoId ? 'Requisitos de Documento OC' : 
           'Documentos y Requisitos'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {selectedTipoPagoId 
            ? 'Gestiona la documentación requerida para esta solicitud' 
            : selectedDocumentoId
            ? 'Gestiona la documentación requerida para este documento OC'
            : 'Gestiona la documentación requerida para tu expediente'
          }
        </p>
      </div>
    </div>
  );

  const montoNumSolicitud =
    selectedTipoPagoId && montoSolicitud.trim() !== ''
      ? Number(montoSolicitud.trim().replace(',', '.'))
      : NaN
  const montoDisponibleOk =
    typeof montoDisponible === 'number' && Number.isFinite(montoDisponible)
      ? montoDisponible
      : undefined
  const montoSuperaDisponible =
    Boolean(selectedTipoPagoId) &&
    montoDisponibleOk !== undefined &&
    Number.isFinite(montoNumSolicitud) &&
    montoNumSolicitud > montoDisponibleOk + MONTO_TOPE_EPS

  const primaryDisabled =
    isSubmitting ||
    isUploading ||
    confirmEnvioOpen ||
    Boolean(selectedTipoPagoId && !montoSolicitud.trim()) ||
    montoSuperaDisponible ||
    (!selectedTipoPagoId && !selectedDocumentoId)

  const subsanacionPreValidacionOk = useMemo(() => {
    if (proveedorModoChecklist !== 'edicion' || !entidadAprobacion) return true
    const requisitos = requisitosSeleccionActual
    const ultimaEntregaEstadoPorRequisito = new Map<string, string | null>()
    for (const r of requisitos) {
      if (r.tipoRequisito !== 'documento') continue
      const ent = revisionEntregasPorRequisito.ultimaPorRequisito.get(r.id)
      ultimaEntregaEstadoPorRequisito.set(r.id, ent?.estado ?? null)
    }
    const v = validateChecklistSubsanacionParcial({
      requisitos,
      uploadedFiles,
      tieneUsuarioProveedor: true,
      ultimaEntregaEstadoPorRequisito,
    })
    return v.valid
  }, [
    proveedorModoChecklist,
    entidadAprobacion,
    requisitosSeleccionActual,
    revisionEntregasPorRequisito,
    uploadedFiles,
  ])

  const subsanarDisabled =
    isSubmitting ||
    isUploading ||
    confirmEnvioOpen ||
    revisionData.isLoading ||
    !revisionData.isSuccess ||
    !revisionData.data?.aprobacion ||
    String(revisionData.data.aprobacion.estado).toUpperCase() !== 'OBSERVADO' ||
    !subsanacionPreValidacionOk ||
    subsanarMontoBloquea ||
    !onSubsanacionReady

  const modalFooterCreacion = (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between w-full gap-2">
        <div className="text-xs text-muted-foreground min-w-0">
          {selectedDocumentoId && (
            <span>Documento OC: sin monto; archivos según requisitos obligatorios.</span>
          )}
          {!selectedTipoPagoId && !selectedDocumentoId && (
            <span>Abre el checklist desde un tipo de pago o un documento OC.</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting || isUploading}>
            Cancelar
          </Button>
          <Button
            variant="custom"
            color="blue"
            size="sm"
            onClick={() => handlePrimarySubmit()}
            disabled={primaryDisabled}
          >
            <Upload className="w-3 h-3 mr-1" />
            {isSubmitting || isUploading
              ? 'Enviando…'
              : selectedTipoPagoId
                ? 'Enviar Solicitud'
                : 'Subir Documentos'}
          </Button>
        </div>
      </div>
    </div>
  )

  const textoAyudaSubsanacionFooter =
    'Requisitos observados o pendientes de corregir: debes adjuntar archivos nuevos. Requisitos ya aprobados: volver a subir es opcional. En solicitudes de pago, si modificas el monto respecto al observado, también se actualizará en la solicitud y en el kanban; si no lo cambias, el monto anterior se mantiene.'

  /** Edición (aprobación OBSERVADO): envía `procesarChecklistSubsanacion` con archivos nuevos. */
  const modalFooterEdicion = (
    <div className="flex flex-col gap-2 w-full">
      <div
        className="flex items-start gap-2 rounded-md bg-muted/25 px-2.5 py-2 text-left"
        title={textoAyudaSubsanacionFooter}
      >
        <Info
          className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/85"
          aria-hidden
        />
        <p className="text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Observados/a corregir:</span>{' '}
          nueva entrega obligatoria.
          <span className="mx-1 text-border">·</span>
          <span className="font-medium text-foreground">Ya aprobados:</span>{' '}
          reemplazar archivos es opcional.
          <span className="mx-1 text-border">·</span>
        </p>
      </div>
      <div className="flex items-center justify-end w-full gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting || isUploading}>
          Cancelar
        </Button>
        <Button
          variant="custom"
          color="blue"
          size="sm"
          type="button"
          disabled={subsanarDisabled}
          onClick={() => handlePrimarySubmit()}
        >
          <PencilLine className="w-3 h-3 mr-1" />
          {isSubmitting || isUploading ? 'Enviando…' : 'Subsanar'}
        </Button>
      </div>
    </div>
  )

  const modalFooterResolved =
    proveedorModoChecklist === 'lectura'
      ? undefined
      : proveedorModoChecklist === 'edicion'
        ? modalFooterEdicion
        : proveedorModoChecklist === 'pendiente'
          ? undefined
          : modalFooterCreacion

  const montoSolicitudRevision = revisionData.data?.detalle?.montoSolicitado

  const esConfirmSolicitud =
    pendingEnvio != null && pendingEnvio.input.context === 'solicitud_pago'

  const confirmacionTitulo =
    pendingEnvio == null
      ? ''
      : pendingEnvio.kind === 'subsanacion'
        ? esConfirmSolicitud
          ? 'Confirmar subsanación (solicitud de pago)'
          : 'Confirmar subsanación (documento OC)'
        : esConfirmSolicitud
          ? 'Confirmar envío de solicitud'
          : 'Confirmar envío de documentos'

  const confirmacionBotonTexto =
    pendingEnvio == null
      ? 'Confirmar'
      : pendingEnvio.kind === 'subsanacion'
        ? 'Enviar subsanación'
        : esConfirmSolicitud
          ? 'confirmar'
          : 'Subir documentos'

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      showCloseButton={true}
      footer={modalFooterResolved}
    >
      <div className="space-y-6">
        {mostrarSkeletonRevisionDatos ? (
          <ChecklistModalRevisionSkeleton />
        ) : (
          <>
        {/* MOSTRAR SOLO EL TIPO DE PAGO SELECCIONADO */}
        {selectedTipoPagoId && (
          <div className="space-y-4">
            {tiposPago
              .filter(tipoPago => tipoPago.id === selectedTipoPagoId)
              .map(tipoPago => {
                const requisitos = tipoPago.checklist?.requisitos || []
                
                return (
                  <div key={tipoPago.id} className="bg-card rounded-lg space-y-4">
                    {/* Header del tipo de pago */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <FileInput className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{tipoPago.checklist?.nombre}</p>
                        <p className="text-xs text-muted-foreground max-sm:text-xs">{tipoPago.checklist?.descripcion}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{tipoPago.categoria?.nombre}</Badge>
                          
                          {tipoPago.requiereAnteriorPagado && (
                            <Badge variant="destructive" className="text-xs">Requiere anterior pagado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                      
                    {entidadAprobacion ? (
          <div className="rounded-lg border border-border-color bg-muted/20 px-3 py-2 text-xs">
            {revisionData.isError ? (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  No se pudo cargar la revisión asociada.
                  {revisionData.error instanceof Error && revisionData.error.message
                    ? ` ${revisionData.error.message}`
                    : ''}
                </span>
              </div>
            ) : null}
            {revisionData.isSuccess ? (
              <div className="text-muted-foreground space-y-2">
                {revisionData.data?.aprobacion ? (
                  <>
                    <p>
                      Aprobación:{' '}
                      <span className="font-medium text-foreground">
                        {revisionData.data.aprobacion.estado}
                      </span>
                      {' · '}ciclo {revisionData.data.aprobacion.numeroCiclo}
                      {revisionData.data.detalle
                        ? ` · ${revisionData.data.detalle.documentosSubidos?.length ?? 0} entrega(s) registrada(s)`
                        : ' · Sin detalle de checklist'}
                    </p>
                    {(['observaciones', 'comentariosAprobacion', 'comentariosRechazo'] as const).map(
                      (key) => {
                        const items = revisionData.data?.aprobacion?.[key] ?? []
                        if (!items.length) return null
                        const titulo =
                          key === 'observaciones'
                            ? 'Observaciones'
                            : key === 'comentariosAprobacion'
                              ? 'Comentarios de aprobación'
                              : 'Comentarios de rechazo'
                        return (
                          <div key={key} className="space-y-1 border-t border-border-color/60 pt-2">
                            <p className="text-[11px] font-semibold text-foreground">{titulo}</p>
                            <ul className="space-y-1.5 list-none pl-0">
                              {items.map((c, i) => (
                                <li key={i} className="text-[11px] leading-snug rounded bg-background/50 px-2 py-1.5">
                                  <span className="text-foreground">{c.mensaje}</span>
                                  {(c.usuarioNombre || c.fecha) && (
                                    <span className="block mt-0.5 text-muted-foreground">
                                      {c.usuarioNombre ? `${c.usuarioNombre}` : ''}
                                      {c.usuarioNombre && c.fecha ? ' · ' : ''}
                                      {c.fecha
                                        ? new Date(c.fecha).toLocaleString('es-PE', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                          })
                                        : ''}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      }
                    )}
                  </>
                ) : (
                  <p>No hay registro de aprobación para esta entidad.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}


                    {/* Campo de monto a solicitar */}
                    <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <label className="block text-xs font-semibold text-muted-foreground">
                          {montoSoloLectura ? 'Monto solicitado' : 'Monto a Solicitar *'}
                        </label>
                        {montoDisponibleOk !== undefined && !montoSoloLectura && (
                          <span className="text-xs text-muted-foreground">
                            Disponible a pagar:{' '}
                            <span className="font-semibold text-foreground tabular-nums">
                              S/{' '}
                              {montoDisponibleOk.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </span>
                        )}
                      </div>
                      {montoSoloLectura ? (
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {montoSolicitudRevision != null && Number.isFinite(montoSolicitudRevision)
                            ? `S/ ${montoSolicitudRevision.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '—'}
                        </p>
                      ) : (
                        <>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={montoSolicitud}
                            onChange={(e) => setMontoSolicitud(e.target.value)}
                            className="text-xs"
                            min="0"
                            max={montoDisponibleOk}
                            step="0.01"
                            aria-invalid={montoSuperaDisponible}
                          />
                          {montoSuperaDisponible && (
                            <p className="text-xs text-destructive">
                              El monto debe ser menor o igual al disponible a pagar.
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Requisitos */}
                    {requisitos.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-xs text-muted-foreground max-sm:text-xs">Requisitos</h4>
                        {requisitos
                          .sort((a, b) => a.orden - b.orden)
                          .map((r) =>
                            renderRequisito(
                              r,
                              proveedorModoChecklist === 'lectura' ||
                                proveedorModoChecklist === 'edicion'
                                ? {
                                    entregasGrupo:
                                      revisionEntregasPorRequisito.grupoPorRequisito.get(r.id) ?? [],
                                    soloLectura: proveedorModoChecklist === 'lectura',
                                  }
                                : undefined
                            )
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-xs max-sm:text-xs">No hay requisitos configurados para esta solicitud</p>
                      </div>
                    )}

                    <div className="rounded-lg border border-dashed border-border-color/80 bg-muted/15 p-3 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground flex items-center gap-2 min-w-0">
                          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">Reportes de solicitud de pago</span>
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() => setReportesPickerOpen((v) => !v)}
                        >
                          <Link2 className="h-3 w-3 mr-1.5" />
                          {reportesPickerOpen
                            ? 'Ocultar reportes'
                            : 'Seleccionar reportes'}
                        </Button>
                      </div>
                      {reportesPickerOpen ? (
                        <div className="space-y-2">
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Solo se muestran reportes aún no vinculados a una solicitud en el sistema.
                            Marca los que necesites para sustentar la solicitud de pago
                          </p>
                          {!proveedorIdReportes ? (
                            <p className="text-xs text-destructive">
                              No hay proveedor en sesión; no se pueden cargar reportes.
                            </p>
                          ) : reportesInfinite.isError ? (
                            <p className="text-xs text-destructive">
                              No se pudieron cargar los reportes.
                              {reportesInfinite.error instanceof Error
                                ? ` ${reportesInfinite.error.message}`
                                : ''}
                            </p>
                          ) : (
                            <div
                              ref={scrollReportesRef}
                              className="max-h-[min(280px,38vh)] overflow-y-auto rounded-md border border-border-color/60 bg-background/40 pr-1 space-y-0.5"
                            >
                              {reportesInfinite.isLoading &&
                              reportesListaPlana.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Cargando reportes…
                                </div>
                              ) : reportesListaPlana.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">
                                  No hay reportes sin vincular.
                                </p>
                              ) : (
                                <>
                                  {reportesListaPlana.map((r) => {
                                    const checked = selectedReporteIds.has(r.id)
                                    const fechaStr = r.fecha
                                      ? new Date(r.fecha).toLocaleDateString(
                                          'es-PE',
                                          {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                          }
                                        )
                                      : '—'
                                    return (
                                      <label
                                        key={r.id}
                                        className={cn(
                                          'flex items-start gap-2.5 rounded-md px-2 py-2 text-left cursor-pointer',
                                          'hover:bg-muted/50 border-b border-border-color/40 last:border-0'
                                        )}
                                      >
                                        <input
                                          type="checkbox"
                                          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border-color accent-primary"
                                          checked={checked}
                                          onChange={(e) => {
                                            setSelectedReporteIds((prev) => {
                                              const next = new Set(prev)
                                              if (e.target.checked) next.add(r.id)
                                              else next.delete(r.id)
                                              return next
                                            })
                                          }}
                                        />
                                        <span className="min-w-0 flex-1 space-y-0.5">
                                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                            <span className="font-mono font-semibold tabular-nums">
                                              {r.codigo?.trim() || '—'}
                                            </span>
                                            <span className="text-muted-foreground">
                                              {fechaStr}
                                            </span>
                                          </span>
                                          <span className="block text-[11px] text-muted-foreground truncate">
                                            Ref.{' '}
                                            {r.identificadorSolicitudPago?.trim() || '—'}
                                            {' · '}
                                            {r.maestroResponsable || '—'}
                                          </span>
                                        </span>
                                      </label>
                                    )
                                  })}
                                  <div
                                    ref={reportesLoadMoreRef}
                                    className="h-2 w-full shrink-0"
                                    aria-hidden
                                  />
                                  {reportesInfinite.isFetchingNextPage ? (
                                    <div className="flex items-center justify-center gap-2 py-2 text-[11px] text-muted-foreground">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Cargando más…
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* MOSTRAR SOLO EL DOCUMENTO OC SELECCIONADO */}
        {selectedDocumentoId && (
          <div className="space-y-4">
            {documentos
              .filter(documento => documento.id === selectedDocumentoId)
              .map(documento => {
                const requisitos = documento.checklist?.requisitos || []
                
                return (
                  <div key={documento.id} className="bg-card rounded-lg p-4 space-y-4">
                    {/* Header del documento */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <File className="h-5 w-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base max-sm:text-sm">{documento.checklist?.nombre}</h3>
                        <p className="text-xs text-muted-foreground max-sm:text-xs">{documento.checklist?.descripcion}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{documento.checklist?.categoria?.nombre}</Badge>
                          {documento.obligatorio && (
                            <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{documento.estado}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Requisitos */}
                    {requisitos.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-xs text-muted-foreground max-sm:text-xs">Requisitos</h4>
                        {requisitos
                          .sort((a, b) => a.orden - b.orden)
                          .map((r) =>
                            renderRequisito(
                              r,
                              proveedorModoChecklist === 'lectura' ||
                                proveedorModoChecklist === 'edicion'
                                ? {
                                    entregasGrupo:
                                      revisionEntregasPorRequisito.grupoPorRequisito.get(r.id) ?? [],
                                    soloLectura: proveedorModoChecklist === 'lectura',
                                  }
                                : undefined
                            )
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-xs max-sm:text-xs">No hay requisitos configurados para este documento</p>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {/* SI NO HAY SELECCIÓN, MOSTRAR TODO (fallback) */}
        {!selectedTipoPagoId && !selectedDocumentoId && (
          <div className="space-y-6">
            {/* SECCIÓN: TIPOS DE PAGO */}
            {tiposPago.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-base max-sm:text-sm text-blue-600">Solicitudes de Pago</h4>
                {tiposPago.map(renderTipoPago)}
              </div>
            )}

            {/* SECCIÓN: DOCUMENTOS OC */}
            {documentos.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-base max-sm:text-sm text-green-600">Documentos OC</h4>
                {documentos.map(renderDocumento)}
              </div>
            )}

            {tiposPago.length === 0 && documentos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs max-sm:text-xs">No hay documentos ni requisitos configurados para este expediente</p>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </Modal>

    <NotificationModal
      isOpen={confirmEnvioOpen && Boolean(pendingEnvio)}
      onClose={handleCancelarConfirmEnvio}
      type="info"
      message={confirmacionTitulo}
      description={confirmacionDescription || undefined}
      confirmText={confirmacionBotonTexto}
      cancelText="Cancelar"
      onConfirm={() => void handleConfirmarEnvio()}
      onCancel={handleCancelarConfirmEnvio}
      loading={isSubmitting || isUploading}
    />
    </>
  )
}
