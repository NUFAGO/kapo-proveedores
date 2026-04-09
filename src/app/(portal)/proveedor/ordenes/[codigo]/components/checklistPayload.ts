/**
 * Payload para `procesarChecklistProveedor` / `procesarChecklistSubsanacion`.
 * Las URLs definitivas se obtienen tras subir con `useUpload` en el modal (DOCUMENTOS_PROVEEDOR).
 */

import type { Requisito } from '@/hooks/useExpedientePago'
import type { FileUploadResult } from '@/types/upload.types'

/** Coincide con enum GraphQL `ChecklistProveedorContexto` */
export type ChecklistProveedorContexto = 'solicitud_pago' | 'documento_oc'

export interface ArchivoChecklistInput {
  url: string
  nombreOriginal: string
  mimeType: string
  tamanioBytes: number
  fechaSubida: string
}

export interface RequisitoArchivosChecklistInput {
  requisitoDocumentoId: string
  archivos: ArchivoChecklistInput[]
}

/**
 * Un solo objeto = variables de `procesarChecklistProveedor(input: ...)`.
 * - solicitud_pago: tipoPagoOCId, montoSolicitado obligatorios; documentoOCId omitido.
 * - documento_oc: documentoOCId obligatorio; tipoPagoOCId y montoSolicitado omitidos.
 */
export interface ChecklistProveedorBatchInput {
  context: ChecklistProveedorContexto
  expedienteId: string
  tipoPagoOCId?: string
  montoSolicitado?: number
  documentoOCId?: string
  solicitanteId: string
  solicitanteNombre: string
  requisitosArchivos: RequisitoArchivosChecklistInput[]
  /** Solo solicitud_pago: ids Mongo de reportes operativos a vincular (opcional). */
  reporteSolicitudPagoIds?: string[]
}

/** Variables de `procesarChecklistSubsanacion` — entidad ya observada; solo requisitos con archivos nuevos. */
export interface ChecklistProveedorSubsanacionInput {
  context: ChecklistProveedorContexto
  expedienteId: string
  entidadId: string
  aprobacionId: string
  solicitanteId: string
  solicitanteNombre: string
  requisitosArchivos: RequisitoArchivosChecklistInput[]
  /** Solo solicitud_pago y si cambió respecto al monto previo: el backend actualiza solicitud y aprobación. */
  montoSolicitado?: number
}

export type ProveedorUserLike = {
  id: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  usuario: string
  proveedor_id: string
  proveedor_nombre: string
}

export function nombreCompletoProveedor(user: ProveedorUserLike): string {
  return [user.nombres, user.apellido_paterno, user.apellido_materno].filter(Boolean).join(' ').trim()
}

const MONTO_MAX_EPS = 0.005

export interface ValidateChecklistParams {
  mode: 'solicitud_pago' | 'documento_oc'
  montoSolicitudStr: string
  /** Tope del expediente: el monto a solicitar no puede superar este valor. */
  montoDisponibleExpediente?: number | null
  requisitos: Requisito[]
  uploadedFiles: Map<string, File[]>
  tieneUsuarioProveedor: boolean
}

export function etiquetaRequisito(r: Requisito): string {
  if (r.tipoRequisito === 'documento') {
    return r.plantillaDocumento?.nombrePlantilla ?? `Documento (orden ${r.orden})`
  }
  return r.formulario?.nombre ?? `Formulario (orden ${r.orden})`
}

