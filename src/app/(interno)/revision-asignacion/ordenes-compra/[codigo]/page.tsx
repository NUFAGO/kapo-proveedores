'use client'

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  FileText,
  Save,
  Trash2,
  Package,
  Clock,
  AlertCircle,
  Pencil,
  Check,
  GripVertical,
  Banknote,
  Calendar,
  Eye,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import ModalChecklistSelector from './components/modalChecklistSelector'
import { ChecklistModal } from '@/app/(portal)/proveedor/ordenes/[codigo]/components/checklistModal'
import type { EntidadAprobacionRef } from '@/hooks/useAprobacionYDetalleChecklistPorEntidad'
import {
  useGuardarExpedienteConItems,
  useActualizarExpedienteItems,
  useExpedientePorCodigo,
  useExpedienteCompleto,
  useSolicitudesPorExpediente,
  type SolicitudPagoResumen,
  type TipoPagoOC,
  type DocumentoOC,
} from '@/hooks/useExpedientePago'
import { useOrdenesCompra } from '@/hooks'
import toast from 'react-hot-toast'

// Tipos para los items agregados
interface ExpedienteItem {
  id: string
  tipo: 'solicitud-pago' | 'documento-oc'
  ordenCompraId: string
  categoriaChecklistId: string
  plantillaChecklistId: string
  categoria?: {
    id: string
    nombre: string
    tipoUso: string
  }
  plantilla?: {
    id: string
    codigo: string
    nombre: string
    descripcion?: string
  }
  timestamp: string
}

/** Vista previa local (sin persistir aún) para tipos de pago en revisión-asignación. */
interface SolicitudPagoCamposLocales {
  porcentajeMaximo: number
  porcentajeMinimo: number
  permiteVincularReportes: boolean
}

/** Campos editables de documentos OC (obligatorio por defecto true al agregar). */
interface DocumentoOCCamposLocales {
  obligatorio: boolean
  bloqueaSolicitudPago: boolean
}

/** Referencia estable para evitar `|| []` nuevo en cada render (bucles en useEffect). */
const EMPTY_TIPOS_PAGO: any[] = []
const EMPTY_DOCUMENTOS: any[] = []

const redondearPorcentaje2 = (n: number) => Math.round(n * 100) / 100

/**
 * Si la suma de % máximos supera 100, reduce desde la última fila en `order`
 * hasta que la suma sea ≤ 100 (misma regla que al editar un campo).
 */
function normalizarSumaPorcentajesMax100(
  campos: Record<string, SolicitudPagoCamposLocales>,
  order: string[]
): Record<string, SolicitudPagoCamposLocales> {
  const next: Record<string, SolicitudPagoCamposLocales> = {}
  for (const id of Object.keys(campos)) {
    next[id] = { ...campos[id] }
  }
  const suma = () => order.reduce((s, id) => s + (Number(next[id]?.porcentajeMaximo) || 0), 0)
  let iter = 0
  while (suma() > 100 + 1e-6 && iter < order.length * 4) {
    iter += 1
    const total = suma()
    let adjusted = false
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i]
      const row = next[id]
      if (!row) continue
      const curM = Number(row.porcentajeMaximo) || 0
      const sumOtros = total - curM
      const cap = Math.max(0, redondearPorcentaje2(100 - sumOtros))
      if (curM > cap + 1e-9) {
        const min = Math.min(Number(row.porcentajeMinimo) || 0, cap)
        next[id] = { ...row, porcentajeMaximo: cap, porcentajeMinimo: min }
        adjusted = true
        break
      }
    }
    if (!adjusted) break
  }
  return next
}

/**
 * Mantiene el orden relativo del usuario para ids que siguen existiendo y añade
 * ids nuevos al final según `canonical`, evitando un frame con lista vacía cuando
 * el estado `prev` aún no se ha sincronizado con datos nuevos del servidor.
 */
function reconcileSolicitudPagoOrder(prev: string[], canonical: string[]): string[] {
  const canonSet = new Set(canonical)
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of prev) {
    if (canonSet.has(id) && !seen.has(id)) {
      out.push(id)
      seen.add(id)
    }
  }
  for (const id of canonical) {
    if (!seen.has(id)) {
      out.push(id)
      seen.add(id)
    }
  }
  return out
}

// Componente Skeleton para cards (mismo sistema que portal proveedor)
const CardSkeleton = () => (
  <div className="group">
    <div className="bg-card-bg rounded-lg card-shadow-hover overflow-hidden">
      <div className="h-1 animate-pulse bg-[var(--skeleton-bg)]" />
      <div className="p-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg animate-pulse bg-[var(--skeleton-bg)]" />
            <div className="flex-1">
              <div className="h-4 rounded animate-pulse mb-2 w-3/4 bg-[var(--skeleton-bg)]" />
              <div className="h-3 rounded animate-pulse w-1/2 bg-[var(--skeleton-bg)]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 rounded-full animate-pulse bg-[var(--skeleton-bg)]" />
            <div className="h-6 w-6 rounded animate-pulse bg-[var(--skeleton-bg)]" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 rounded animate-pulse w-20 bg-[var(--skeleton-bg)]" />
          <div className="h-3 rounded animate-pulse w-16 bg-[var(--skeleton-bg)]" />
          <div className="h-3 rounded animate-pulse w-12 bg-[var(--skeleton-bg)]" />
        </div>
      </div>
    </div>
  </div>
)

function HistorialRowSk() {
  return (
    <div className="bg-card-bg border border-border-color rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="space-y-2 min-w-0 flex-1">
        <div className="h-4 w-48 max-w-full animate-pulse rounded bg-[var(--skeleton-bg)]" />
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--skeleton-bg)]" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-4 w-16 animate-pulse rounded bg-[var(--skeleton-bg)]" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--skeleton-bg)]" />
      </div>
    </div>
  )
}

const estadoSolicitudConfig: Record<
  SolicitudPagoResumen['estado'],
  { label: string; color: string }
> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-400' },
  EN_REVISION: { label: 'En Revisión', color: 'bg-blue-500' },
  OBSERVADA: { label: 'Observada', color: 'bg-yellow-500' },
  RECHAZADA: { label: 'Rechazada', color: 'bg-red-500' },
  APROBADO: { label: 'Aprobada', color: 'bg-emerald-500' },
}

/** Estados de documento OC (misma escala visual que solicitudes de pago). */
const estadoDocumentoOCConfig: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-400' },
  EN_REVISION: { label: 'En Revisión', color: 'bg-blue-500' },
  OBSERVADA: { label: 'Observada', color: 'bg-yellow-500' },
  RECHAZADA: { label: 'Rechazada', color: 'bg-red-500' },
  APROBADO: { label: 'Aprobado', color: 'bg-emerald-500' },
}

type HistorialExpedienteItem =
  | { kind: 'solicitud'; sortTs: number; solicitud: SolicitudPagoResumen }
  | { kind: 'documento'; sortTs: number; documento: DocumentoOC }

