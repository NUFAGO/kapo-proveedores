/**
 * Reglas de monto por tipo de pago (% sobre monto de contrato).
 * Solo aplican si existen porcentajes configurados (> 0); si no, el flujo sigue como antes.
 */

const EPS_DEFAULT = 0.005

/**
 * Cupo acumulado por tipo de pago: solo solicitudes que ya entraron al flujo de revisión
 * o están cerradas favorablemente. No cuentan borradores (aún no enviados) ni rechazos (cupo liberado).
 */
export const ESTADOS_SOLICITUD_QUE_CONSUMEN_CUPO_TIPO = [
  'EN_REVISION',
  'OBSERVADA',
  'APROBADO',
] as const

function pctActivo(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v) && v > 0
}

export function aplicaValidacionPorcentajesTipoPago(
  montoContrato: number | null | undefined,
  porcentajeMaximo?: number | null,
  porcentajeMinimo?: number | null
): boolean {
  if (montoContrato == null || !Number.isFinite(montoContrato) || montoContrato <= 0) {
    return false
  }
  return pctActivo(porcentajeMaximo) || pctActivo(porcentajeMinimo)
}

export interface SolicitudMontoTipoRow {
  id: string
  tipoPagoOCId: string
  montoSolicitado: number
  estado: string
}

export function sumaMontosSolicitudesMismoTipo(
  solicitudes: SolicitudMontoTipoRow[],
  tipoPagoOCId: string,
  opts?: { excluirSolicitudId?: string; eps?: number }
): number {
  const eps = opts?.eps ?? EPS_DEFAULT
  const excluir = opts?.excluirSolicitudId?.trim()
  const estados = new Set(
    ESTADOS_SOLICITUD_QUE_CONSUMEN_CUPO_TIPO.map((e) => e.toUpperCase())
  )
  let sum = 0
  for (const s of solicitudes) {
    if (s.tipoPagoOCId !== tipoPagoOCId) continue
    if (excluir && s.id === excluir) continue
    const est = (s.estado || '').toUpperCase()
    if (!estados.has(est)) continue
    const m = Number(s.montoSolicitado)
    if (Number.isFinite(m) && m > eps) sum += m
  }
  return sum
}

