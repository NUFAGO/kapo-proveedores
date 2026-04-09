'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  FileStack,
  FileText,
  History,
  Layers,
  Link2,
} from 'lucide-react';
import {
  useDetalleChecklistRevisionAprobacion,
  type DocumentoSubidoRevisionGql,
  type RequisitoRevisionGql,
} from '../../../../../hooks/useDetalleChecklistRevisionAprobacion';
import { useAuth } from '@/context/auth-context';
import { useFinalizarRevisionChecklistAprobacion } from '@/hooks/useFinalizarRevisionChecklistAprobacion';
import { useReportesPorSolicitudPago } from '@/hooks/useReporteSolicitudPago';
import { toast } from 'react-hot-toast';
import NotificationModal from '@/components/ui/notification-modal';
import ReporteSolicitudPagoForm from '@/app/(portal)/proveedor/reportes/components/reporteSolicitudPagoForm';

export interface AprobacionChecklistRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  aprobacionId: string | null;
}

type DecisionRevision = 'APROBADO' | 'OBSERVADO';

type ConfirmRevisionKind = 'finalizar' | 'rechazar';

type RevisionDocLocal = {
  decision: DecisionRevision;
  comentario: string;
};

const ENTIDAD_LABEL: Record<string, string> = {
  solicitud_pago: 'Solicitud de pago',
  documento_oc: 'Documento / checklist OC',
};

const ESTADO_DOC_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  OBSERVADO: 'Observado',
  RECHAZADO: 'Rechazado',
};