export default function ExpedientePage() {
  const params = useParams()
  const codigo = params.codigo as string

  // Estados para los modales
  const [showModalSolicitud, setShowModalSolicitud] = useState(false)
  const [showModalDocumento, setShowModalDocumento] = useState(false)
  const [showHistorialChecklistModal, setShowHistorialChecklistModal] = useState(false)
  const [historialSelectedTipoPago, setHistorialSelectedTipoPago] = useState<string | null>(null)
  const [historialSelectedDocumentoId, setHistorialSelectedDocumentoId] = useState<string | null>(null)
  const [historialEntidadAprobacion, setHistorialEntidadAprobacion] =
    useState<EntidadAprobacionRef | null>(null)
  
  // Estado global temporal para los items agregados
  const [itemsAgregados, setItemsAgregados] = useState<ExpedienteItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  /** Orden visual de filas en la columna Solicitudes (ids de tipo o item local). */
  const [solicitudPagoOrder, setSolicitudPagoOrder] = useState<string[]>([])
  const solicitudPagoIdsCanonicalRef = useRef<string[]>([])
  const effectiveSolicitudOrderRef = useRef<string[]>([])
  /** Campos editables en UI; se envían en guardar expediente (solo filas nuevas). */
  const [solicitudPagoCampos, setSolicitudPagoCampos] = useState<
    Record<string, SolicitudPagoCamposLocales>
  >({})
  const [solicitudPagoEdicionColumna, setSolicitudPagoEdicionColumna] = useState(false)
  const [solicitudPagoDragId, setSolicitudPagoDragId] = useState<string | null>(null)

  const [documentoOCCampos, setDocumentoOCCampos] = useState<
    Record<string, DocumentoOCCamposLocales>
  >({})
  const [documentoOCEdicionColumna, setDocumentoOCEdicionColumna] = useState(false)

  /** Filas de BD marcadas para quitar al guardar (la papelera solo se ofrece en UI si expediente está configurado). */
  const [idsTipoPagoExcluidos, setIdsTipoPagoExcluidos] = useState<string[]>([])
  const [idsDocumentoExcluidos, setIdsDocumentoExcluidos] = useState<string[]>([])
  const [firmaInicialEdicion, setFirmaInicialEdicion] = useState<string | null>(null)
  const firmaEditResetRef = useRef(true)
  /** Se incrementa tras guardar en edición para fijar la firma base = firmaActual (evita desajuste con el efecto que lee solo servidor). */
  const [edicionGuardadaVersion, setEdicionGuardadaVersion] = useState(0)

  // Hook para guardar expediente
  const guardarExpedienteMutation = useGuardarExpedienteConItems()
  const actualizarExpedienteMutation = useActualizarExpedienteItems()

  // Hook para verificar si ya existe un expediente (usando codigo)
  const { data: expedienteExistente, isLoading: loadingExpediente } = useExpedientePorCodigo(codigo)

  // Determinar si estamos en modo edicion
  const isEditMode = !!expedienteExistente && !loadingExpediente
  const expedienteId = expedienteExistente?.id

  // Hook para obtener expediente completo con relaciones (solo en modo edicion)
  const { data: expedienteCompletoData, isLoading: loadingExpedienteCompleto } = useExpedienteCompleto(
    isEditMode && expedienteId ? expedienteId : ''
  )
  const expedienteCompleto = (expedienteCompletoData as any)?.obtenerExpedienteCompleto

  const estadoExpedienteNorm = (expedienteExistente?.estado ?? '').toLowerCase()
  const mostrarHistorialSolicitudes =
    isEditMode && Boolean(expedienteId) && estadoExpedienteNorm !== 'configurado'

  const { data: solicitudes = [], isLoading: isLoadingSolicitudes } = useSolicitudesPorExpediente(
    mostrarHistorialSolicitudes && expedienteId ? expedienteId : ''
  )

  const documentosParaHistorial = useMemo(
    () => (expedienteCompleto?.documentos ?? EMPTY_DOCUMENTOS) as DocumentoOC[],
    [expedienteCompleto?.documentos]
  )

  const historialExpedienteItems = useMemo((): HistorialExpedienteItem[] => {
    const items: HistorialExpedienteItem[] = []
    for (const s of solicitudes) {
      const t = new Date(s.fechaCreacion).getTime()
      items.push({
        kind: 'solicitud',
        sortTs: Number.isFinite(t) ? t : 0,
        solicitud: s,
      })
    }
    for (const d of documentosParaHistorial) {
      const raw = d.fechaCarga as string | Date | undefined
      const t = raw != null && raw !== '' ? new Date(raw).getTime() : 0
      items.push({
        kind: 'documento',
        sortTs: Number.isFinite(t) ? t : 0,
        documento: d,
      })
    }
    items.sort((a, b) => b.sortTs - a.sortTs)
    return items
  }, [solicitudes, documentosParaHistorial])

  const isLoadingHistorialExpediente =
    isLoadingSolicitudes || (mostrarHistorialSolicitudes && loadingExpedienteCompleto)

  /** Papelera en cards de BD: solo si el expediente está en `configurado` (el backend no limita por estado). */
  const puedeEliminarPersistidos = expedienteExistente?.estado === 'configurado'

  useEffect(() => {
    setIdsTipoPagoExcluidos([])
    setIdsDocumentoExcluidos([])
    setFirmaInicialEdicion(null)
    firmaEditResetRef.current = true
  }, [expedienteId])

  // Items existentes del backend (referencias estables cuando no hay datos)
  const tiposPagoExistentes = useMemo(
    () => expedienteCompleto?.tiposPago ?? EMPTY_TIPOS_PAGO,
    [expedienteCompleto?.tiposPago]
  )
  const documentosExistentes = useMemo(
    () => expedienteCompleto?.documentos ?? EMPTY_DOCUMENTOS,
    [expedienteCompleto?.documentos]
  )

  const tiposPagoExistentesVisibles = useMemo(
    () => tiposPagoExistentes.filter((tp: { id: string }) => !idsTipoPagoExcluidos.includes(tp.id)),
    [tiposPagoExistentes, idsTipoPagoExcluidos]
  )
  const documentosExistentesVisibles = useMemo(
    () =>
      documentosExistentes.filter((doc: { id: string }) => !idsDocumentoExcluidos.includes(doc.id)),
    [documentosExistentes, idsDocumentoExcluidos]
  )

  // Obtener datos de la OC usando el hook de ordenes de compra
  const { ordenesCompra, isLoading: loadingOrdenesCompra } = useOrdenesCompra({ 
    page: 1, 
    limit: 1,
    searchTerm: codigo 
  })

  // Encontrar la OC especifica por codigo
  const ocData = ordenesCompra?.data?.find(oc => oc.codigo_orden === codigo)

  // Estado de carga combinado: skeleton mientras carga cualquier dato importante
  const isLoading = loadingExpediente || (isEditMode && loadingExpedienteCompleto) || loadingOrdenesCompra

  const handleSuccess = (nuevoItem: ExpedienteItem) => {
    // Agregar item al estado local
    setItemsAgregados(prev => [...prev, nuevoItem])
  }

  const handleEliminarItem = (itemId: string) => {
    setItemsAgregados(prev => prev.filter(item => item.id !== itemId))
  }

  const handleAccionHistorialSolicitud = (solicitud: SolicitudPagoResumen) => {
    setHistorialSelectedDocumentoId(null)
    setHistorialSelectedTipoPago(solicitud.tipoPagoOCId)
    if (solicitud.estado === 'BORRADOR') {
      setHistorialEntidadAprobacion(null)
    } else {
      setHistorialEntidadAprobacion({
        entidadTipo: 'solicitud_pago',
        entidadId: solicitud.id,
      })
    }
    setShowHistorialChecklistModal(true)
  }

  /** Misma regla que el portal proveedor: revisión con entidad o borrador solo con documento seleccionado. */
  const handleAccionHistorialDocumentoOc = (documento: DocumentoOC) => {
    const estado = (documento.estado || '').toUpperCase()
    const abreConRevision =
      estado === 'EN_REVISION' ||
      estado === 'OBSERVADA' ||
      estado === 'APROBADO' ||
      estado === 'RECHAZADA'
    setHistorialSelectedTipoPago(null)
    setHistorialSelectedDocumentoId(documento.id)
    if (abreConRevision) {
      setHistorialEntidadAprobacion({
        entidadTipo: 'documento_oc',
        entidadId: documento.id,
      })
    } else {
      setHistorialEntidadAprobacion(null)
    }
    setShowHistorialChecklistModal(true)
  }

  const handleGuardarTodo = async () => {
    if (isEditMode && expedienteId) {
      if (!hayCambiosEdicion && totalNuevos === 0) {
        toast.error('No hay cambios para guardar')
        return
      }
      if (loadingExpedienteCompleto || firmaInicialEdicion === null) {
        toast.error('Espera a que cargue el expediente')
        return
      }

      setIsSaving(true)
      try {
        const solicitudesPago = effectiveSolicitudOrderRef.current
          .map((rowId, idx) => {
            const row = solicitudPagoMap.get(rowId)
            if (!row) return null
            const c = solicitudPagoCampos[rowId] ?? {
              porcentajeMaximo: 0,
              porcentajeMinimo: 0,
              permiteVincularReportes: row._origen !== 'configurado',
            }
            const rawMax = Number(c.porcentajeMaximo) || 0
            const rawMin = Number(c.porcentajeMinimo) || 0
            const porcentajeMaximo = rawMax > 0 ? Math.min(100, rawMax) : undefined
            const porcentajeMinimo =
              porcentajeMaximo !== undefined && rawMin > 0 ? Math.min(100, rawMin) : undefined
            if (row._origen === 'configurado') {
              const catId = row.categoriaChecklistId ?? row.categoria?.id
              const plantillaId = row.checklistId || row.checklist?.id
              if (!catId || !plantillaId) return null
              return {
                id: row.id as string,
                categoriaChecklistId: catId,
                plantillaChecklistId: plantillaId,
                orden: idx + 1,
                permiteVincularReportes: c.permiteVincularReportes === true,
                ...(porcentajeMaximo !== undefined ? { porcentajeMaximo } : {}),
                ...(porcentajeMinimo !== undefined ? { porcentajeMinimo } : {}),
              }
            }
            const item = row as ExpedienteItem
            return {
              categoriaChecklistId: item.categoriaChecklistId,
              plantillaChecklistId: item.plantillaChecklistId,
              orden: idx + 1,
              permiteVincularReportes: c.permiteVincularReportes === true,
              ...(porcentajeMaximo !== undefined ? { porcentajeMaximo } : {}),
              ...(porcentajeMinimo !== undefined ? { porcentajeMinimo } : {}),
            }
          })
          .filter((x): x is NonNullable<typeof x> => x != null)

        const documentosOC = todosDocumentos.map((d: any) => {
          const obligatorio = documentoOCCampos[d.id]?.obligatorio !== false
          const bloqueaSolicitudPago =
            documentoOCCampos[d.id]?.bloqueaSolicitudPago === true
          if (d._origen === 'configurado') {
            const catId = d.checklist?.categoriaChecklistId
            const plantillaId = d.checklistId || d.checklist?.id
            return {
              id: d.id as string,
              categoriaChecklistId: catId || '',
              plantillaChecklistId: plantillaId || '',
              obligatorio,
              bloqueaSolicitudPago,
            }
          }
          return {
            categoriaChecklistId: d.categoriaChecklistId,
            plantillaChecklistId: d.plantillaChecklistId,
            obligatorio,
            bloqueaSolicitudPago,
          }
        })

        await actualizarExpedienteMutation.mutateAsync({
          expedienteId,
          ocCodigo: codigo,
          solicitudesPago,
          documentosOC,
        })

        toast.success('Expediente actualizado')
        setItemsAgregados([])
        setIdsTipoPagoExcluidos([])
        setIdsDocumentoExcluidos([])
        firmaEditResetRef.current = false
        setEdicionGuardadaVersion((v) => v + 1)
      } catch (error) {
        console.error('Error al actualizar expediente:', error)
        toast.error('Error al actualizar el expediente')
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (itemsAgregados.length === 0) {
      toast.error('No hay items para guardar')
      return
    }

    if (!ocData) {
      toast.error('No se encontraron los datos de la orden de compra')
      return
    }

    setIsSaving(true)

    try {
      const solicitudesNuevasList = itemsAgregados.filter((item) => item.tipo === 'solicitud-pago')
      const nuevosIds = new Set(solicitudesNuevasList.map((i) => i.id))
      const orderedNuevoIds = effectiveSolicitudOrderRef.current.filter((id) =>
        nuevosIds.has(id)
      )
      for (const item of solicitudesNuevasList) {
        if (!orderedNuevoIds.includes(item.id)) orderedNuevoIds.push(item.id)
      }

      const solicitudesPago = orderedNuevoIds
        .map((rowId, idx) => {
          const item = solicitudesNuevasList.find((i) => i.id === rowId)
          if (!item) return null
          const c = solicitudPagoCampos[rowId] ?? {
            porcentajeMaximo: 0,
            porcentajeMinimo: 0,
            permiteVincularReportes: true,
          }
          const rawMax = Number(c.porcentajeMaximo) || 0
          const rawMin = Number(c.porcentajeMinimo) || 0
          const porcentajeMaximo = rawMax > 0 ? Math.min(100, rawMax) : undefined
          const porcentajeMinimo =
            porcentajeMaximo !== undefined && rawMin > 0 ? Math.min(100, rawMin) : undefined
          const base = {
            categoriaChecklistId: item.categoriaChecklistId,
            plantillaChecklistId: item.plantillaChecklistId,
            orden: idx + 1,
            permiteVincularReportes: c.permiteVincularReportes === true,
          }
          return {
            ...base,
            ...(porcentajeMaximo !== undefined ? { porcentajeMaximo } : {}),
            ...(porcentajeMinimo !== undefined ? { porcentajeMinimo } : {}),
          }
        })
        .filter((x): x is NonNullable<typeof x> => x != null)

      const documentosOC = itemsAgregados
        .filter((item) => item.tipo === 'documento-oc')
        .map((item) => ({
          categoriaChecklistId: item.categoriaChecklistId,
          plantillaChecklistId: item.plantillaChecklistId,
          obligatorio: documentoOCCampos[item.id]?.obligatorio !== false,
          bloqueaSolicitudPago: documentoOCCampos[item.id]?.bloqueaSolicitudPago === true,
        }))

      const ocDataForBackend = {
        id: ocData.id,
        codigo: ocData.codigo_orden,
        proveedorId: ocData.proveedor_id || 'sin-proveedor',
        proveedorNombre: ocData.proveedor?.nombre_comercial || 'N/A',
        montoContrato: ocData.total || 0,
        fechaInicioContrato: ocData.fecha_ini || '',
        fechaFinContrato: ocData.fecha_fin || '',
        descripcion: ocData.descripcion || '',
      }

      await guardarExpedienteMutation.mutateAsync({
        ocData: ocDataForBackend,
        adminCreadorId: 'admin-temporal',
        solicitudesPago,
        documentosOC,
      })

      toast.success('Expediente guardado exitosamente')
      setItemsAgregados([])
    } catch (error) {
      console.error('Error al guardar expediente:', error)
      toast.error('Error al guardar el expediente')
    } finally {
      setIsSaving(false)
    }
  }

  // Filtrar items nuevos por tipo (memo: evita nuevo array cada render si itemsAgregados no cambió)
  const solicitudesPagoNuevas = useMemo(
    () => itemsAgregados.filter((item) => item.tipo === 'solicitud-pago'),
    [itemsAgregados]
  )
  const documentosOCNuevos = useMemo(
    () => itemsAgregados.filter((item) => item.tipo === 'documento-oc'),
    [itemsAgregados]
  )

  /** IDs de plantilla checklist ya usados (expediente en BD + fila pendiente local). */
  const plantillasIdsSolicitudOcupadas = useMemo(() => {
    const desdeBd = tiposPagoExistentesVisibles
      .map((tp: { checklistId?: string; checklist?: { id?: string } }) => tp.checklistId || tp.checklist?.id || '')
      .filter(Boolean) as string[]
    const desdeLocal = solicitudesPagoNuevas.map((i) => i.plantillaChecklistId).filter(Boolean)
    return [...new Set([...desdeBd, ...desdeLocal])]
  }, [tiposPagoExistentesVisibles, solicitudesPagoNuevas])

  const plantillasIdsDocumentoOcupadas = useMemo(() => {
    const desdeBd = documentosExistentesVisibles
      .map((doc: { checklistId?: string; checklist?: { id?: string } }) => doc.checklistId || doc.checklist?.id || '')
      .filter(Boolean) as string[]
    const desdeLocal = documentosOCNuevos.map((i) => i.plantillaChecklistId).filter(Boolean)
    return [...new Set([...desdeBd, ...desdeLocal])]
  }, [documentosExistentesVisibles, documentosOCNuevos])

  /** Mismo criterio que la firma inicial (`orden` en servidor) para que no quede “Edición pendiente” tras guardar. */
  const tiposPagoExistentesVisiblesOrdenados = useMemo(
    () =>
      [...tiposPagoExistentesVisibles].sort(
        (a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)
      ),
    [tiposPagoExistentesVisibles]
  )

  // Combinar existentes + nuevos en listas unificadas
  const todasSolicitudesBase = useMemo(
    () => [
      ...tiposPagoExistentesVisiblesOrdenados.map((tp: any) => ({ ...tp, _origen: 'configurado' as const })),
      ...solicitudesPagoNuevas.map((item) => ({ ...item, _origen: 'nuevo' as const })),
    ],
    [tiposPagoExistentesVisiblesOrdenados, solicitudesPagoNuevas]
  )

  const solicitudPagoIdsCanonical = useMemo(
    () => todasSolicitudesBase.map((r: { id: string }) => r.id),
    [todasSolicitudesBase]
  )
  solicitudPagoIdsCanonicalRef.current = solicitudPagoIdsCanonical

  const solicitudPagoIdsKey = useMemo(
    () => solicitudPagoIdsCanonical.join('\u001f'),
    [solicitudPagoIdsCanonical]
  )

  const effectiveSolicitudOrder = useMemo(
    () => reconcileSolicitudPagoOrder(solicitudPagoOrder, solicitudPagoIdsCanonical),
    [solicitudPagoOrder, solicitudPagoIdsCanonical]
  )
  effectiveSolicitudOrderRef.current = effectiveSolicitudOrder

  const todasSolicitudesBaseRef = useRef(todasSolicitudesBase)
  todasSolicitudesBaseRef.current = todasSolicitudesBase

  useLayoutEffect(() => {
    setSolicitudPagoOrder((prev) => {
      const next = reconcileSolicitudPagoOrder(prev, solicitudPagoIdsCanonicalRef.current)
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev
      return next
    })
  }, [solicitudPagoIdsCanonical])

  useLayoutEffect(() => {
    const base = todasSolicitudesBaseRef.current as any[]
    const validIds = new Set(base.map((r: { id: string }) => r.id))
    setSolicitudPagoCampos((prev) => {
      const removed = Object.keys(prev).some((k) => !validIds.has(k))
      const added = base.some((row: { id: string }) => prev[row.id] === undefined)
      if (!removed && !added) return prev

      const next: Record<string, SolicitudPagoCamposLocales> = {}
      for (const id of validIds) {
        if (prev[id]) next[id] = prev[id]
      }
      for (const row of base) {
        if (next[row.id] !== undefined) continue
        if (row._origen === 'configurado') {
          next[row.id] = {
            porcentajeMaximo: Number(row.porcentajeMaximo) || 0,
            porcentajeMinimo: Number(row.porcentajeMinimo) || 0,
            permiteVincularReportes: row.permiteVincularReportes === true,
          }
        } else {
          next[row.id] = {
            porcentajeMaximo: 0,
            porcentajeMinimo: 0,
            permiteVincularReportes: true,
          }
        }
      }
      const orderIds = base.map((r: { id: string }) => r.id)
      return normalizarSumaPorcentajesMax100(next, orderIds)
    })
  }, [solicitudPagoIdsKey])

  const solicitudPagoMap = useMemo(() => {
    const m = new Map<string, any>()
    for (const row of todasSolicitudesBase as any[]) {
      m.set(row.id, row)
    }
    return m
  }, [todasSolicitudesBase])

  const todasSolicitudesOrdenadas = useMemo(() => {
    return effectiveSolicitudOrder
      .map((id) => solicitudPagoMap.get(id))
      .filter(Boolean) as any[]
  }, [effectiveSolicitudOrder, solicitudPagoMap])

  const sumaPorcentajeMaximoSolicitudes = useMemo(() => {
    let s = 0
    for (const id of effectiveSolicitudOrder) {
      const c = solicitudPagoCampos[id]
      if (c) s += Number(c.porcentajeMaximo) || 0
    }
    return s
  }, [effectiveSolicitudOrder, solicitudPagoCampos])

  const actualizarSolicitudPagoCampo = useCallback(
    (rowId: string, patch: Partial<SolicitudPagoCamposLocales>) => {
      setSolicitudPagoCampos((prev) => {
        const cur = prev[rowId]
        if (!cur) return prev

        const soloReportes =
          patch.permiteVincularReportes !== undefined &&
          patch.porcentajeMaximo === undefined &&
          patch.porcentajeMinimo === undefined
        if (soloReportes) {
          return {
            ...prev,
            [rowId]: {
              ...cur,
              permiteVincularReportes: patch.permiteVincularReportes as boolean,
            },
          }
        }

        const order = effectiveSolicitudOrderRef.current
        const rawMax =
          patch.porcentajeMaximo !== undefined
            ? Number(patch.porcentajeMaximo)
            : Number(cur.porcentajeMaximo)
        const rawMin =
          patch.porcentajeMinimo !== undefined
            ? Number(patch.porcentajeMinimo)
            : Number(cur.porcentajeMinimo)
        let max = Math.max(0, Number.isFinite(rawMax) ? rawMax : 0)

        if (patch.porcentajeMaximo !== undefined) {
          let sumaOtros = 0
          for (const id of order) {
            if (id === rowId) continue
            const row = prev[id]
            sumaOtros += Number(row?.porcentajeMaximo) || 0
          }
          const topeRestante = Math.max(0, redondearPorcentaje2(100 - sumaOtros))
          max = redondearPorcentaje2(Math.min(max, topeRestante))
        }

        let min = Math.max(0, Number.isFinite(rawMin) ? rawMin : 0)
        if (min > max) min = max
        return {
          ...prev,
          [rowId]: {
            porcentajeMaximo: max,
            porcentajeMinimo: min,
            permiteVincularReportes:
              patch.permiteVincularReportes !== undefined
                ? patch.permiteVincularReportes
                : cur.permiteVincularReportes,
          },
        }
      })
    },
    []
  )

  const moverSolicitudPago = useCallback((dragId: string, targetId: string) => {
    if (dragId === targetId) return
    setSolicitudPagoOrder((prev) => {
      const order = reconcileSolicitudPagoOrder(prev, solicitudPagoIdsCanonicalRef.current)
      const i = order.indexOf(dragId)
      const j = order.indexOf(targetId)
      if (i === -1 || j === -1) return prev
      const copy = [...order]
      copy.splice(i, 1)
      copy.splice(j, 0, dragId)
      return copy
    })
  }, [])

  const todosDocumentos = useMemo(
    () => [
      ...documentosExistentesVisibles.map((doc: any) => ({ ...doc, _origen: 'configurado' as const })),
      ...documentosOCNuevos.map((item) => ({ ...item, _origen: 'nuevo' as const })),
    ],
    [documentosExistentesVisibles, documentosOCNuevos]
  )

  const documentoOCIdsKey = useMemo(
    () => todosDocumentos.map((d: { id: string }) => d.id).join('\u001f'),
    [todosDocumentos]
  )

  const todosDocumentosRef = useRef(todosDocumentos)
  todosDocumentosRef.current = todosDocumentos

  useLayoutEffect(() => {
    const base = todosDocumentosRef.current as any[]
    const validIds = new Set(base.map((r: { id: string }) => r.id))
    setDocumentoOCCampos((prev) => {
      const removed = Object.keys(prev).some((k) => !validIds.has(k))
      const added = base.some((row: { id: string }) => prev[row.id] === undefined)
      if (!removed && !added) return prev

      const next: Record<string, DocumentoOCCamposLocales> = {}
      for (const id of validIds) {
        if (prev[id]) {
          next[id] = {
            obligatorio: prev[id].obligatorio,
            bloqueaSolicitudPago: prev[id].bloqueaSolicitudPago ?? false,
          }
        }
      }
      for (const row of base) {
        if (next[row.id] !== undefined) continue
        if (row._origen === 'configurado') {
          next[row.id] = {
            obligatorio: row.obligatorio === true,
            bloqueaSolicitudPago: row.bloqueaSolicitudPago === true,
          }
        } else {
          next[row.id] = { obligatorio: true, bloqueaSolicitudPago: false }
        }
      }
      return next
    })
  }, [documentoOCIdsKey])

  const actualizarDocumentoOCCampos = useCallback(
    (rowId: string, patch: Partial<DocumentoOCCamposLocales>) => {
      setDocumentoOCCampos((prev) => {
        const cur = prev[rowId]
        if (!cur) return prev
        return { ...prev, [rowId]: { ...cur, ...patch } }
      })
    },
    []
  )

  const firmaActual = useMemo(() => {
    if (!isEditMode) return ''
    const partesCampos = effectiveSolicitudOrder.map((id) => {
      const c = solicitudPagoCampos[id]
      return [
        id,
        c?.porcentajeMaximo ?? 0,
        c?.porcentajeMinimo ?? 0,
        c?.permiteVincularReportes === true,
      ].join(':')
    })
    const campos = [...partesCampos].sort().join('|')
    const docOblig = todosDocumentos
      .map((d: any) => {
        const c = documentoOCCampos[d.id]
        const oblig =
          c != null
            ? c.obligatorio === true
            : d._origen === 'configurado'
              ? d.obligatorio === true
              : true
        const bloquea =
          c != null
            ? c.bloqueaSolicitudPago === true
            : d._origen === 'configurado'
              ? d.bloqueaSolicitudPago === true
              : false
        return `${d.id}:${oblig}:${bloquea}`
      })
      .sort()
      .join(',')
    return JSON.stringify({
      order: effectiveSolicitudOrder.join(','),
      campos,
      docIds: todosDocumentos
        .map((d: { id: string }) => d.id)
        .sort()
        .join(','),
      docOblig,
    })
  }, [isEditMode, effectiveSolicitudOrder, solicitudPagoCampos, todosDocumentos, documentoOCCampos])

  const firmaActualRef = useRef(firmaActual)
  firmaActualRef.current = firmaActual

  useEffect(() => {
    if (!isEditMode || !expedienteCompleto || loadingExpedienteCompleto) return
    if (!firmaEditResetRef.current) return
    firmaEditResetRef.current = false
    const tp = expedienteCompleto.tiposPago ?? []
    const docs = expedienteCompleto.documentos ?? []
    const order = [...tp]
      .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((t: any) => t.id)
    const partesCampos = order.map((id: string) => {
      const t = tp.find((x: any) => x.id === id)
      return [
        id,
        t?.porcentajeMaximo ?? 0,
        t?.porcentajeMinimo ?? 0,
        t?.permiteVincularReportes === true,
      ].join(':')
    })
    const campos = [...partesCampos].sort().join('|')
    const docOblig = docs
      .map(
        (d: any) =>
          `${d.id}:${d.obligatorio === true}:${d.bloqueaSolicitudPago === true}`
      )
      .sort()
      .join(',')
    setFirmaInicialEdicion(
      JSON.stringify({
        order: order.join(','),
        campos,
        docIds: docs.map((d: any) => d.id).sort().join(','),
        docOblig,
      })
    )
  }, [isEditMode, expedienteCompleto, loadingExpedienteCompleto, expedienteId])

  useEffect(() => {
    if (edicionGuardadaVersion === 0 || !isEditMode) return
    setFirmaInicialEdicion(firmaActualRef.current)
  }, [edicionGuardadaVersion, isEditMode])

  const hayCambiosEdicion =
    isEditMode && firmaInicialEdicion !== null && firmaActual !== firmaInicialEdicion

  const excluirTipoPagoPersistido = useCallback(
    (id: string) => {
      if (!puedeEliminarPersistidos) return
      setIdsTipoPagoExcluidos((prev) => (prev.includes(id) ? prev : [...prev, id]))
    },
    [puedeEliminarPersistidos]
  )

  const excluirDocumentoPersistido = useCallback(
    (id: string) => {
      if (!puedeEliminarPersistidos) return
      setIdsDocumentoExcluidos((prev) => (prev.includes(id) ? prev : [...prev, id]))
    },
    [puedeEliminarPersistidos]
  )

  // Total items nuevos
  const totalNuevos = itemsAgregados.length
  const mostrarResumenGuardar =
    (!isEditMode && totalNuevos > 0) || (isEditMode && (totalNuevos > 0 || hayCambiosEdicion))

  return (
    <div className="space-y-3">
      {/* Header — mismos tokens que /proveedor/ordenes/[codigo] */}
      <div className="bg-background rounded-lg card-shadow backdrop-blur-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">
          <div className="flex items-start gap-3 min-w-0 sm:items-center sm:gap-4">
            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              size="sm"
              className="shrink-0 h-8 px-2"
              aria-label="Volver"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            </Button>

            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-text-primary leading-tight">
                {isEditMode ? 'Editar Expediente' : 'Expediente de Orden de Compra'}
              </h1>
              <div className="flex flex-col gap-1 mt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-0">
                <span className="text-xs text-text-secondary break-all sm:break-normal">
                  Código:{' '}
                  <span className="font-mono bg-card-bg px-1 py-0.5 rounded text-xs inline-block max-w-full">
                    {codigo}
                  </span>
                </span>
                {isEditMode && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Estado: {expedienteExistente?.estado || 'Activo'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {mostrarResumenGuardar && (
            <div className="bg-card-bg rounded-lg p-4 border border-border-color">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-text-primary mb-2">
                    {isEditMode ? 'Cambios pendientes' : 'Items nuevos por guardar'}
                  </h3>
                  <div className="flex flex-col gap-2 text-xs text-text-secondary md:flex-row md:flex-wrap md:items-center md:gap-4">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                      <span>Revisa antes de confirmar</span>
                    </div>
                    <span>
                      {isEditMode && hayCambiosEdicion && (
                        <span className="font-semibold text-text-primary mr-2">Edición</span>
                      )}
                      <span className="font-semibold text-text-primary">{totalNuevos}</span> nuevos (
                      <span className="font-semibold">{solicitudesPagoNuevas.length}</span> solicitudes,
                      <span className="font-semibold"> {documentosOCNuevos.length}</span> documentos)
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleGuardarTodo}
                  disabled={isSaving || (isEditMode && (loadingExpedienteCompleto || firmaInicialEdicion === null))}
                  size="sm"
                  color="blue"
                  className="w-full shrink-0 justify-center md:w-auto"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {isSaving ? 'Guardando...' : 'Guardar Expediente'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listas unificadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Solicitudes de Pago */}
        <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
          <div className="bg-card-bg px-4 py-3 border-b border-border-color">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2">
              <h2 className="text-sm font-semibold text-text-primary flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                Solicitudes de Pago
                </div>
               
                <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 px-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {todasSolicitudesBase.length}
                </span>
                {solicitudPagoEdicionColumna && todasSolicitudesBase.length > 0 ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums leading-tight ${
                      sumaPorcentajeMaximoSolicitudes > 100
                        ? 'border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300'
                        : 'border-border-color bg-muted/50 text-text-secondary dark:bg-muted/30'
                    }`}
                    title={
                      sumaPorcentajeMaximoSolicitudes > 100
                        ? 'Suma % máximo (todos los tipos): excede 100%; ajusta antes de guardar.'
                        : 'Suma % máximo (todos los tipos)'
                    }
                  >
                    % máx{' '}
                    <span className="font-semibold">
                      {sumaPorcentajeMaximoSolicitudes.toFixed(2)}%
                    </span>
                    <span className="opacity-70">/100%</span>
                  </span>
                ) : null}
              </h2>
              <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0">
                {(todasSolicitudesBase.length > 0 || solicitudPagoEdicionColumna) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    title={solicitudPagoEdicionColumna ? 'Salir de edición' : 'Editar columna'}
                    onClick={() => setSolicitudPagoEdicionColumna((v) => !v)}
                    disabled={isLoading}
                    aria-label={solicitudPagoEdicionColumna ? 'Salir de edición' : 'Editar columna'}
                  >
                    {solicitudPagoEdicionColumna ? (
                      <Check className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => setShowModalSolicitud(true)}
                  className="flex flex-1 items-center justify-center gap-2 md:flex-initial"
                  color="blue"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Solicitud
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3 max-h-[min(70vh,28rem)] overflow-y-auto px-0 sm:px-2 pb-2 md:max-h-100">
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : todasSolicitudesBase.length === 0 ? (
              <div className="text-center py-8">
                <Plus className="w-8 h-8 text-text-secondary mx-auto mb-3" />
                <h3 className="text-sm font-medium text-text-primary mb-2">No hay solicitudes</h3>
                <p className="text-text-secondary mb-6 text-xs">
                  Agrega solicitudes de pago para construir tu expediente
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[min(70vh,28rem)] overflow-y-auto px-0 sm:px-2 pb-2 md:max-h-100">
                {todasSolicitudesOrdenadas.map((item: any, idx: number) => {
                  const campos = solicitudPagoCampos[item.id]
                  const ordenVisual = idx + 1
                  const subtituloSolicitudPago =
                    item._origen === 'configurado'
                      ? item.checklist?.nombre || item.checklist?.codigo
                      : item.plantilla?.nombre || item.plantilla?.codigo
                  return (
                    <div
                      key={item.id}
                      className="group"
                      onDragOver={
                        solicitudPagoEdicionColumna && solicitudPagoDragId
                          ? (e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = 'move'
                            }
                          : undefined
                      }
                      onDrop={
                        solicitudPagoEdicionColumna && solicitudPagoDragId
                          ? (e) => {
                              e.preventDefault()
                              if (solicitudPagoDragId) moverSolicitudPago(solicitudPagoDragId, item.id)
                              setSolicitudPagoDragId(null)
                            }
                          : undefined
                      }
                    >
                      <div
                        className={`bg-card-bg rounded-lg card-shadow-hover overflow-hidden ${
                          solicitudPagoDragId === item.id
                            ? 'ring-2 ring-blue-400 ring-offset-0 opacity-90'
                            : ''
                        }`}
                      >
                        <div className="h-1 bg-linear-to-r from-purple-500/30 to-blue-400/30 dark:from-purple-600/20 dark:to-blue-500/20" />
                        <div className="p-3">
                          <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-start md:justify-between md:gap-2">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              {solicitudPagoEdicionColumna ? (
                                <button
                                  type="button"
                                  draggable
                                  onDragStart={(e) => {
                                    setSolicitudPagoDragId(item.id)
                                    e.dataTransfer.effectAllowed = 'move'
                                    e.dataTransfer.setData('text/plain', item.id)
                                  }}
                                  onDragEnd={() => setSolicitudPagoDragId(null)}
                                  className="shrink-0 p-1 rounded text-text-secondary hover:text-text-primary cursor-grab active:cursor-grabbing"
                                  title="Arrastrar para reordenar"
                                  aria-label="Arrastrar para reordenar"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </button>
                              ) : null}

                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 shrink-0 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white">
                                  <Banknote className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-text-primary text-sm mb-1 break-words md:truncate">
                                    <span>
                                      {item._origen === 'configurado'
                                        ? item.categoria?.nombre || 'N/A'
                                        : item.categoria?.nombre || 'Sin categoria'}
                                    </span>
                                  </h3>
                                  {subtituloSolicitudPago ? (
                                    <p className="text-xs text-text-secondary line-clamp-2 md:line-clamp-1 break-words">
                                      {subtituloSolicitudPago}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:shrink-0 md:justify-end">
                            <div className="w-4 h-4 shrink-0 rounded-lg bg-blue-300 dark:bg-blue-900/30 flex items-center justify-center text-white text-xs">
                                {ordenVisual}
                              </div>
                              {item._origen === 'configurado' ? (
                                <>
                                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Configurado
                                  </span>
                                  {puedeEliminarPersistidos ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 h-6 w-6 p-0"
                                      title="Quitar del expediente al guardar"
                                      onClick={() => excluirTipoPagoPersistido(item.id)}
                                      aria-label="Quitar del expediente al guardar"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Nuevo
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-text-secondary h-6 w-6 p-0 hover:text-text-primary"
                                    onClick={() => handleEliminarItem(item.id)}
                                    aria-label="Eliminar solicitud"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {campos &&
                            (solicitudPagoEdicionColumna ? (
                              <div className="mt-3 space-y-3 pt-2 border-t border-border-color">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-0.5">
                                      máximo (contrato)
                                    </label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      className="h-8 text-xs"
                                      value={campos.porcentajeMaximo}
                                      onChange={(e) =>
                                        actualizarSolicitudPagoCampo(item.id, {
                                          porcentajeMaximo: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-text-secondary mb-0.5">
                                      mínimo
                                    </label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      className="h-8 text-xs"
                                      value={campos.porcentajeMinimo}
                                      onChange={(e) =>
                                        actualizarSolicitudPagoCampo(item.id, {
                                          porcentajeMinimo: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <label className="flex items-start gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 rounded border-border-color"
                                    checked={campos.permiteVincularReportes}
                                    onChange={(e) =>
                                      actualizarSolicitudPagoCampo(item.id, {
                                        permiteVincularReportes: e.target.checked,
                                      })
                                    }
                                  />
                                  <span className="text-xs text-text-primary">
                                    Reportes Obligatorios
                                    <span className="block text-[10px] text-text-secondary mt-0.5">
                                      Si aplica: será obligatorio vincular reportes en esa solicitud de pago
                                    </span>
                                  </span>
                                </label>
                              </div>
                            ) : (
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-secondary">
                                <span>
                                  <span className="font-medium text-text-primary">máx:</span>{' '}
                                  {campos.porcentajeMaximo.toLocaleString('es-PE', {
                                    maximumFractionDigits: 2,
                                  })}
                                  %
                                </span>
                                <span>
                                  <span className="font-medium text-text-primary">mín:</span>{' '}
                                  {campos.porcentajeMinimo.toLocaleString('es-PE', {
                                    maximumFractionDigits: 2,
                                  })}
                                  %
                                </span>
                                <span>
                                  <span className="font-medium text-text-primary">Reportes:</span>{' '}
                                  {campos.permiteVincularReportes ? (
                                    <span className="text-blue-600 dark:text-blue-400">Sí (estricto)</span>
                                  ) : (
                                    'No'
                                  )}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Documentos OC */}
        <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
          <div className="bg-card-bg px-4 py-3 border-b border-border-color">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2">
              <h2 className="text-sm font-semibold text-text-primary flex flex-wrap items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                Documentos
                <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-green-100 px-1.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {todosDocumentos.length}
                </span>
              </h2>
              <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0">
                {(todosDocumentos.length > 0 || documentoOCEdicionColumna) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    title={documentoOCEdicionColumna ? 'Salir de edición' : 'Editar columna'}
                    onClick={() => setDocumentoOCEdicionColumna((v) => !v)}
                    disabled={isLoading}
                    aria-label={documentoOCEdicionColumna ? 'Salir de edición' : 'Editar columna'}
                  >
                    {documentoOCEdicionColumna ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowModalDocumento(true)}
                  className="flex flex-1 items-center justify-center gap-2 md:flex-initial"
                  color="green"
                  size="sm"
                >
                  <FileText className="w-4 h-4" />
                  Agregar Documentos
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {isLoading ? (
              // Skeleton de carga mientras carga el expediente
              <div className="space-y-3 max-h-[min(70vh,28rem)] overflow-y-auto px-0 sm:px-2 pb-2 md:max-h-96">
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : todosDocumentos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-text-secondary mx-auto mb-3" />
                <h3 className="text-sm font-medium text-text-primary mb-2">No hay documentos</h3>
                <p className="text-text-secondary mb-6 text-xs">
                  Agrega los documentos requeridos para completar la orden de compra
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[min(70vh,28rem)] overflow-y-auto px-0 sm:px-2 pb-2 md:max-h-96">
                {todosDocumentos.map((item: any) => {
                  const esObligatorioUi = documentoOCCampos[item.id]?.obligatorio !== false
                  const bloqueaSolicitudPagoUi =
                    documentoOCCampos[item.id] != null
                      ? documentoOCCampos[item.id]!.bloqueaSolicitudPago === true
                      : item._origen === 'configurado'
                        ? item.bloqueaSolicitudPago === true
                        : false
                  const subtituloDocumentoOC =
                    item._origen === 'configurado'
                      ? item.checklist?.nombre || item.checklist?.codigo
                      : item.plantilla?.nombre || item.plantilla?.codigo
                  return (
                  <div key={item.id} className="group">
                    <div className="bg-card-bg rounded-lg card-shadow-hover overflow-hidden">
                      <div className='h-1 bg-linear-to-r from-green-500/30 to-emerald-400/30 dark:from-green-600/20 dark:to-emerald-500/20' />
                      <div className="p-3">
                        <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-start md:justify-between md:gap-2">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 shrink-0 rounded-lg bg-linear-to-r from-green-500 to-green-600 flex items-center justify-center text-white">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-text-primary text-sm mb-1 break-words md:truncate">
                                <span>
                                  {item._origen === 'configurado'
                                    ? item.checklist?.categoria?.nombre || 'N/A'
                                    : item.categoria?.nombre || 'Sin categoria'}
                                </span>
                              </h3>
                              {subtituloDocumentoOC ? (
                                <p className="text-xs text-text-secondary line-clamp-2 md:line-clamp-1 break-words">
                                  {subtituloDocumentoOC}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:shrink-0 md:justify-end">
                            {item._origen === 'configurado' ? (
                              <>
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Configurado
                                </span>
                                
                                {puedeEliminarPersistidos ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 h-6 w-6 p-0"
                                    title="Quitar del expediente al guardar"
                                    onClick={() => excluirDocumentoPersistido(item.id)}
                                    aria-label="Quitar del expediente al guardar"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                ) : null}
                              </>
                            ) : (
                              <>
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Nuevo
                                </span>
                                {bloqueaSolicitudPagoUi && (
                                  <span
                                    className="text-xs px-2 py-1 rounded-full font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
                                    title="No se podrán realizar solicitudes de pago hasta completar este documento"
                                  >
                                    Bloque solicitudes pago
                                  </span>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 h-6 w-6 p-0"
                                  onClick={() => handleEliminarItem(item.id)}
                                  aria-label="Eliminar documento"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {documentoOCEdicionColumna ? (
                          <div className="mt-3 space-y-3 pt-2 border-t border-border-color">
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-border-color"
                                checked={esObligatorioUi}
                                onChange={(e) =>
                                  actualizarDocumentoOCCampos(item.id, {
                                    obligatorio: e.target.checked,
                                  })
                                }
                              />
                              <span className="text-xs text-text-primary">
                                Documento obligatorio
                                <span className="block text-[10px] text-text-secondary mt-0.5">
                                  Si aplica, el proveedor deberá completarlo en el flujo de la OC
                                </span>
                              </span>
                            </label>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-border-color"
                                checked={bloqueaSolicitudPagoUi}
                                onChange={(e) =>
                                  actualizarDocumentoOCCampos(item.id, {
                                    bloqueaSolicitudPago: e.target.checked,
                                  })
                                }
                              />
                              <span className="text-xs text-text-primary">
                                Bloquea solicitudes pago
                                <span className="block text-[10px] text-text-secondary mt-0.5">
                                  No se podrán realizar solicitudes de pago hasta completar este documento primero
                                </span>
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-secondary">
                            <span>
                              <span className="font-medium text-text-primary">
                                Obligatorio:
                              </span>{' '}
                              {esObligatorioUi ? (
                                <span className="text-green-600 dark:text-green-400">Sí</span>
                              ) : (
                                'No'
                              )}
                            </span>
                            <span>
                              <span className="font-medium text-text-primary">
                                Bloquea solicitudes pago:
                              </span>{' '}
                              {bloqueaSolicitudPagoUi ? (
                                <span className="text-violet-600 dark:text-violet-400">Sí</span>
                              ) : (
                                'No'
                              )}
                            </span>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarHistorialSolicitudes ? (
        <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
          <div className="bg-card-bg px-4 py-3 border-b border-border-color">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 shrink-0" />
                Historial de solicitudes
              </h2>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {historialExpedienteItems.length} ítem{historialExpedienteItems.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="text-[11px] font-normal">
                  {solicitudes.length} solic. · {documentosParaHistorial.length} doc. OC
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-text-secondary mt-2 leading-snug">
              Solicitudes de pago y documentación OC del expediente (mismo criterio y detalle que en{' '}
              <span className="font-medium text-text-primary">/proveedor/ordenes</span>), ordenados por fecha más
              reciente.
            </p>
          </div>

          <div className="p-4">
            {isLoadingHistorialExpediente ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <HistorialRowSk key={i} />
                ))}
              </div>
            ) : historialExpedienteItems.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-text-secondary mx-auto mb-3" />
                <h3 className="text-sm font-medium text-text-primary mb-2">Sin movimientos aún</h3>
                <p className="text-text-secondary text-xs">
                  No hay solicitudes de pago ni documentos OC con actividad registrada en este expediente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {historialExpedienteItems.map((row) => {
                  if (row.kind === 'solicitud') {
                    const solicitud = row.solicitud
                    return (
                      <div
                        key={`sp-${solicitud.id}`}
                        className="bg-card-bg border border-border-color rounded-lg p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-medium shrink-0">
                              Solicitud de pago
                            </Badge>
                            <span className="text-xs font-semibold text-text-primary min-w-0">
                              {solicitud.tipoPagoOC?.categoria?.nombre
                                ? `TP-${solicitud.tipoPagoOC.orden} · ${solicitud.tipoPagoOC.categoria.nombre}`
                                : `TP-${solicitud.tipoPagoOC?.orden ?? '?'}`}
                            </span>
                          </div>
                          <span className="text-xs text-text-secondary">
                            {new Date(solicitud.fechaCreacion).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end sm:shrink-0">
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <span className="text-sm font-bold text-text-primary tabular-nums">
                              S/ {solicitud.montoSolicitado.toLocaleString('es-PE')}
                            </span>
                            <Badge
                              className={`${estadoSolicitudConfig[solicitud.estado]?.color ?? 'bg-gray-400'} text-white text-xs`}
                            >
                              {estadoSolicitudConfig[solicitud.estado]?.label ?? solicitud.estado}
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              onClick={() => handleAccionHistorialSolicitud(solicitud)}
                            >
                              <Eye className="w-3 h-3" />
                              Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const documento = row.documento
                  const estadoDoc = (documento.estado || '').toUpperCase()
                  const cfg = estadoDocumentoOCConfig[estadoDoc]
                  const fechaDoc =
                    documento.fechaCarga != null && String(documento.fechaCarga).trim() !== ''
                      ? new Date(documento.fechaCarga as string | Date).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : null
                  const tituloDoc =
                    documento.checklist?.nombre ||
                    documento.checklist?.categoria?.nombre ||
                    'Documento OC'

                  return (
                    <div
                      key={`doc-${documento.id}`}
                      className="bg-card-bg border border-border-color rounded-lg p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium shrink-0 border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                          >
                            Documento OC
                          </Badge>
                          <span className="text-xs font-semibold text-text-primary min-w-0 break-words">
                            {tituloDoc}
                          </span>
                        </div>
                        <span className="text-xs text-text-secondary">
                          {fechaDoc ?? 'Sin fecha de carga'}
                          {documento.checklist?.categoria?.nombre ? (
                            <span className="text-text-secondary/80">
                              {' '}
                              · {documento.checklist.categoria.nombre}
                            </span>
                          ) : null}
                        </span>
                        {documento.obligatorio ? (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">Obligatorio</span>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end sm:shrink-0">
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span className="text-xs text-text-secondary tabular-nums sm:min-w-[4.5rem] sm:text-right">
                            —
                          </span>
                          <Badge className={`${cfg?.color ?? 'bg-gray-400'} text-white text-xs`}>
                            {cfg?.label ?? documento.estado}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleAccionHistorialDocumentoOc(documento)}
                          >
                            <Eye className="w-3 h-3" />
                            Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {mostrarHistorialSolicitudes && expedienteCompleto ? (
        <ChecklistModal
          isOpen={showHistorialChecklistModal}
          onClose={() => {
            setShowHistorialChecklistModal(false)
            setHistorialSelectedTipoPago(null)
            setHistorialSelectedDocumentoId(null)
            setHistorialEntidadAprobacion(null)
          }}
          expedienteId={expedienteCompleto.id}
          entidadAprobacion={historialEntidadAprobacion}
          montoDisponible={expedienteCompleto.montoDisponible}
          montoContrato={expedienteCompleto.montoContrato}
          solicitudesExpediente={solicitudes}
          tiposPago={(expedienteCompleto.tiposPago || []) as TipoPagoOC[]}
          documentos={(expedienteCompleto.documentos || []) as DocumentoOC[]}
          selectedTipoPagoId={historialSelectedTipoPago || undefined}
          selectedDocumentoId={historialSelectedDocumentoId || undefined}
        />
      ) : null}

      {/* Modales - siempre para agregar nuevos */}
      <ModalChecklistSelector
        isOpen={showModalSolicitud}
        onClose={() => setShowModalSolicitud(false)}
        type="solicitud-pago"
        ordenCompraId={codigo}
        plantillasIdsOcupadas={plantillasIdsSolicitudOcupadas}
        onSuccess={handleSuccess}
      />
      
      <ModalChecklistSelector
        isOpen={showModalDocumento}
        onClose={() => setShowModalDocumento(false)}
        type="documento-oc"
        ordenCompraId={codigo}
        plantillasIdsOcupadas={plantillasIdsDocumentoOcupadas}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
