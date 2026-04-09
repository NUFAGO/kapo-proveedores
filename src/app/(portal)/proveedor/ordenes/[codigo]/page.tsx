'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Upload,
  Eye,
  Calendar,
  Building,
  TrendingUp,
  CreditCard,
  FileCheck,
  Play,
  Pause,
  Download,
  PencilLine,
  Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useExpedientePorCodigo, useExpedienteCompleto, useSolicitudesPorExpediente, SolicitudPagoResumen, TipoPagoOC, DocumentoOC } from '@/hooks/useExpedientePago'
import { useProcesarChecklistProveedor } from '@/hooks/useProcesarChecklistProveedor'
import { useProcesarChecklistSubsanacion } from '@/hooks/useProcesarChecklistSubsanacion'
import { ChecklistModal } from './components/checklistModal'
import type { EntidadAprobacionRef } from '@/hooks/useAprobacionYDetalleChecklistPorEntidad'

function Sk({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--skeleton-bg)] ${className ?? ''}`}
      aria-hidden
    />
  )
}

function ExpedienteSeguimientoPageSkeleton({ codigo }: { codigo: string }) {
  return (
    <div className="space-y-3">
      <div className="bg-background backdrop-blur-sm shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0 sm:min-h-16">
            <div className="flex items-start gap-2 sm:items-center sm:gap-4 min-w-0 flex-1">
              <Sk className="h-8 w-16 sm:w-20 shrink-0 rounded-md" />
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                <Sk className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Sk className="h-4 w-40 sm:w-56 max-w-full" />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Sk className="h-3 w-full sm:w-48 max-w-full" />
                    <Sk className="h-3 w-28 hidden sm:block" />
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center shrink-0 sm:pl-2">
              <Sk className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Sk className="h-[4.25rem] col-span-2 sm:col-span-1 rounded-lg" />
            <Sk className="h-[4.25rem] rounded-lg" />
            <Sk className="h-[4.25rem] rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <Sk className="h-3 w-32" />
              <Sk className="h-3 w-48 max-w-[55%]" />
            </div>
            <Sk className="h-[5px] w-full rounded-full" />
          </div>
        </div>
      </div>

      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        <div className="bg-card-bg px-4 py-3 border-b border-border-color">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sk className="h-4 w-4 shrink-0 rounded" />
              <Sk className="h-4 w-44 sm:w-52 max-w-full" />
            </div>
            <Sk className="h-5 w-24 rounded-full shrink-0" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="bg-card-bg rounded-lg p-3 card-shadow">
                <div className="space-y-2 mb-3">
                  <div className="flex gap-2 flex-wrap">
                    <Sk className="h-4 w-28" />
                    <Sk className="h-5 w-16 rounded-full" />
                    <Sk className="h-5 w-20 rounded-full" />
                  </div>
                  <Sk className="h-3 w-full" />
                  <Sk className="h-3 w-3/4" />
                  <Sk className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex justify-between items-center gap-2">
                  <Sk className="h-3 w-24" />
                  <Sk className="h-7 w-36 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        <div className="bg-card-bg px-4 py-3 border-b border-border-color">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sk className="h-4 w-4 shrink-0 rounded" />
              <Sk className="h-4 w-48 sm:w-56 max-w-full" />
            </div>
            <Sk className="h-5 w-28 rounded-full shrink-0" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="bg-card-bg rounded-lg p-3 card-shadow">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex gap-2 flex-wrap">
                      <Sk className="h-4 w-20" />
                      <Sk className="h-5 w-20 rounded-full" />
                    </div>
                    <Sk className="h-4 w-3/4 max-w-full" />
                    <Sk className="h-3 w-full" />
                  </div>
                  <div className="text-right space-y-1 shrink-0">
                    <Sk className="h-3 w-24 ml-auto" />
                    <Sk className="h-4 w-14 ml-auto" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="space-y-1">
                      <Sk className="h-3 w-20" />
                      <Sk className="h-3 w-full max-w-[8rem]" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Sk className="h-7 w-32 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        <div className="bg-card-bg px-4 py-3 border-b border-border-color">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sk className="h-4 w-4 shrink-0 rounded" />
              <Sk className="h-4 w-40 sm:w-44 max-w-full" />
            </div>
            <Sk className="h-5 w-28 rounded-full shrink-0" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card-bg border border-border-color rounded-lg p-3 flex items-center justify-between gap-3"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <Sk className="h-4 w-48 max-w-full" />
                <Sk className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Sk className="h-4 w-16" />
                <Sk className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Cargando expediente {codigo}</span>
    </div>
  )
}

export default function ExpedienteSeguimientoPage() {
  const params = useParams()
  const router = useRouter()
  const codigo = params.codigo as string
  
  const [selectedTipoPago, setSelectedTipoPago] = useState<string | null>(null)
  const [selectedDocumentoId, setSelectedDocumentoId] = useState<string | null>(null)
  const [showModalSolicitud, setShowModalSolicitud] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [checklistEntidadAprobacion, setChecklistEntidadAprobacion] =
    useState<EntidadAprobacionRef | null>(null)

  // Obtener expediente por código para encontrar su ID
  const { data: expedienteBasico, isLoading: isLoadingBasico, error: errorBasico } = useExpedientePorCodigo(codigo)
  
  // Obtener datos completos del expediente usando su ID
  const { data: expedienteCompleto, isLoading: isLoadingCompleto, error: errorCompleto } = useExpedienteCompleto(
    expedienteBasico?.id || ''
  )

  // Solicitudes de pago del expediente (historial)
  const { data: solicitudes = [], isLoading: isLoadingSolicitudes } = useSolicitudesPorExpediente(
    expedienteBasico?.id || ''
  )

  const procesarChecklist = useProcesarChecklistProveedor()
  const procesarSubsanacion = useProcesarChecklistSubsanacion()

  // Combinar estados de carga
  const isLoading = isLoadingBasico || isLoadingCompleto
  const error = errorBasico || errorCompleto

  // Configuración de estados
  const statusConfig = {
    disponible: { label: 'Disponible', color: 'bg-green-500', icon: Play },
    bloqueado: { label: 'Bloqueado', color: 'bg-red-500', icon: Pause },
    en_proceso: { label: 'En Proceso', color: 'bg-yellow-500', icon: Clock },
    completado: { label: 'Completado', color: 'bg-emerald-500', icon: CheckCircle },
    aprobada: { label: 'Aprobada', color: 'bg-emerald-500', icon: CheckCircle }
  }

  const estadoSolicitudConfig: Record<SolicitudPagoResumen['estado'], { label: string; color: string }> = {
    BORRADOR:    { label: 'Borrador',    color: 'bg-gray-400' },
    EN_REVISION: { label: 'En Revisión', color: 'bg-blue-500' },
    OBSERVADA:   { label: 'Observada',   color: 'bg-yellow-500' },
    RECHAZADA:   { label: 'Rechazada',   color: 'bg-red-500' },
    APROBADO:    { label: 'Aprobada',    color: 'bg-emerald-500' },
  }

  const estadoExpediente = (
    expedienteCompleto?.obtenerExpedienteCompleto?.estado || ''
  ).toLowerCase()
  const expedienteCompletado = estadoExpediente === 'completado'

  const handleIniciarSolicitud = (tipoPagoId: string) => {
    if (expedienteCompletado) return
    setChecklistEntidadAprobacion(null)
    setSelectedTipoPago(tipoPagoId)
    setShowChecklistModal(true)
  }

  const handleVerDocumentosOC = (documentoId: string) => {
    if (expedienteCompletado) return
    setChecklistEntidadAprobacion(null)
    setSelectedTipoPago(null) // Limpiar selección de tipo pago
    setSelectedDocumentoId(documentoId) // Establecer documento seleccionado
    setShowChecklistModal(true)
  }

  /**
   * Historial: abre checklist y encadena consultas de aprobación + detalle cuando ya no es borrador.
   */
  const handleAccionHistorialSolicitud = (solicitud: SolicitudPagoResumen) => {
    setSelectedDocumentoId(null)
    setSelectedTipoPago(solicitud.tipoPagoOCId)
    if (solicitud.estado === 'BORRADOR') {
      setChecklistEntidadAprobacion(null)
    } else {
      setChecklistEntidadAprobacion({
        entidadTipo: 'solicitud_pago',
        entidadId: solicitud.id,
      })
    }
    setShowChecklistModal(true)
  }

  /** Documento OC: Detalle/Subsanar — consulta aprobación asociada en el modal. */
  const handleAccionDocumentoOc = (documento: DocumentoOC) => {
    const estado = (documento.estado || '').toUpperCase()
    const abreChecklistDoc =
      estado === 'EN_REVISION' ||
      estado === 'OBSERVADA' ||
      estado === 'APROBADO' ||
      estado === 'RECHAZADA'
    if (!abreChecklistDoc) return
    setSelectedTipoPago(null)
    setSelectedDocumentoId(documento.id)
    setChecklistEntidadAprobacion({
      entidadTipo: 'documento_oc',
      entidadId: documento.id,
    })
    setShowChecklistModal(true)
  }

  const getProgresoGeneral = () => {
    if (!expedienteCompleto?.obtenerExpedienteCompleto) return 0
    const contratado = expedienteCompleto.obtenerExpedienteCompleto.montoContrato || 0
    const comprometido = expedienteCompleto.obtenerExpedienteCompleto.montoComprometido || 0
    if (contratado <= 0) return 0
    return Math.min(100, (comprometido / contratado) * 100)
  }

  // Manejo de estados de carga y error
  if (isLoading) {
    return <ExpedienteSeguimientoPageSkeleton codigo={codigo} />
  }

  if (error || !expedienteCompleto?.obtenerExpedienteCompleto) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <p className="text-text-secondary">No se pudo cargar el expediente</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/proveedor/ordenes')}
            className="mt-3"
          >
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-background rounded-lg card-shadow backdrop-blur-lg shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0 sm:min-h-16">
            <div className="flex items-start gap-2 sm:items-center sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/proveedor/ordenes')}
                aria-label="Volver a órdenes"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              </Button>
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-bold text-text-primary leading-tight">
                    <span className="sm:hidden">Expediente</span>
                    <span className="hidden sm:inline">Seguimiento de Expediente</span>
                  </h1>
                  <div className="flex flex-col gap-1 mt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-0">
                    <span className="text-xs text-text-secondary break-all sm:break-normal">
                      Código:{' '}
                      <span className="font-mono bg-card-bg px-1 py-0.5 rounded text-xs inline-block max-w-full truncate align-bottom sm:max-w-none sm:overflow-visible sm:whitespace-normal sm:inline">
                        {codigo}
                      </span>
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Estado: {expedienteCompleto?.obtenerExpedienteCompleto?.estado}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="items-center shrink-0 sm:pl-2 hidden sm:flex">
              <Badge
                className={`${statusConfig[expedienteCompleto?.obtenerExpedienteCompleto?.estado as keyof typeof statusConfig]?.color} text-white text-xs sm:text-sm whitespace-nowrap shrink-0 max-w-[min(100%,100vw-3rem)] sm:max-w-none`}
              >
                {statusConfig[expedienteCompleto?.obtenerExpedienteCompleto?.estado as keyof typeof statusConfig]?.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen General */}
      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 card-shadow col-span-2 sm:col-span-1">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Monto Contrato</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                S/ {(expedienteCompleto?.obtenerExpedienteCompleto?.montoContrato || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 card-shadow">
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Comprometido</p>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                S/ {(expedienteCompleto?.obtenerExpedienteCompleto?.montoComprometido || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 card-shadow">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Disponible para pagar</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                S/ {(expedienteCompleto?.obtenerExpedienteCompleto?.montoDisponible || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-text-secondary">Progreso de Pagos</span>
              <span className="font-medium text-text-primary">
                S/ {(expedienteCompleto?.obtenerExpedienteCompleto?.montoComprometido || 0).toLocaleString()} de S/ {(expedienteCompleto?.obtenerExpedienteCompleto?.montoContrato || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-border-color rounded-full h-[5px]">
              <div 
                className="bg-linear-to-r from-emerald-500 to-blue-500 h-[5px] rounded-full transition-all duration-500"
                style={{ width: `${getProgresoGeneral()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Documentos OC - Requisitos Generales (solo si hay documentos configurados) */}
      {(expedienteCompleto?.obtenerExpedienteCompleto?.documentos || []).length > 0 ? (
        <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
          <div className="bg-card-bg px-4 py-3 border-b border-border-color">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Documentación Requerida
              </h2>
              <Badge variant="secondary" className="text-xs">
                {(expedienteCompleto?.obtenerExpedienteCompleto?.documentos || []).length} documentos
              </Badge>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(expedienteCompleto?.obtenerExpedienteCompleto?.documentos || []).map((documento: DocumentoOC) => {
                const estadoOc = (documento.estado || '').toUpperCase()
                const mostrarAccionHistorialDocOc =
                  estadoOc === 'EN_REVISION' ||
                  estadoOc === 'OBSERVADA' ||
                  estadoOc === 'APROBADO' ||
                  estadoOc === 'RECHAZADA'
                const esSubsanarDocOc = !expedienteCompletado && estadoOc === 'OBSERVADA'
                const mostrarGestionarDocOc = !expedienteCompletado && estadoOc === 'BORRADOR'
                return (
                  <div key={documento.id} className="bg-card-bg rounded-lg p-3 card-shadow-hover hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text-primary text-sm">
                            DOC-{documento.checklist?.nombre}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {documento.estado}
                          </Badge>
                          {documento.obligatorio && (
                            <Badge variant="destructive" className="text-xs">
                              Obligatorio
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mb-2">
                          {documento.checklist?.descripcion}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {documento.checklist?.categoria?.nombre}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <p className="text-xs text-text-secondary">
                        {documento.checklist?.requisitos?.length || 0} requisitos
                      </p>
                      {mostrarAccionHistorialDocOc ? (
                        <Button
                          type="button"
                          variant={esSubsanarDocOc ? 'custom' : 'outline'}
                          color={esSubsanarDocOc ? 'orange' : undefined}
                          size="xs"
                          className="gap-1"
                          onClick={() => handleAccionDocumentoOc(documento)}
                        >
                          {esSubsanarDocOc ? (
                            <PencilLine className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {esSubsanarDocOc ? 'Subsanar' : 'Detalles'}
                        </Button>
                      ) : mostrarGestionarDocOc ? (
                        <Button
                          variant="custom"
                          color="green"
                          size="xs"
                          onClick={() => handleVerDocumentosOC(documento.id)}
                        >
                          <FileText className="w-3 h-3" />
                          Gestionar Documento
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Tipos de Pago OC - Opciones Disponibles */}
      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        <div className="bg-card-bg px-4 py-3 border-b border-border-color">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 ">
              <Banknote className="w-4 h-4 text-green-600 dark:text-green-400" />
              Solicitudes de Pago Disponibles
            </h2>
            <Badge variant="secondary" className="text-xs">
              {(expedienteCompleto?.obtenerExpedienteCompleto?.tiposPago || []).length} tipos de pago
            </Badge>
          </div>
        </div>

        <div className="p-4">

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(expedienteCompleto?.obtenerExpedienteCompleto?.tiposPago || []).map((tipoPago: TipoPagoOC) => (
                <div key={tipoPago.id} className="bg-card-bg rounded-lg p-3 card-shadow-hover hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary text-sm">
                          TP-{tipoPago.orden}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          Orden {tipoPago.orden}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-medium text-text-primary mb-1">
                        {tipoPago.categoria?.nombre || 'Tipo de Pago'}
                      </h4>
                      <p className="text-xs text-text-secondary mb-2">
                        {tipoPago.categoria?.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Porcentaje Máximo</p>
                      <p className="text-sm font-bold text-blue-600">
                        {tipoPago.porcentajeMaximo ? `${tipoPago.porcentajeMaximo}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Detalles del tipo de pago */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <p className="text-text-secondary">Categoría</p>
                      <p className="font-medium text-text-primary">
                        {tipoPago.categoria?.nombre || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Modo Restricción</p>
                      <p className="font-medium text-text-primary capitalize">
                        {tipoPago.modoRestriccion?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Checklist</p>
                      <p className="font-medium text-text-primary">
                        {tipoPago.checklist?.codigo || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Requiere Anterior</p>
                      <p className="font-medium text-text-primary">
                        {tipoPago.requiereAnteriorPagado ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {!expedienteCompletado && (
                      <Button
                        variant="custom"
                        color="blue"
                        size="xs"
                        onClick={() => handleIniciarSolicitud(tipoPago.id)}
                      >
                        <Plus className="w-3 h-3" />
                        Nueva solicitud
                      </Button>
                    )}
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historial de Solicitudes */}
      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow overflow-hidden">
        <div className="bg-card-bg px-4 py-3 border-b border-border-color">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historial de Solicitudes
            </h2>
            <Badge variant="secondary" className="text-xs">
              {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''}
            </Badge>
          </div>
        </div>

        <div className="p-4">
          {isLoadingSolicitudes ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-card-bg border border-border-color rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <Sk className="h-4 w-48 max-w-full" />
                    <Sk className="h-3 w-24" />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Sk className="h-4 w-16" />
                    <Sk className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-text-secondary mx-auto mb-3" />
              <h3 className="text-sm font-medium text-text-primary mb-2">No hay solicitudes aún</h3>
              <p className="text-text-secondary text-xs">
                Inicia tu primera solicitud desde las opciones de pago disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {solicitudes.map((solicitud: SolicitudPagoResumen) => {
                const esSubsanar =
                  !expedienteCompletado && solicitud.estado === 'OBSERVADA'
                return (
                  <div
                    key={solicitud.id}
                    className="bg-card-bg border border-border-color rounded-lg p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold text-text-primary">
                        {solicitud.tipoPagoOC?.categoria?.nombre
                          ? `TP-${solicitud.tipoPagoOC.orden} · ${solicitud.tipoPagoOC.categoria.nombre}`
                          : `TP-${solicitud.tipoPagoOC?.orden ?? '?'}`}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {new Date(solicitud.fechaCreacion).toLocaleDateString('es-PE', {
                          day: '2-digit', month: 'short', year: 'numeric',
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
                          variant={esSubsanar ? 'custom' : 'outline'}
                          color={esSubsanar ? 'orange' : undefined}
                          size="xs"
                          className="gap-1"
                          onClick={() => handleAccionHistorialSolicitud(solicitud)}
                        >
                          {esSubsanar ? (
                            <PencilLine className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {esSubsanar ? 'Subsanar' : 'Detalles'}
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

      {/* Modal de Documentos y Requisitos */}
      {expedienteCompleto?.obtenerExpedienteCompleto && (
        <ChecklistModal
          isOpen={showChecklistModal}
          onClose={() => {
            setShowChecklistModal(false)
            setSelectedTipoPago(null)
            setSelectedDocumentoId(null)
            setChecklistEntidadAprobacion(null)
          }}
          expedienteId={expedienteCompleto.obtenerExpedienteCompleto.id}
          entidadAprobacion={checklistEntidadAprobacion}
          montoDisponible={expedienteCompleto.obtenerExpedienteCompleto.montoDisponible}
          tiposPago={expedienteCompleto.obtenerExpedienteCompleto.tiposPago || []}
          documentos={expedienteCompleto.obtenerExpedienteCompleto.documentos || []}
          selectedTipoPagoId={selectedTipoPago || undefined}
          selectedDocumentoId={selectedDocumentoId || undefined}
          onFileUpload={(requisitoId, file) => {
            console.log('Subiendo archivo:', requisitoId, file)
            // TODO: Implementar upload de archivos
          }}
          onPayloadReady={async (input) => {
            await procesarChecklist.mutateAsync(input)
          }}
          onSubsanacionReady={async (input) => {
            await procesarSubsanacion.mutateAsync(input)
          }}
        />
      )}

      {/* Modal para nueva solicitud */}
      {showModalSolicitud && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background backdrop-blur-sm rounded-lg card-shadow p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Nueva Solicitud de Pago</h2>
            <p className="text-text-secondary mb-4">
              Creando solicitud para el tipo de pago seleccionado
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="subtle" size="xs" onClick={() => setShowModalSolicitud(false)}>
                Cancelar
              </Button>
              <Button variant="custom" color="blue" size="xs" onClick={() => setShowModalSolicitud(false)}>
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