const ESTADO_APROBACION_LABEL: Record<string, string> = {
  EN_REVISION: 'En revisión',
  OBSERVADO: 'Observado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

function badgeVariantForEstadoDoc(
  estado: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (estado) {
    case 'APROBADO':
      return 'secondary';
    case 'OBSERVADO':
      return 'outline';
    case 'RECHAZADO':
      return 'destructive';
    default:
      return 'outline';
  }
}

function nombresArchivosEntrega(doc: DocumentoSubidoRevisionGql): string {
  const n = doc.archivos.map((a) => a.nombreOriginal).filter(Boolean);
  return n.length > 0 ? n.join(', ') : '—';
}

function groupDocsByRequisito(docs: DocumentoSubidoRevisionGql[]) {
  const map = new Map<string, DocumentoSubidoRevisionGql[]>();
  const sinReq: DocumentoSubidoRevisionGql[] = [];
  for (const d of docs) {
    const rid = d.requisitoDocumentoId?.trim();
    if (!rid) {
      sinReq.push(d);
      continue;
    }
    const arr = map.get(rid) ?? [];
    arr.push(d);
    map.set(rid, arr);
  }
  return { map, sinReq };
}

function parseFechaSubidaMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/** Mayor `version`; si empatan, la entrega con `fechaSubida` más reciente. */
function pickUltimaEntregaDelGrupo(docs: DocumentoSubidoRevisionGql[]): DocumentoSubidoRevisionGql {
  if (docs.length === 0) {
    throw new Error('pickUltimaEntregaDelGrupo: lista vacía');
  }
  return docs.reduce((a, b) => {
    if (b.version !== a.version) return b.version > a.version ? b : a;
    const tb = parseFechaSubidaMs(b.fechaSubida);
    const ta = parseFechaSubidaMs(a.fechaSubida);
    return tb >= ta ? b : a;
  });
}

/** Documentos sobre los que aplica la revisión / finalizar: última entrega por requisito + todos los sin `requisitoDocumentoId`. */
function documentosActivosParaRevision(docs: DocumentoSubidoRevisionGql[]): DocumentoSubidoRevisionGql[] {
  const { map, sinReq } = groupDocsByRequisito(docs);
  const out: DocumentoSubidoRevisionGql[] = [];
  for (const arr of map.values()) {
    if (arr.length === 0) continue;
    out.push(pickUltimaEntregaDelGrupo(arr));
  }
  out.push(...sinReq);
  return out;
}

function ordenEntregasMasRecientePrimero(a: DocumentoSubidoRevisionGql, b: DocumentoSubidoRevisionGql): number {
  if (b.version !== a.version) return b.version - a.version;
  return parseFechaSubidaMs(b.fechaSubida) - parseFechaSubidaMs(a.fechaSubida);
}

function inicialRevisionPorDocs(docs: DocumentoSubidoRevisionGql[]): Record<string, RevisionDocLocal> {
  const out: Record<string, RevisionDocLocal> = {};
  for (const d of docs) {
    if (d.estado === 'OBSERVADO') {
      out[d.id] = { decision: 'OBSERVADO', comentario: d.comentariosRevision?.trim() ?? '' };
    } else {
      out[d.id] = { decision: 'APROBADO', comentario: '' };
    }
  }
  return out;
}

function ResumenStat({
  icon: Icon,
  label,
  className,
  children,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex items-start gap-2 rounded border border-border p-3', className)}>
      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold text-text-primary">{label}</p>
        {children}
      </div>
    </div>
  );
}

export function AprobacionChecklistRevisionModal({
  isOpen,
  onClose,
  aprobacionId,
}: AprobacionChecklistRevisionModalProps) {
  const { data, isLoading, isError, error, refetch } = useDetalleChecklistRevisionAprobacion(
    aprobacionId,
    isOpen
  );

  const detalle = data?.detalleChecklistRevisionAprobacion;
  const checklist = detalle?.checklist;
  const todosLosSubidos = detalle?.documentosSubidos ?? [];
  const documentosRevisionActivos = useMemo(
    () => documentosActivosParaRevision(todosLosSubidos),
    [todosLosSubidos]
  );
  const docsKey = useMemo(
    () => documentosRevisionActivos.map((d) => `${d.id}:${d.estado}`).join('|'),
    [documentosRevisionActivos]
  );

  const [revisionPorDoc, setRevisionPorDoc] = useState<Record<string, RevisionDocLocal>>({});
  const [confirmKind, setConfirmKind] = useState<ConfirmRevisionKind | null>(null);
  const [reporteVistaId, setReporteVistaId] = useState<string | null>(null);
  const { user } = useAuth();
  const finalizarRevision = useFinalizarRevisionChecklistAprobacion();

  useEffect(() => {
    if (!isOpen) {
      setConfirmKind(null);
      setReporteVistaId(null);
      return;
    }
    const docs = data?.detalleChecklistRevisionAprobacion?.documentosSubidos;
    if (!docs?.length) {
      setRevisionPorDoc({});
      return;
    }
    setRevisionPorDoc(inicialRevisionPorDocs(documentosActivosParaRevision(docs)));
  }, [isOpen, aprobacionId, docsKey, data?.detalleChecklistRevisionAprobacion]);

  const idsSubidos = useMemo(
    () => documentosRevisionActivos.map((d) => d.id),
    [documentosRevisionActivos]
  );

  /** Todas las entregas marcadas como Conforme (APROBADO) en esta revisión local. */
  const todosConformesLocales = useMemo(
    () => idsSubidos.every((id) => revisionPorDoc[id]?.decision === 'APROBADO'),
    [idsSubidos, revisionPorDoc]
  );

  const patchRevisionDoc = useCallback((docId: string, partial: Partial<RevisionDocLocal>) => {
    setRevisionPorDoc((prev) => {
      const cur = prev[docId] ?? { decision: 'APROBADO' as const, comentario: '' };
      const next = { ...cur, ...partial };
      if (partial.decision === 'APROBADO') {
        next.comentario = '';
      }
      return { ...prev, [docId]: next };
    });
  }, []);

  const requisitos = [...(checklist?.requisitos ?? [])].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
  );
  const { map: porRequisito, sinReq } = groupDocsByRequisito(todosLosSubidos);

  /** Solo en EN_REVISION el revisor puede actuar: pie con Aprobar/Observar/Rechazar. */
  const puedeActuarRevision = detalle?.estado === 'EN_REVISION';
  const soloLecturaRevision = Boolean(detalle && checklist && !isLoading && !isError && !puedeActuarRevision);

  const pieAccionesVisible = Boolean(
    detalle && checklist && !isLoading && !isError && puedeActuarRevision
  );

  const esPago = detalle?.entidadTipo === 'solicitud_pago';

  const solicitudPagoIdParaReportes = useMemo(() => {
    if (detalle?.entidadTipo !== 'solicitud_pago') return null;
    const eid = detalle.entidadId?.trim();
    return eid || null;
  }, [detalle?.entidadTipo, detalle?.entidadId]);

  const {
    data: reportesOperativos = [],
    isLoading: reportesOperativosLoading,
    isError: reportesOperativosError,
    error: reportesOperativosErr,
  } = useReportesPorSolicitudPago(solicitudPagoIdParaReportes, {
    enabled: Boolean(isOpen && solicitudPagoIdParaReportes),
  });

  const buildRevisionesDocumentos = () =>
    idsSubidos.map((id) => {
      const r = revisionPorDoc[id] ?? { decision: 'APROBADO' as const, comentario: '' };
      return {
        documentoSubidoId: id,
        resultado: r.decision,
        ...(r.decision === 'OBSERVADO' ? { comentario: r.comentario.trim() } : {}),
      };
    });

  const etiquetaRequisitoDoc = useCallback(
    (requisitoId: string | null | undefined) => {
      const rid = requisitoId?.trim();
      if (!rid) return 'Sin requisito asociado';
      const req = requisitos.find((x) => x.id === rid);
      return (
        req?.plantillaDocumento?.nombrePlantilla ??
        (req?.tipoRequisito === 'formulario' ? 'Formulario' : 'Requisito')
      );
    },
    [requisitos]
  );

  const solicitarConfirmarFinalizar = () => {
    if (!aprobacionId) return;
    if (!user?.id) {
      toast.error('Sesión requerida para registrar la revisión.');
      return;
    }
    for (const id of idsSubidos) {
      const r = revisionPorDoc[id];
      if (r?.decision === 'OBSERVADO' && !r.comentario?.trim()) {
        toast.error('Agregá comentario en cada documento marcado como Observar.');
        return;
      }
    }
    setConfirmKind('finalizar');
  };

  const ejecutarFinalizarRevision = async (comentarioGeneralModal?: string) => {
    if (!aprobacionId || !user?.id) return;
    const general = comentarioGeneralModal?.trim() ?? '';
    try {
      await finalizarRevision.mutateAsync({
        aprobacionId,
        rechazar: false,
        comentarioGeneral: general || undefined,
        revisionesDocumentos: buildRevisionesDocumentos(),
        revisorId: user.id,
        revisorNombre: user.nombresA ?? user.nombres ?? user.usuario,
      });
      setConfirmKind(null);
      onClose();
    } catch {
      /* toast en el hook */
    }
  };

  const solicitarConfirmarRechazo = () => {
    if (!aprobacionId) return;
    if (!user?.id) {
      toast.error('Sesión requerida para registrar el rechazo.');
      return;
    }
    setConfirmKind('rechazar');
  };

  const ejecutarRechazo = async (comentarioRechazoModal?: string) => {
    if (!aprobacionId || !user?.id) return;
    const msg = comentarioRechazoModal?.trim();
    if (!msg) {
      toast.error('Indicá el motivo del rechazo.');
      return;
    }
    try {
      await finalizarRevision.mutateAsync({
        aprobacionId,
        rechazar: true,
        comentarioRechazo: msg,
        revisionesDocumentos: [],
        revisorId: user.id,
        revisorNombre: user.nombresA ?? user.nombres ?? user.usuario,
      });
      setConfirmKind(null);
      onClose();
    } catch {
      /* toast en el hook */
    }
  };

  const confirmFinalizarDescription = useMemo(() => {
    if (confirmKind !== 'finalizar' || !detalle) return null;
    return (
      <div className="space-y-4 text-left">
        {detalle.montoSolicitado != null && esPago ? (
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
              Monto solicitado
            </p>
            <p className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
              {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
                Number(detalle.montoSolicitado)
              )}
            </p>
          </div>
        ) : null}

        {documentosRevisionActivos.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
              Entregas ({documentosRevisionActivos.length})
            </p>
            <ul className="max-h-[min(36vh,16rem)] space-y-2 overflow-y-auto pr-1">
              {documentosRevisionActivos.map((doc) => {
                const esObservado = revisionPorDoc[doc.id]?.decision === 'OBSERVADO';
                const obs = revisionPorDoc[doc.id]?.comentario?.trim() ?? '';
                return (
                  <li
                    key={doc.id}
                    className={
                      esObservado
                        ? 'rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 dark:bg-amber-950/20'
                        : 'rounded-md border border-[var(--border-color)] bg-[var(--muted)]/40 px-3 py-2'
                    }
                  >
                    <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                      <span
                        className={
                          esObservado
                            ? 'rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:text-amber-100'
                            : 'rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 dark:text-emerald-200'
                        }
                      >
                        {esObservado ? 'Observar' : 'Conforme'}
                      </span>
                      <span>
                        {etiquetaRequisitoDoc(doc.requisitoDocumentoId)} · v{doc.version}
                      </span>
                    </p>
                    <p className="mt-1 break-words text-xs text-[var(--text-secondary)]">
                      <span className="font-medium">Archivo(s): </span>
                      {nombresArchivosEntrega(doc)}
                    </p>
                    {esObservado && obs ? (
                      <p className="mt-2 border-t border-amber-500/20 pt-2 text-xs text-amber-950 dark:text-amber-100">
                        <span className="font-medium">Observación: </span>
                        {obs}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

      </div>
    );
  }, [confirmKind, detalle, documentosRevisionActivos, esPago, etiquetaRequisitoDoc, revisionPorDoc]);

  const confirmRechazoDescription = useMemo(() => {
    if (confirmKind !== 'rechazar') return null;
    return (
      <div className="space-y-4 text-left">
        <p className="text-xs text-[var(--text-secondary)]">
          Se rechazará la solicitud de pago y todas las entregas vinculadas quedarán en estado rechazado.
        </p>
        <div>
          <p className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
            Entregas ({documentosRevisionActivos.length})
          </p>
          <ul className="max-h-[min(32vh,14rem)] space-y-2 overflow-y-auto pr-1">
            {documentosRevisionActivos.map((doc) => (
              <li
                key={doc.id}
                className="rounded-md border border-[var(--border-color)] bg-[var(--muted)]/40 px-3 py-2"
              >
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {etiquetaRequisitoDoc(doc.requisitoDocumentoId)} · v{doc.version}
                </p>
                <p className="mt-1 break-words text-xs text-[var(--text-secondary)]">
                  <span className="font-medium">Archivo(s): </span>
                  {nombresArchivosEntrega(doc)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, [confirmKind, documentosRevisionActivos, etiquetaRequisitoDoc]);

  const pieBloqueado = finalizarRevision.isPending || confirmKind !== null;

  const cerrarConfirmacion = () => {
    if (finalizarRevision.isPending) return;
    setConfirmKind(null);
  };

  const modalFooter = pieAccionesVisible ? (
    <div className="flex w-full min-w-0 flex-col gap-3">
 
      <div className="flex flex-wrap justify-end gap-2">
        {esPago ? (
          <Button
            variant="custom"
            color="red"
            size="sm"
            type="button"
            disabled={pieBloqueado}
            onClick={() => solicitarConfirmarRechazo()}
          >
            Rechazar solicitud
          </Button>
        ) : null}
        <Button
          variant="custom"
          color={todosConformesLocales ? 'emerald' : 'orange'}
          size="sm"
          type="button"
          disabled={pieBloqueado}
          onClick={() => solicitarConfirmarFinalizar()}
        >
          {todosConformesLocales ? 'Aprobar' : 'Observar'}
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        detalle && checklist ? (
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r text-white',
                esPago ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'
              )}
            >
              {esPago ? <Layers className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-text-primary">Revisión de checklist</p>
              <p className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    'shrink-0 rounded px-2 py-0.5 font-medium',
                    esPago
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  )}
                >
                  {ENTIDAD_LABEL[detalle.entidadTipo] ?? detalle.entidadTipo}
                </span>
                <span className="min-w-0 truncate text-muted-foreground">{checklist.nombre}</span>
                {detalle.estado && detalle.estado !== 'EN_REVISION' ? (
                  <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Aprobación: {ESTADO_APROBACION_LABEL[detalle.estado] ?? detalle.estado}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 text-white">
              <FileStack className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-text-primary">Revisión de checklist</p>
          </div>
        )
      }
      size="lg"
      showCloseButton
      closeOnClickOutside
      footer={modalFooter}
    >
      <div className="space-y-4 text-sm">
        {!aprobacionId && (
          <p className="text-xs text-muted-foreground">No hay elemento seleccionado.</p>
        )}

        {aprobacionId && isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size={48} showText={true} text="Cargando checklist..." />
          </div>
        )}

        {aprobacionId && isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            <p className="text-sm font-medium">No se pudo cargar el detalle.</p>
            <p className="mt-1 text-xs opacity-90">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <Button
              variant="custom"
              color="red"
              size="sm"
              type="button"
              className="mt-3"
              onClick={() => void refetch()}
            >
              Reintentar
            </Button>
          </div>
        )}

        {detalle && checklist && (
          <>
            <section className="space-y-2" aria-labelledby="revision-resumen-heading">
              <h3 id="revision-resumen-heading" className="font-bold text-xs text-text-primary">
                Resumen
              </h3>
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ResumenStat icon={FileStack} label="Checklist">
                    <p className="text-xs text-muted-foreground">{checklist.nombre}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{checklist.codigo}</p>
                  </ResumenStat>
                  {detalle.montoSolicitado != null ? (
                    <ResumenStat icon={FileText} label="Monto solicitado">
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {new Intl.NumberFormat('es-PE', {
                          style: 'currency',
                          currency: 'PEN',
                        }).format(Number(detalle.montoSolicitado))}
                      </p>
                    </ResumenStat>
                  ) : null}
                </div>
                {checklist.descripcion ? (
                  <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                    {checklist.descripcion}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="revision-requisitos-heading">
              <header className="space-y-2">
                <h3 id="revision-requisitos-heading" className="font-bold text-xs text-text-primary">
                  Requisitos y entregas
                </h3>
              </header>
              <ul className="space-y-3">
                {requisitos.map((req) => (
                  <RequisitoEntregaCard
                    key={req.id}
                    requisito={req}
                    entregas={porRequisito.get(req.id) ?? []}
                    revisionPorDoc={revisionPorDoc}
                    onPatchDoc={patchRevisionDoc}
                    soloLecturaRevision={soloLecturaRevision}
                  />
                ))}
              </ul>

              {sinReq.length > 0 ? (
                <div className="space-y-3 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/[0.06] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Archivos sin requisito asociado ({sinReq.length})
                  </p>
                  <ul className="space-y-3">
                    {sinReq.map((doc) => (
                      <DocumentoRevisionRow
                        key={doc.id}
                        doc={doc}
                        revision={revisionPorDoc[doc.id]}
                        onPatch={(p) => patchRevisionDoc(doc.id, p)}
                        soloLecturaRevision={soloLecturaRevision}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            {solicitudPagoIdParaReportes ? (
              <section className="space-y-3" aria-labelledby="revision-reportes-sp-heading">
                <header className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <h3 id="revision-reportes-sp-heading" className="font-bold text-xs text-text-primary">
                    Reportes operativos
                  </h3>
                </header>
                <p className="text-[11px] text-muted-foreground">
                  Reportes de trabajo vinculados a esta solicitud de pago (si el proveedor los registró).
                </p>

                {reportesOperativosLoading ? (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner size={32} showText text="Cargando reportes…" />
                  </div>
                ) : null}

                {reportesOperativosError ? (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
                    No se pudieron cargar los reportes:{' '}
                    {reportesOperativosErr instanceof Error
                      ? reportesOperativosErr.message
                      : 'Error desconocido'}
                  </div>
                ) : null}

                {!reportesOperativosLoading &&
                !reportesOperativosError &&
                reportesOperativos.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    No hay reportes registrados para esta solicitud.
                  </p>
                ) : null}

                {!reportesOperativosLoading && !reportesOperativosError && reportesOperativos.length > 0 ? (
                  <ul className="space-y-2">
                    {reportesOperativos.map((rep) => {
                      const fechaRep = rep.fecha ? new Date(rep.fecha) : null;
                      const fechaLabel =
                        fechaRep && !Number.isNaN(fechaRep.getTime())
                          ? fechaRep.toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—';
                      return (
                        <li
                          key={rep.id}
                          className="rounded-lg border border-border bg-muted/10 p-3 dark:bg-muted/5"
                        >
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-xs font-semibold leading-tight text-text-primary">
                                {rep.codigo?.trim() ? rep.codigo : `Reporte ${rep.id.slice(-6)}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{fechaLabel}</p>
                            </div>
                            <Button
                              type="button"
                              color="blue"
                              size="sm"
                              className="h-8 w-full shrink-0 gap-1.5 sm:w-auto sm:self-start"
                              onClick={() => setReporteVistaId(rep.id)}
                              aria-label={`Ver reporte operativo ${
                                rep.codigo?.trim() ? rep.codigo : rep.id.slice(-6)
                              }`}
                            >
                              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            </Button>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium text-text-primary">Responsable: </span>
                            {rep.maestroResponsable}
                          </p>
                          {rep.observacionesGenerales?.trim() ? (
                            <p className="mt-2 line-clamp-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
                              {rep.observacionesGenerales.trim()}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </div>
    </Modal>

    <ReporteSolicitudPagoForm
      isOpen={Boolean(reporteVistaId)}
      onClose={() => setReporteVistaId(null)}
      mode="view"
      reporteId={reporteVistaId}
    />

    <NotificationModal
      isOpen={confirmKind !== null}
      onClose={cerrarConfirmacion}
      type={confirmKind === 'rechazar' ? 'error' : todosConformesLocales ? 'success' : 'warning'}
      message={
        confirmKind === 'rechazar'
          ? 'Confirmar rechazo'
          : todosConformesLocales
            ? 'Confirmar aprobación'
            : 'Confirmar observaciones'
      }
      description={
        confirmKind === 'finalizar'
          ? confirmFinalizarDescription ?? undefined
          : confirmKind === 'rechazar'
            ? confirmRechazoDescription ?? undefined
            : undefined
      }
      showCommentInput={confirmKind !== null}
      commentRequired={confirmKind === 'rechazar'}
      commentLabel={
        confirmKind === 'rechazar'
          ? 'Motivo del rechazo (obligatorio)'
          : 'Comentario (opcional)'
      }
      commentPlaceholder={
        confirmKind === 'rechazar'
          ? 'Describí el motivo del rechazo de la solicitud…'
          : 'Deja un comentario opcional…'
      }
      confirmText={
        confirmKind === 'rechazar'
          ? 'Rechazar solicitud'
          : todosConformesLocales
            ? 'Aprobar'
            : 'Confirmar'
      }
      cancelText="Volver"
      onConfirm={(comment) => {
        if (confirmKind === 'finalizar') void ejecutarFinalizarRevision(comment);
        else if (confirmKind === 'rechazar') void ejecutarRechazo(comment);
      }}
      onCancel={cerrarConfirmacion}
      loading={finalizarRevision.isPending}
    />
    </>
  );
}

function DocumentoRevisionRow({
  doc,
  revision,
  onPatch,
  soloLecturaRevision = false,
  modoVisualizacion = 'revision',
}: {
  doc: DocumentoSubidoRevisionGql;
  revision: RevisionDocLocal | undefined;
  onPatch: (p: Partial<RevisionDocLocal>) => void;
  soloLecturaRevision?: boolean;
  /** `historial`: solo lectura de una versión anterior (sin controles de revisión). */
  modoVisualizacion?: 'revision' | 'historial';
}) {
  const esHistorial = modoVisualizacion === 'historial';
  const decision = revision?.decision ?? 'APROBADO';
  const comentario = revision?.comentario ?? '';

  return (
    <li
      className={cn(
        'space-y-2 rounded-lg border border-border p-3',
        esHistorial ? 'bg-muted/5 dark:bg-muted/[0.03]' : 'bg-muted/10 dark:bg-muted/5'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {esHistorial ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Versión anterior
          </span>
        ) : null}
        <Badge variant={badgeVariantForEstadoDoc(doc.estado)} className="text-[10px]">
           {ESTADO_DOC_LABEL[doc.estado] ?? doc.estado}
        </Badge>
        <span className="text-[11px] text-muted-foreground">v{doc.version}</span>
      </div>
      <ul className="space-y-1">
        {doc.archivos.map((a) => (
          <li key={a.url + doc.id}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
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
      {doc.comentariosRevision && (
        <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-900 dark:text-amber-100">
          Comentario previo: {doc.comentariosRevision}
        </p>
      )}

      {!soloLecturaRevision && !esHistorial ? (
        <>
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Revisión
            </p>
            <div className="flex justify-center flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={decision === 'APROBADO' ? 'custom' : 'outline'}
                color="emerald"
                className={cn('h-7 text-xs', decision === 'APROBADO' && 'ring-1 ring-emerald-500/40')}
                onClick={() => onPatch({ decision: 'APROBADO' })}
              >
                Conforme
              </Button>
              <Button
                type="button"
                size="sm"
                variant={decision === 'OBSERVADO' ? 'custom' : 'outline'}
                color="orange"
                className={cn('h-7 text-xs', decision === 'OBSERVADO' && 'ring-1 ring-orange-500/40')}
                onClick={() => onPatch({ decision: 'OBSERVADO' })}
              >
                Observar
              </Button>
            </div>
          </div>
          {decision === 'OBSERVADO' && (
            <Textarea
              value={comentario}
              onChange={(e) => onPatch({ comentario: e.target.value })}
              placeholder="Indicá qué corregir en este documento…"
              rows={2}
              className="text-xs"
            />
          )}
        </>
      ) : null}
    </li>
  );
}

function RequisitoEntregaCard({
  requisito,
  entregas,
  revisionPorDoc,
  onPatchDoc,
  soloLecturaRevision = false,
}: {
  requisito: RequisitoRevisionGql;
  entregas: DocumentoSubidoRevisionGql[];
  revisionPorDoc: Record<string, RevisionDocLocal>;
  onPatchDoc: (docId: string, partial: Partial<RevisionDocLocal>) => void;
  soloLecturaRevision?: boolean;
}) {
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const nombre =
    requisito.plantillaDocumento?.nombrePlantilla ??
    (requisito.tipoRequisito === 'formulario' ? 'Formulario' : 'Requisito');
  const plantillaUrl = requisito.plantillaDocumento?.plantillaUrl;

  const entregaActual =
    entregas.length > 0 ? pickUltimaEntregaDelGrupo(entregas) : null;
  const entregasAnteriores = useMemo(() => {
    if (!entregaActual || entregas.length < 2) return [];
    return entregas.filter((d) => d.id !== entregaActual.id).sort(ordenEntregasMasRecientePrimero);
  }, [entregaActual, entregas]);

  return (
    <li className="list-none space-y-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-primary">{nombre}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{requisito.tipoRequisito}</span>
          {requisito.obligatorio && (
            <Badge variant="destructive" className="text-[10px]">
              Obligatorio
            </Badge>
          )}
          {plantillaUrl ? (
            <a
              href={plantillaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Ver plantilla
            </a>
          ) : null}
        </div>
      </div>

      {entregas.length === 0 ? (
        <div className="flex items-center gap-2 rounded border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          Sin archivos subidos.
        </div>
      ) : (
        <div className="space-y-3">
          {entregaActual ? (
            <ul className="list-none space-y-3">
              <DocumentoRevisionRow
                key={entregaActual.id}
                doc={entregaActual}
                revision={revisionPorDoc[entregaActual.id]}
                onPatch={(p) => onPatchDoc(entregaActual.id, p)}
                soloLecturaRevision={soloLecturaRevision}
              />
            </ul>
          ) : null}

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
                <ul className="space-y-3 border-l-2 border-dashed border-border pl-3">
                  {entregasAnteriores.map((doc) => (
                    <DocumentoRevisionRow
                      key={doc.id}
                      doc={doc}
                      revision={undefined}
                      onPatch={() => {}}
                      soloLecturaRevision
                      modoVisualizacion="historial"
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </li>
  );
}