export function validateChecklistSubmission(
  params: ValidateChecklistParams
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = []
  const {
    mode,
    montoSolicitudStr,
    montoDisponibleExpediente,
    requisitos,
    uploadedFiles,
    tieneUsuarioProveedor,
  } = params
  const sorted = [...requisitos].sort((a, b) => a.orden - b.orden)

  if (!tieneUsuarioProveedor) {
    errors.push('Debes iniciar sesión como proveedor para enviar el checklist.')
  }

  if (mode === 'solicitud_pago') {
    const raw = montoSolicitudStr.trim()
    if (raw === '') {
      errors.push('Ingresa el monto a solicitar.')
    } else {
      const normalized = raw.replace(',', '.')
      const n = Number(normalized)
      if (!Number.isFinite(n) || n < 0) {
        errors.push('El monto debe ser un número válido mayor o igual a 0.')
      } else if (
        montoDisponibleExpediente !== undefined &&
        montoDisponibleExpediente !== null &&
        Number.isFinite(montoDisponibleExpediente) &&
        n > montoDisponibleExpediente + MONTO_MAX_EPS
      ) {
        errors.push(
          `El monto no puede ser mayor al disponible a pagar (S/ ${montoDisponibleExpediente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`
        )
      }
    }
  }

  for (const r of sorted) {
    if (r.tipoRequisito === 'documento') {
      const files = uploadedFiles.get(r.id) ?? []
      if (r.obligatorio && files.length === 0) {
        errors.push(`Documento obligatorio sin archivos: ${etiquetaRequisito(r)}`)
      }
    } else if (r.tipoRequisito === 'formulario' && r.obligatorio) {
      errors.push(
        `Formulario obligatorio pendiente: ${etiquetaRequisito(r)} (aún no hay captura de respuestas en el modal)`
      )
    }
  }

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true }
}

export type ResultadoValidacionSubsanacion =
  | { valid: false; errors: string[] }
  | { valid: true }

/**
 * Subsanación: en requisitos cuya última entrega no está APROBADA (p. ej. OBSERVADO), la nueva entrega es obligatoria.
 * Requisitos ya APROBADOS: adjuntar archivos es opcional.
 */
export function validateChecklistSubsanacionParcial(params: {
  requisitos: Requisito[]
  uploadedFiles: Map<string, File[]>
  tieneUsuarioProveedor: boolean
  /** Estado de la última entrega por requisito (GraphQL). null = sin entrega registrada. */
  ultimaEntregaEstadoPorRequisito: Map<string, string | null | undefined>
}): ResultadoValidacionSubsanacion {
  const errors: string[] = []
  if (!params.tieneUsuarioProveedor) {
    errors.push('Debes iniciar sesión como proveedor para enviar la subsanación.')
  }

  const sorted = [...params.requisitos].sort((a, b) => a.orden - b.orden)
  let tieneAlgunArchivo = false
  let hayDocumentoRequisito = false
  let hayAlgunoQueExigeSubida = false

  for (const r of sorted) {
    if (r.tipoRequisito !== 'documento') continue
    hayDocumentoRequisito = true
    const files = params.uploadedFiles.get(r.id) ?? []
    if (files.length > 0) tieneAlgunArchivo = true

    const rawEstado = params.ultimaEntregaEstadoPorRequisito.get(r.id)
    const estado = (rawEstado != null && String(rawEstado) !== '' ? String(rawEstado) : '').toUpperCase()
    const ultimaFueAprobada = estado === 'APROBADO'

    const exigeNuevaEntrega = !ultimaFueAprobada
    if (exigeNuevaEntrega) {
      hayAlgunoQueExigeSubida = true
      if (files.length === 0) {
        errors.push(
          `Debes adjuntar una nueva entrega en: ${etiquetaRequisito(r)} (requisito observado o pendiente de corregir).`
        )
      }
    }
  }

  if (hayDocumentoRequisito && !hayAlgunoQueExigeSubida && !tieneAlgunArchivo) {
    errors.push(
      'Adjunta al menos un archivo: todos los requisitos figuran aprobados; solo puedes reemplazarlos de forma opcional.'
    )
  }

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true }
}

/** Cola de subida: mismo orden que `uploadMultipleFiles` → `successful`. */
export function collectChecklistFilesUploadQueue(
  requisitos: Requisito[],
  uploadedFiles: Map<string, File[]>
): { requisitoId: string; file: File }[] {
  const sorted = [...requisitos].sort((a, b) => a.orden - b.orden)
  const queue: { requisitoId: string; file: File }[] = []
  for (const r of sorted) {
    if (r.tipoRequisito !== 'documento') continue
    const files = uploadedFiles.get(r.id) ?? []
    for (const file of files) {
      queue.push({ requisitoId: r.id, file })
    }
  }
  return queue
}