function formatSoles(n: number): string {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export interface MetaValidacionMontoTipo {
  topeAcumuladoSoles: number | null
  minPorSolicitudSoles: number | null
  yaComprometido: number
  restante: number | null
  choqueCupoVsMinimo: boolean
}

export type ResultadoValidacionMontoTipoPago =
  | { ok: true; errores: []; meta: MetaValidacionMontoTipo }
  | { ok: false; errores: string[]; meta: MetaValidacionMontoTipo }

export interface ValidarMontoSolicitudTipoPagoParams {
  montoContrato: number
  porcentajeMaximo?: number | null
  porcentajeMinimo?: number | null
  tipoPagoOCId: string
  solicitudes: SolicitudMontoTipoRow[]
  montoNuevo: number
  excluirSolicitudId?: string
  eps?: number
}

export type MetaPorcentajesTipoPagoInput = Omit<ValidarMontoSolicitudTipoPagoParams, 'montoNuevo'>

/** Meta numérica para UI y validación; `null` si no hay % configurados. */
export function obtenerMetaPorcentajesTipoPago(
  params: MetaPorcentajesTipoPagoInput
): MetaValidacionMontoTipo | null {
  const eps = params.eps ?? EPS_DEFAULT
  const {
    montoContrato,
    porcentajeMaximo,
    porcentajeMinimo,
    tipoPagoOCId,
    solicitudes,
    excluirSolicitudId,
  } = params

  const hasMax = pctActivo(porcentajeMaximo)
  const hasMin = pctActivo(porcentajeMinimo)
  if (!hasMax && !hasMin) return null

  const topeAcumuladoSoles = hasMax ? (montoContrato * porcentajeMaximo!) / 100 : null
  const minPorSolicitudSoles = hasMin ? (montoContrato * porcentajeMinimo!) / 100 : null

  const yaComprometido = sumaMontosSolicitudesMismoTipo(solicitudes, tipoPagoOCId, {
    excluirSolicitudId,
    eps,
  })
  const restante =
    topeAcumuladoSoles != null ? topeAcumuladoSoles - yaComprometido : null

  const choqueCupoVsMinimo = Boolean(
    topeAcumuladoSoles != null &&
      minPorSolicitudSoles != null &&
      restante != null &&
      restante > eps &&
      restante < minPorSolicitudSoles - eps
  )

  return {
    topeAcumuladoSoles,
    minPorSolicitudSoles,
    yaComprometido,
    restante,
    choqueCupoVsMinimo,
  }
}

/**
 * - Máximo: cupo acumulado del tipo (suma de solicitudes en estados que consumen cupo + monto nuevo ≤ tope).
 * - Mínimo: por cada solicitud, monto ≥ mínimo % del contrato (salvo choque cupo vs mínimo).
 */
export function validarMontoSolicitudTipoPago(
  params: ValidarMontoSolicitudTipoPagoParams
): ResultadoValidacionMontoTipoPago {
  const eps = params.eps ?? EPS_DEFAULT
  const {
    montoContrato,
    porcentajeMaximo,
    porcentajeMinimo,
    tipoPagoOCId,
    solicitudes,
    montoNuevo,
    excluirSolicitudId,
  } = params

  const hasMax = pctActivo(porcentajeMaximo)
  const hasMin = pctActivo(porcentajeMinimo)

  const metaSinSuma: MetaValidacionMontoTipo = {
    topeAcumuladoSoles: hasMax ? (montoContrato * porcentajeMaximo!) / 100 : null,
    minPorSolicitudSoles: hasMin ? (montoContrato * porcentajeMinimo!) / 100 : null,
    yaComprometido: 0,
    restante: null,
    choqueCupoVsMinimo: false,
  }

  if (!hasMax && !hasMin) {
    return { ok: true, errores: [], meta: metaSinSuma }
  }

  const metaCalc = obtenerMetaPorcentajesTipoPago({
    montoContrato,
    porcentajeMaximo,
    porcentajeMinimo,
    tipoPagoOCId,
    solicitudes,
    excluirSolicitudId,
    eps,
  })
  if (!metaCalc) {
    return { ok: true, errores: [], meta: metaSinSuma }
  }
  const meta = metaCalc

  const errores: string[] = []

  if (meta.choqueCupoVsMinimo) {
    errores.push(
      `El cupo restante para este tipo de pago (S/ ${formatSoles(meta.restante!)}) es menor al mínimo configurado por solicitud (S/ ${formatSoles(meta.minPorSolicitudSoles!)}). Solicite a administración que ajuste el porcentaje mínimo o el máximo acumulado del tipo de pago.`
    )
  }

  if (hasMax && meta.topeAcumuladoSoles != null) {
    if (meta.yaComprometido + montoNuevo > meta.topeAcumuladoSoles + eps) {
      errores.push(
        `El monto excede el máximo acumulado permitido para este tipo de pago (tope S/ ${formatSoles(meta.topeAcumuladoSoles)}; ya registrado S/ ${formatSoles(meta.yaComprometido)}).`
      )
    }
  }

  if (hasMin && meta.minPorSolicitudSoles != null && !meta.choqueCupoVsMinimo) {
    if (montoNuevo + eps < meta.minPorSolicitudSoles) {
      errores.push(
        `El monto debe ser al menos S/ ${formatSoles(meta.minPorSolicitudSoles)} (${porcentajeMinimo}% del monto de contrato).`
      )
    }
  }

  if (errores.length === 0) {
    return { ok: true, errores: [], meta }
  }
  return { ok: false, errores, meta }
}
