'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/modal';
import { Button, Input, Textarea } from '@/components/ui';
import {
  useCrearReporteSolicitudPago,
  useReporteSolicitudPago,
  type CuadrillaReporteSolicitudPagoInput,
  type ActividadReporteSolicitudPagoInput,
  type PersonalReporteSolicitudPagoInput,
  type CrearReporteSolicitudPagoInput,
  type ReporteSolicitudPagoDetalle,
} from '@/hooks/useReporteSolicitudPago';
import { useUpload } from '@/hooks/useUpload';
import toast from 'react-hot-toast';
import {
  ClipboardPlus,
  Plus,
  Trash2,
  Users,
  FileText,
  X,
  ImagePlus,
  Eye,
  BookOpen,
} from 'lucide-react';

const MAX_IMAGENES_POR_ACTIVIDAD = 5;

/** `file` solo en creación (blob + subida); en lectura solo `previewUrl` (URL remota). */
type ImagenActividadLocal = { previewUrl: string; file?: File };

function revokeImagenPreviewItems(items: ImagenActividadLocal[]) {
  items.forEach((item) => {
    if (!item.previewUrl.startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(item.previewUrl);
    } catch {
      /* ignore */
    }
  });
}

function newClientKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Fila de actividad en formulario: incluye clave estable para previews locales (no se envía al API). */
type ActividadFormRow = ActividadReporteSolicitudPagoInput & { clientKey: string };

type CuadrillaFormRow = Omit<CuadrillaReporteSolicitudPagoInput, 'actividades'> & {
  actividades: ActividadFormRow[];
};

const SECTION_TITLE = 'text-xs font-semibold text-text-primary tracking-tight';
const SECTION_CARD = 'rounded-lg border border-border-color bg-card-bg shadow-sm';
const INNER_CARD = 'rounded-lg border border-border-color bg-muted/40';
const FIELD_LBL = 'block text-xs font-medium text-text-secondary mb-1';
/** Mismo criterio que inputs en tabla (nombre/cargo): texto primario y placeholder atenuado vía opacidad, sin `muted-foreground` que aquí no coincide con el tema. */
const INPUT_FIELD =
  'h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-text-primary placeholder:text-text-primary placeholder:opacity-55';
const TEXTAREA_FIELD =
  'min-h-[4.5rem] w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs text-text-primary placeholder:text-text-primary placeholder:opacity-55';

function emptyActividad(): ActividadFormRow {
  return {
    actividad: '',
    und: '',
    tiempoHoras: 0,
    meta: 0,
    real: 0,
    evidencias: [],
    clientKey: newClientKey(),
  };
}

function emptyPersonal(): PersonalReporteSolicitudPagoInput {
  return { nombreCompleto: '', cargo: '', observaciones: '' };
}

function emptyCuadrilla(): CuadrillaFormRow {
  return {
    personal: [emptyPersonal()],
    actividades: [emptyActividad()],
    observaciones: '',
  };
}

/** `YYYY-MM-DDTHH:mm` en hora local para `input type="datetime-local"`. */
function toDatetimeLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mapDetalleToFormState(detalle: ReporteSolicitudPagoDetalle): {
  identificadorSolicitudPago: string;
  fechaLocal: string;
  maestroResponsable: string;
  observacionesGenerales: string;
  cuadrillas: CuadrillaFormRow[];
  imagenesActividad: Record<string, ImagenActividadLocal[]>;
} {
  const imagenesActividad: Record<string, ImagenActividadLocal[]> = {};
  const rawCuadrillas = detalle.cuadrillas ?? [];
  const cuadrillas: CuadrillaFormRow[] =
    rawCuadrillas.length > 0
      ? rawCuadrillas.map((cq) => ({
          observaciones: cq.observaciones ?? '',
          personal:
            (cq.personal ?? []).length > 0
              ? (cq.personal ?? []).map((p) => ({
                  nombreCompleto: p.nombreCompleto ?? '',
                  cargo: p.cargo ?? '',
                  observaciones: p.observaciones ?? '',
                }))
              : [emptyPersonal()],
          actividades:
            (cq.actividades ?? []).length > 0
              ? (cq.actividades ?? []).map((a) => {
                  const clientKey = newClientKey();
                  imagenesActividad[clientKey] = (a.evidencias ?? []).map((e) => ({
                    previewUrl: e.url,
                  }));
                  return {
                    clientKey,
                    actividad: a.actividad ?? '',
                    und: a.und ?? '',
                    tiempoHoras: Number(a.tiempoHoras) || 0,
                    meta: Number(a.meta) || 0,
                    real: Number(a.real) || 0,
                    evidencias: a.evidencias ?? [],
                  };
                })
              : [emptyActividad()],
        }))
      : [emptyCuadrilla()];

  return {
    identificadorSolicitudPago: detalle.identificadorSolicitudPago?.trim() ?? '',
    fechaLocal: detalle.fecha ? toDatetimeLocalInputValue(new Date(detalle.fecha)) : '',
    maestroResponsable: detalle.maestroResponsable ?? '',
    observacionesGenerales: detalle.observacionesGenerales ?? '',
    cuadrillas,
    imagenesActividad,
  };
}

export interface ReporteSolicitudPagoFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Por defecto `create`: alta. `view`: solo lectura con `reporteId`. */
  mode?: 'create' | 'view';
  reporteId?: string | null;
}

export default function ReporteSolicitudPagoForm({
  isOpen,
  onClose,
  mode = 'create',
  reporteId = null,
}: ReporteSolicitudPagoFormProps) {
  const readOnly = mode === 'view';
  const [identificadorSolicitudPago, setIdentificadorSolicitudPago] = useState('');
  const [fechaLocal, setFechaLocal] = useState('');
  const [maestroResponsable, setMaestroResponsable] = useState('');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [cuadrillas, setCuadrillas] = useState<CuadrillaFormRow[]>([emptyCuadrilla()]);
  const [imagenesActividad, setImagenesActividad] = useState<Record<string, ImagenActividadLocal[]>>({});

  const crear = useCrearReporteSolicitudPago();
  const { uploadMultipleFiles, isUploading } = useUpload();
  const {
    data: detalle,
    isLoading: detalleLoading,
    isError: detalleError,
    error: detalleErr,
  } = useReporteSolicitudPago(reporteId, isOpen && readOnly && Boolean(reporteId));

  const lastCuadrillaCardRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToLastCuadrillaRef = useRef(false);
  const hydratedReporteIdRef = useRef<string | null>(null);

  const removeImagenesKeys = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setImagenesActividad((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        revokeImagenPreviewItems(next[k] || []);
        delete next[k];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      hydratedReporteIdRef.current = null;
      return;
    }
    if (readOnly) return;
    setIdentificadorSolicitudPago('');
    setFechaLocal('');
    setMaestroResponsable('');
    setObservacionesGenerales('');
    setImagenesActividad((prev) => {
      Object.values(prev)
        .flat()
        .forEach((item) => revokeImagenPreviewItems([item]));
      return {};
    });
    setCuadrillas([emptyCuadrilla()]);
  }, [isOpen, readOnly]);

  useEffect(() => {
    if (!isOpen || !readOnly || !reporteId) return;
    if (detalleLoading || !detalle) return;
    if (hydratedReporteIdRef.current === reporteId) return;
    hydratedReporteIdRef.current = reporteId;
    const s = mapDetalleToFormState(detalle);
    setIdentificadorSolicitudPago(s.identificadorSolicitudPago);
    setFechaLocal(s.fechaLocal);
    setMaestroResponsable(s.maestroResponsable);
    setObservacionesGenerales(s.observacionesGenerales);
    setCuadrillas(s.cuadrillas);
    setImagenesActividad(s.imagenesActividad);
  }, [isOpen, readOnly, reporteId, detalle, detalleLoading]);

  useEffect(() => {
    if (readOnly) return;
    if (!shouldScrollToLastCuadrillaRef.current) return;
    shouldScrollToLastCuadrillaRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lastCuadrillaCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, [cuadrillas.length, readOnly]);

  const updateCuadrilla = (idx: number, next: CuadrillaFormRow) => {
    setCuadrillas((prev) => prev.map((c, i) => (i === idx ? next : c)));
  };

  const addCuadrilla = () => {
    shouldScrollToLastCuadrillaRef.current = true;
    setCuadrillas((prev) => [...prev, emptyCuadrilla()]);
  };
  const removeCuadrilla = (idx: number) => {
    setCuadrillas((prev) => {
      if (prev.length <= 1) return prev;
      const removed = prev[idx];
      if (removed) {
        const keys = removed.actividades.map((a) => a.clientKey);
        queueMicrotask(() => removeImagenesKeys(keys));
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const countImagenesActividad = (clientKey: string) => imagenesActividad[clientKey]?.length ?? 0;

  const handleAddImagenesActividad = (clientKey: string, fileList: FileList | null) => {
    if (readOnly) return;
    if (!fileList?.length) return;
    const current = countImagenesActividad(clientKey);
    const room = MAX_IMAGENES_POR_ACTIVIDAD - current;
    if (room <= 0) {
      toast.error(`Máximo ${MAX_IMAGENES_POR_ACTIVIDAD} imágenes por actividad`);
      return;
    }
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      toast.error('Seleccione solo archivos de imagen');
      return;
    }
    const toAdd = files.slice(0, room);
    if (files.length > room) {
      toast(`Solo se añadieron ${room} imagen(es) (límite ${MAX_IMAGENES_POR_ACTIVIDAD})`, { duration: 3500 });
    }
    const nuevas: ImagenActividadLocal[] = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImagenesActividad((prev) => ({
      ...prev,
      [clientKey]: [...(prev[clientKey] || []), ...nuevas],
    }));
  };

  const handleRemoveImagenActividad = (clientKey: string, imageIndex: number) => {
    setImagenesActividad((prev) => {
      const list = prev[clientKey];
      if (!list?.length) return prev;
      const item = list[imageIndex];
      if (item) revokeImagenPreviewItems([item]);
      const nextList = list.filter((_, i) => i !== imageIndex);
      const next = { ...prev };
      if (nextList.length === 0) delete next[clientKey];
      else next[clientKey] = nextList;
      return next;
    });
  };

  /** Orden estable: una fila por actividad del formulario; evidencias opcionales. */
  const collectEvidenceUploadQueue = useCallback((): { clientKey: string; file: File }[] => {
    const queue: { clientKey: string; file: File }[] = [];
    for (const cq of cuadrillas) {
      for (const a of cq.actividades) {
        for (const img of imagenesActividad[a.clientKey] ?? []) {
          if (img.file) queue.push({ clientKey: a.clientKey, file: img.file });
        }
      }
    }
    return queue;
  }, [cuadrillas, imagenesActividad]);

  const validateReporteForm = useCallback((): boolean => {
    if (!identificadorSolicitudPago.trim()) {
      toast.error('El identificador de la solicitud de pago es obligatorio.');
      return false;
    }
    if (!maestroResponsable.trim()) {
      toast.error('El maestro o responsable es obligatorio.');
      return false;
    }

    for (let ci = 0; ci < cuadrillas.length; ci++) {
      const cq = cuadrillas[ci]!;
      const n = ci + 1;

      if (!cq.observaciones?.trim()) {
        toast.error(`Cuadrilla ${n}: las observaciones de la cuadrilla son obligatorias.`);
        return false;
      }

      if (cq.personal.length === 0) {
        toast.error(`Cuadrilla ${n}: agregue al menos una persona.`);
        return false;
      }
      for (let pi = 0; pi < cq.personal.length; pi++) {
        const p = cq.personal[pi]!;
        if (!p.nombreCompleto.trim() || !p.cargo.trim()) {
          toast.error(`Cuadrilla ${n}, fila ${pi + 1} del personal: complete la información requerida.`);
          return false;
        }
      }

      if (cq.actividades.length === 0) {
        toast.error(`Cuadrilla ${n}: agregue al menos una actividad.`);
        return false;
      }
      for (let ai = 0; ai < cq.actividades.length; ai++) {
        const a = cq.actividades[ai]!;
        if (!a.actividad.trim()) {
          toast.error(`Cuadrilla ${n}, actividad ${ai + 1}: la descripción es obligatoria.`);
          return false;
        }
        if (!a.und.trim()) {
          toast.error(`Cuadrilla ${n}, actividad ${ai + 1}: la unidad (Und.) es obligatoria.`);
          return false;
        }
        const th = Number(a.tiempoHoras);
        const meta = Number(a.meta);
        const real = Number(a.real);
        if (!Number.isFinite(th) || th < 0) {
          toast.error(`Cuadrilla ${n}, actividad ${ai + 1}: indique horas válidas (≥ 0).`);
          return false;
        }
        if (!Number.isFinite(meta) || meta < 0) {
          toast.error(`Cuadrilla ${n}, actividad ${ai + 1}: indique meta válida (≥ 0).`);
          return false;
        }
        if (!Number.isFinite(real) || real < 0) {
          toast.error(`Cuadrilla ${n}, actividad ${ai + 1}: indique valor real válido (≥ 0).`);
          return false;
        }
      }
    }

    return true;
  }, [cuadrillas, identificadorSolicitudPago, maestroResponsable]);

  const buildPayload = useCallback(
    (urlsByClientKey: Map<string, string[]>): CrearReporteSolicitudPagoInput | null => {
      if (!validateReporteForm()) return null;

      const mapped: CuadrillaReporteSolicitudPagoInput[] = cuadrillas.map((cq) => {
        const personal = cq.personal.map((p) => {
          const o = p.observaciones?.trim();
          return {
            nombreCompleto: p.nombreCompleto.trim(),
            cargo: p.cargo.trim(),
            ...(o ? { observaciones: o } : {}),
          };
        });
        const actividades = cq.actividades.map((row) => {
          const { clientKey, actividad, und, tiempoHoras, meta, real } = row;
          const urls = urlsByClientKey.get(clientKey) ?? [];
          return {
            actividad: actividad.trim(),
            und: und.trim(),
            tiempoHoras: Number(tiempoHoras) || 0,
            meta: Number(meta) || 0,
            real: Number(real) || 0,
            evidencias: urls.map((url) => ({ url })),
          };
        });
        return {
          personal,
          actividades,
          observaciones: cq.observaciones!.trim(),
        };
      });

      const fechaIso = new Date().toISOString();
      const obsG = observacionesGenerales.trim();

      return {
        identificadorSolicitudPago: identificadorSolicitudPago.trim(),
        fecha: fechaIso,
        maestroResponsable: maestroResponsable.trim(),
        cuadrillas: mapped,
        ...(obsG ? { observacionesGenerales: obsG } : {}),
      };
    },
    [cuadrillas, identificadorSolicitudPago, maestroResponsable, observacionesGenerales, validateReporteForm]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const emptyUrls = new Map<string, string[]>();
    if (!buildPayload(emptyUrls)) return;

    const queue = collectEvidenceUploadQueue();
    const urlsByClientKey = new Map<string, string[]>();

    try {
      if (queue.length > 0) {
        const batch = await uploadMultipleFiles(
          queue.map((q) => q.file),
          { tipo: 'EVIDENCIAS_PAGO' }
        );
        if (batch.failed.length > 0) {
          const msg = batch.failed.map((f) => `${f.filename}: ${f.error}`).join('; ');
          toast.error(`Error al subir imágenes: ${msg}`);
          return;
        }
        if (batch.successful.length !== queue.length) {
          toast.error('No se subieron todas las imágenes; intente de nuevo');
          return;
        }
        for (let i = 0; i < queue.length; i++) {
          const { clientKey } = queue[i]!;
          const { url } = batch.successful[i]!;
          const list = urlsByClientKey.get(clientKey) ?? [];
          list.push(url);
          urlsByClientKey.set(clientKey, list);
        }
      }

      const input = buildPayload(urlsByClientKey);
      if (!input) return;

      const created = await crear.mutateAsync(input);
      const cod = created?.crearReporteSolicitudPago?.codigo?.trim();
      toast.success(cod ? `Reporte ${cod} registrado correctamente` : 'Reporte registrado correctamente');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el reporte');
    }
  };

  const modalTitle = readOnly ? (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
        <BookOpen className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-text-primary">Reporte de solicitud</h2>
        {detalle?.codigo?.trim() ? (
          <p className="text-xs font-mono font-medium text-text-secondary">{detalle.codigo.trim()}</p>
        ) : null}
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
        <ClipboardPlus className="h-5 w-5 text-blue-600 dark:text-blue-300" aria-hidden />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-text-primary">Nuevo reporte de solicitud</h2>
        <p className="text-xs text-muted-foreground">Cuadrillas, personal y actividades con imágenes</p>
      </div>
    </div>
  );

  const footerCreate = (
    <div className="flex w-full items-center justify-end gap-2">
      <Button
        variant="custom"
        color="secondary"
        size="xs"
        type="button"
        onClick={onClose}
        disabled={crear.isPending || isUploading}
      >
        Cancelar
      </Button>
      <Button
        variant="custom"
        size="xs"
        type="submit"
        form="form-nuevo-reporte-solicitud"
        loading={crear.isPending || isUploading}
        disabled={crear.isPending || isUploading}
        color="blue"
      >
        Guardar reporte
      </Button>
    </div>
  );

  const footerView = (
    <div className="flex w-full items-center justify-end gap-2">
      <Button variant="custom" color="secondary" size="xs" type="button" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={readOnly ? footerView : footerCreate}
      size="lg-tall"
      showCloseButton
    >
      {readOnly && detalleLoading ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs text-text-secondary">Cargando reporte…</p>
        </div>
      ) : readOnly && detalleError ? (
        <div className="min-h-[200px] px-2 py-8 text-center text-sm text-red-600">
          {detalleErr instanceof Error ? detalleErr.message : 'No se pudo cargar el reporte'}
        </div>
      ) : (
      <form
        id="form-nuevo-reporte-solicitud"
        onSubmit={handleSubmit}
        className="h-full space-y-3 overflow-y-auto pr-1"
      >
        {/* Datos del reporte — mismo ritmo que "Datos del Informe" */}
        <div className="space-y-2">
          <h3 className={`${SECTION_TITLE} flex items-center gap-2`}>
            <FileText className="h-4 w-4 shrink-0 text-blue-400" aria-hidden />
            Datos del reporte
          </h3>
          <div className={`${SECTION_CARD} p-3`}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {readOnly && detalle?.codigo?.trim() ? (
                <div className="md:col-span-2">
                  <label className={FIELD_LBL}>Código del reporte</label>
                  <Input
                    value={detalle.codigo.trim()}
                    readOnly
                    className={`${INPUT_FIELD} font-mono disabled:opacity-90`}
                    disabled
                  />
                </div>
              ) : null}
              <div className="md:col-span-2">
                <label className={FIELD_LBL}>
                  Identificador de solicitud de pago {!readOnly ? <span className="text-red-500">*</span> : null}
                </label>
                <Input
                  value={identificadorSolicitudPago}
                  onChange={(e) => setIdentificadorSolicitudPago(e.target.value)}
                  placeholder="Coloque algun identificador para despues asociarlo a una solicitud de pago"
                  className={INPUT_FIELD}
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className={FIELD_LBL}>
                  Fecha del reporte
                </label>
                <Input
                  type="datetime-local"
                  value={readOnly ? fechaLocal : toDatetimeLocalInputValue(new Date())}
                  className={`${INPUT_FIELD} disabled:opacity-90`}
                  disabled
                  title={
                    readOnly
                      ? undefined
                      : 'Se registra la fecha y hora actuales al enviar el reporte.'
                  }
                />
              </div>
              <div>
                <label className={FIELD_LBL}>
                  Maestro / responsable {!readOnly ? <span className="text-red-500">*</span> : null}
                </label>
                <Input
                  value={maestroResponsable}
                  onChange={(e) => setMaestroResponsable(e.target.value)}
                  placeholder="Nombre completo"
                  className={INPUT_FIELD}
                  disabled={readOnly}
                />
              </div>
              <div className="md:col-span-2">
                <label className={FIELD_LBL}>
                  Observaciones generales{' '}
                  <span className="font-normal text-text-secondary">(opcional)</span>
                </label>
                <Textarea
                  value={observacionesGenerales}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
                  rows={3}
                  className={TEXTAREA_FIELD}
                  placeholder="Opcional — resumen o contexto del período"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cuadrillas — título arriba; añadir al final de la lista, centrado */}
        <div className="space-y-3">
          <h3 className={`${SECTION_TITLE} flex items-center gap-2`}>
            <Users className="h-4 w-4 shrink-0 text-blue-400" aria-hidden />
            Cuadrillas en campo <span className="font-normal text-text-secondary">({cuadrillas.length})</span>
          </h3>
          {cuadrillas.map((cq, ci) => (
            <div
              key={ci}
              ref={ci === cuadrillas.length - 1 ? lastCuadrillaCardRef : undefined}
              className={`${SECTION_CARD} overflow-hidden scroll-mt-3`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-color bg-muted/40 px-3 py-2.5 dark:bg-muted/25">
                <h4 className="text-xs font-semibold text-text-primary">
                  Cuadrilla {ci + 1} {!readOnly ? <span className="text-red-500">*</span> : null}
                </h4>
                {!readOnly && ci > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-8 gap-1 text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                    onClick={() => removeCuadrilla(ci)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar cuadrilla
                  </Button>
                ) : null}
              </div>

              <div className="space-y-4 p-3">
                <div>
                  <label className={FIELD_LBL}>
                    Observaciones de la cuadrilla {!readOnly ? <span className="text-red-500">*</span> : null}
                  </label>
                  <Input
                    value={cq.observaciones ?? ''}
                    onChange={(e) => updateCuadrilla(ci, { ...cq, observaciones: e.target.value })}
                    className={INPUT_FIELD}
                    placeholder="Obligatorio — contexto de esta cuadrilla"
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-text-primary">
                    Personal {!readOnly ? <span className="text-red-500">*</span> : null}
                  </p>
                  <div className="space-y-2 rounded-lg border-0 border-border-color sm:border sm:p-2">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/50 dark:bg-muted/30">
                            <th
                              className="min-w-[200px] border border-border-color p-2 text-left font-semibold text-text-primary"
                              style={{ color: 'var(--text-on-content-bg-heading, var(--text-primary))' }}
                            >
                              Nombre completo {!readOnly ? <span className="text-red-500">*</span> : null}
                            </th>
                            <th className="min-w-[120px] border border-border-color p-2 text-left font-semibold text-text-primary">
                              Cargo {!readOnly ? <span className="text-red-500">*</span> : null}
                            </th>
                            <th className="min-w-[180px] border border-border-color p-2 text-left font-semibold text-text-primary">
                              Observaciones <span className="font-normal text-text-secondary">(opcional)</span>
                            </th>
                            <th className="w-12 border border-border-color p-2 text-center font-semibold text-text-primary">
                              {/* Acciones */}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cq.personal.map((p, pi) => (
                            <tr key={pi} className="hover:bg-muted/15">
                              <td className="border border-border-color p-0.5 align-top">
                                <Input
                                  value={p.nombreCompleto}
                                  onChange={(e) => {
                                    const next = [...cq.personal];
                                    next[pi] = { ...p, nombreCompleto: e.target.value };
                                    updateCuadrilla(ci, { ...cq, personal: next });
                                  }}
                                  placeholder="Nombre completo"
                                  className="h-8 w-full rounded border-border px-2 text-xs"
                                  disabled={readOnly}
                                />
                              </td>
                              <td className="border border-border-color p-0.5 align-top">
                                <Input
                                  value={p.cargo}
                                  onChange={(e) => {
                                    const next = [...cq.personal];
                                    next[pi] = { ...p, cargo: e.target.value };
                                    updateCuadrilla(ci, { ...cq, personal: next });
                                  }}
                                  placeholder="Cargo"
                                  className="h-8 w-full rounded border-border px-2 text-xs"
                                  disabled={readOnly}
                                />
                              </td>
                              <td className="border border-border-color p-0.5 align-top">
                                <Input
                                  value={p.observaciones ?? ''}
                                  onChange={(e) => {
                                    const next = [...cq.personal];
                                    next[pi] = { ...p, observaciones: e.target.value };
                                    updateCuadrilla(ci, { ...cq, personal: next });
                                  }}
                                  placeholder="Opcional"
                                  className="h-8 w-full rounded border-border px-2 text-xs"
                                  disabled={readOnly}
                                />
                              </td>
                              <td className="border border-border-color p-0.5 align-middle text-center">
                                {!readOnly ? (
                                  <button
                                    type="button"
                                    title={pi > 0 ? 'Quitar persona' : 'Limpiar fila'}
                                    className="rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                                    onClick={() => {
                                      if (pi > 0) {
                                        updateCuadrilla(ci, {
                                          ...cq,
                                          personal: cq.personal.filter((_, j) => j !== pi),
                                        });
                                      } else {
                                        const next = [...cq.personal];
                                        next[0] = emptyPersonal();
                                        updateCuadrilla(ci, { ...cq, personal: next });
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => updateCuadrilla(ci, { ...cq, personal: [...cq.personal, emptyPersonal()] })}
                        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border-color p-2 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-muted/40"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Añadir persona</span>
                      </button>
                    ) : null}
                  </div>
                </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="text-xs font-semibold text-text-primary">
                    Actividades realizadas {!readOnly ? <span className="text-red-500">*</span> : null}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border-0 border-border-color sm:border sm:p-2">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/50 dark:bg-muted/30">
                            <th
                              className="border border-border-color p-2 text-left font-semibold text-text-primary"
                              style={{ color: 'var(--text-on-content-bg-heading, var(--text-primary))' }}
                            >
                              Descripción {!readOnly ? <span className="text-red-500">*</span> : null}
                            </th>
                            <th className="w-16 border border-border-color p-2 text-center font-semibold text-text-primary">
                              Und. {!readOnly ? <span className="text-red-500">*</span> : null}
                            </th>
                            <th className="w-16 border border-border-color p-2 text-center font-semibold text-text-primary">
                              Horas {!readOnly ? <span className="text-red-500">*</span> : null}
                            </th>
                            <th className="w-16 border border-border-color p-2 text-center font-semibold text-text-primary">
                              Meta {!readOnly ? <span className="text-red-500">*</span> : null}
                            </th>
                            <th className="w-16 border border-border-color p-2 text-center font-semibold text-text-primary">
                              Real {!readOnly ? <span className="text-red-500">*</span> : null}
                            </th>
                            <th className="min-w-[140px] border border-border-color p-2 text-center font-semibold text-text-primary">
                              Evidencias <span className="font-normal text-text-secondary">(opcional)</span>
                            </th>
                          <th className="w-12 border border-border-color p-2 text-center font-semibold text-text-primary">
                            {/* Acciones */}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cq.actividades.map((a, ai) => (
                          <tr key={a.clientKey} className="hover:bg-muted/15">
                            <td className="border border-border-color p-0.5 align-top">
                              <Input
                                value={a.actividad}
                                onChange={(e) => {
                                  const next = [...cq.actividades];
                                  next[ai] = { ...a, actividad: e.target.value };
                                  updateCuadrilla(ci, { ...cq, actividades: next });
                                }}
                                placeholder="Descripción de la actividad"
                                className="h-auto min-h-8 w-full rounded border-border px-2 py-1.5 text-xs"
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-border-color p-0.5 align-top">
                              <Input
                                value={a.und}
                                onChange={(e) => {
                                  const next = [...cq.actividades];
                                  next[ai] = { ...a, und: e.target.value };
                                  updateCuadrilla(ci, { ...cq, actividades: next });
                                }}
                                placeholder="Und."
                                className="h-8 w-full rounded border-border px-1.5 text-xs"
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-border-color p-0.5 align-top">
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={a.tiempoHoras}
                                onChange={(e) => {
                                  const next = [...cq.actividades];
                                  next[ai] = { ...a, tiempoHoras: parseFloat(e.target.value) || 0 };
                                  updateCuadrilla(ci, { ...cq, actividades: next });
                                }}
                                placeholder="0"
                                className="h-8 w-full rounded border-border px-1.5 text-xs"
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-border-color p-0.5 align-top">
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={a.meta}
                                onChange={(e) => {
                                  const next = [...cq.actividades];
                                  next[ai] = { ...a, meta: parseFloat(e.target.value) || 0 };
                                  updateCuadrilla(ci, { ...cq, actividades: next });
                                }}
                                placeholder="0"
                                className="h-8 w-full rounded border-border px-1.5 text-xs"
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-border-color p-0.5 align-top">
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={a.real}
                                onChange={(e) => {
                                  const next = [...cq.actividades];
                                  next[ai] = { ...a, real: parseFloat(e.target.value) || 0 };
                                  updateCuadrilla(ci, { ...cq, actividades: next });
                                }}
                                placeholder="0"
                                className="h-8 w-full rounded border-border px-1.5 text-xs"
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-border-color p-0.5 align-middle text-center">
                              <div className="flex min-h-10 flex-wrap items-center justify-center gap-1 py-1">
                                {(imagenesActividad[a.clientKey] || []).map((img, imgIndex) => (
                                  <div
                                    key={`${a.clientKey}-${imgIndex}-${img.previewUrl}`}
                                    className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-border-color bg-muted"
                                  >
                                    <img
                                      src={img.previewUrl}
                                      alt=""
                                      className="h-full w-full cursor-pointer object-cover"
                                      onClick={() => window.open(img.previewUrl, '_blank', 'noopener,noreferrer')}
                                    />
                                    {!readOnly ? (
                                      <button
                                        type="button"
                                        title="Quitar imagen"
                                        className="absolute right-0 top-0 flex h-3 w-3 items-center justify-center rounded-bl bg-red-600 text-white hover:bg-red-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveImagenActividad(a.clientKey, imgIndex);
                                        }}
                                      >
                                        <X className="h-2 w-2" strokeWidth={3} />
                                      </button>
                                    ) : null}
                                  </div>
                                ))}
                                {!readOnly &&
                                  countImagenesActividad(a.clientKey) < MAX_IMAGENES_POR_ACTIVIDAD && (
                                  <div className="relative shrink-0">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      id={`actividad-imagen-${a.clientKey}`}
                                      onChange={(e) => {
                                        handleAddImagenesActividad(a.clientKey, e.target.files);
                                        e.target.value = '';
                                      }}
                                    />
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-dashed border-border text-muted-foreground transition-colors hover:border-border-color hover:bg-muted/80"
                                      onClick={() =>
                                        document.getElementById(`actividad-imagen-${a.clientKey}`)?.click()
                                      }
                                      onKeyDown={(e) =>
                                        e.key === 'Enter' &&
                                        document.getElementById(`actividad-imagen-${a.clientKey}`)?.click()
                                      }
                                      title={`Agregar imágenes (${countImagenesActividad(a.clientKey)}/${MAX_IMAGENES_POR_ACTIVIDAD})`}
                                    >
                                      <ImagePlus className="h-3 w-3" aria-hidden />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-[8px] text-muted-foreground">
                                {countImagenesActividad(a.clientKey)}/{MAX_IMAGENES_POR_ACTIVIDAD}
                              </div>
                            </td>
                            <td className="border border-border-color p-0.5 align-middle text-center">
                              {!readOnly ? (
                                <button
                                  type="button"
                                  title={ai > 0 ? 'Eliminar actividad' : 'Limpiar fila'}
                                  className="rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                                  onClick={() => {
                                    removeImagenesKeys([a.clientKey]);
                                    if (ai > 0) {
                                      updateCuadrilla(ci, {
                                        ...cq,
                                        actividades: cq.actividades.filter((_, j) => j !== ai),
                                      });
                                    } else {
                                      const next = [...cq.actividades];
                                      next[0] = emptyActividad();
                                      updateCuadrilla(ci, { ...cq, actividades: next });
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateCuadrilla(ci, {
                          ...cq,
                          actividades: [...cq.actividades, emptyActividad()],
                        })
                      }
                      className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border-color p-2 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-muted/40"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Añadir actividad</span>
                    </button>
                  ) : null}
                </div>
              </div>
              </div>
            </div>
          ))}
          {!readOnly ? (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-8 border-dashed text-xs"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={addCuadrilla}
              >
                Añadir cuadrilla
              </Button>
            </div>
          ) : null}
        </div>
      </form>
      )}
    </Modal>
  );
}