/** Construye `requisitosArchivos` con URLs reales devueltas por el backend. */
export function requisitosArchivosDesdeUploads(
  requisitos: Requisito[],
  queue: { requisitoId: string; file: File }[],
  successful: FileUploadResult[]
): RequisitoArchivosChecklistInput[] {
  if (successful.length !== queue.length) {
    throw new Error('Inconsistencia entre archivos enviados y respuesta de subida')
  }
  const byReq = new Map<string, ArchivoChecklistInput[]>()
  for (let i = 0; i < queue.length; i++) {
    const { requisitoId, file } = queue[i]!
    const res = successful[i]!
    const arch: ArchivoChecklistInput = {
      url: res.url,
      nombreOriginal: res.originalName || file.name,
      mimeType: res.mimetype || file.type || 'application/octet-stream',
      tamanioBytes: res.size ?? file.size,
      fechaSubida: new Date().toISOString(),
    }
    const list = byReq.get(requisitoId) ?? []
    list.push(arch)
    byReq.set(requisitoId, list)
  }
  const sorted = [...requisitos].sort((a, b) => a.orden - b.orden)
  const items: RequisitoArchivosChecklistInput[] = []
  for (const r of sorted) {
    if (r.tipoRequisito !== 'documento') continue
    const archivos = byReq.get(r.id)
    if (archivos?.length) {
      items.push({ requisitoDocumentoId: r.id, archivos })
    }
  }
  return items
}

export interface BuildSolicitudBatchParams {
  expedienteId: string
  tipoPagoOCId: string
  montoSolicitado: number
  proveedorUser: ProveedorUserLike
  reporteSolicitudPagoIds?: string[]
}

export interface BuildDocumentoOCBatchParams {
  expedienteId: string
  documentoOCId: string
  proveedorUser: ProveedorUserLike
}

export function buildChecklistBatchSolicitud(p: BuildSolicitudBatchParams): ChecklistProveedorBatchInput {
  const reporteSolicitudPagoIds = p.reporteSolicitudPagoIds?.filter(
    (id) => String(id).trim().length > 0
  )
  return {
    context: 'solicitud_pago',
    expedienteId: p.expedienteId,
    tipoPagoOCId: p.tipoPagoOCId,
    montoSolicitado: p.montoSolicitado,
    solicitanteId: p.proveedorUser.id,
    solicitanteNombre: nombreCompletoProveedor(p.proveedorUser),
    /** Se completa en el modal tras `uploadMultipleFiles` → `requisitosArchivosDesdeUploads`. */
    requisitosArchivos: [],
    ...(reporteSolicitudPagoIds?.length ? { reporteSolicitudPagoIds } : {}),
  }
}

export function buildChecklistBatchDocumentoOC(p: BuildDocumentoOCBatchParams): ChecklistProveedorBatchInput {
  return {
    context: 'documento_oc',
    expedienteId: p.expedienteId,
    documentoOCId: p.documentoOCId,
    solicitanteId: p.proveedorUser.id,
    solicitanteNombre: nombreCompletoProveedor(p.proveedorUser),
    requisitosArchivos: [],
  }
}

export interface BuildSubsanacionParams {
  expedienteId: string
  context: ChecklistProveedorContexto
  entidadId: string
  aprobacionId: string
  proveedorUser: ProveedorUserLike
  montoSolicitadoOpcional?: number
}

export function buildChecklistSubsanacion(p: BuildSubsanacionParams): ChecklistProveedorSubsanacionInput {
  return {
    context: p.context,
    expedienteId: p.expedienteId,
    entidadId: p.entidadId,
    aprobacionId: p.aprobacionId,
    solicitanteId: p.proveedorUser.id,
    solicitanteNombre: nombreCompletoProveedor(p.proveedorUser),
    requisitosArchivos: [],
    ...(p.montoSolicitadoOpcional != null && Number.isFinite(p.montoSolicitadoOpcional)
      ? { montoSolicitado: p.montoSolicitadoOpcional }
      : {}),
  }
}

export function logChecklistBatchInput(input: ChecklistProveedorBatchInput): void {
  // eslint-disable-next-line no-console
  console.log(
    '%c[Checklist → Backend]%c procesarChecklistProveedor(input)',
    'color:#0284c7;font-weight:bold;',
    'color:inherit;'
  )
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ input }, null, 2))
}

export function logChecklistSubsanacionInput(input: ChecklistProveedorSubsanacionInput): void {
  // eslint-disable-next-line no-console
  console.log(
    '%c[Checklist → Backend]%c procesarChecklistSubsanacion(input)',
    'color:#0284c7;font-weight:bold;',
    'color:inherit;'
  )
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ input }, null, 2))
}
