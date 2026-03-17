'use client';

import { Button } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { Edit, CheckCircle, XCircle, Tag, Calendar, Clock, FileText } from 'lucide-react';
import type { TipoDocumento } from '@/hooks/useTipoDocumento';

interface TipoDocumentoViewProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: TipoDocumento | null;
  onEdit?: (tipo: TipoDocumento) => void;
}

export default function TipoDocumentoView({
  isOpen,
  onClose,
  tipo,
  onEdit
}: TipoDocumentoViewProps) {
  if (!tipo) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(tipo);
    }
    onClose();
  };

  const getEstadoColor = (estado: string) => {
    return estado === 'activo' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <span className="text-sm font-semibold text-text-primary">
              {tipo.nombre || 'Tipo de Documento'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Código: {tipo.codigo}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(tipo.estado)}`}>
                {tipo.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="custom"
            color="blue"
            icon={<Edit className="h-4 w-4" />}
            onClick={handleEdit}
          >
            Editar
          </Button>
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            className="px-4 py-2"
          >
            Cerrar
          </Button>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Información Principal */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs">Información Principal</h3>
          <div className="p-2 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <Tag className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{tipo.nombre || "-"}</div>

                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Código</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tipo.codigo}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Estado</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tipo.estado === 'activo' ? 'Disponible para uso' : 'No disponible'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datos Clave */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs">Datos Clave</h3>
          <div className="p-2 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Código</label>
                <div className="text-xs font-medium text-primary p-1 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {tipo.codigo || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre</label>
                <div className="text-xs font-medium text-primary p-1 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {tipo.nombre || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Estado</label>
                <div className={`text-xs font-medium p-1 rounded ${getEstadoColor(tipo.estado)}`}>
                  {tipo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs">Descripción</h3>
          <div className="p-3 rounded-lg border border-border bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-950/20 dark:to-slate-950/20">
            <div className="text-center">
              
              <p className="text-xs text-muted-foreground whitespace-pre-line">
                {tipo.descripcion || 'No hay descripción disponible para este tipo de documento.'}
              </p>
            </div>
          </div>
        </div>

        {/* Fechas del Registro */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs">Registro de Fechas</h3>
          <div className="p-2 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">FC</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold">Fecha Creación</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tipo.fechaCreacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {tipo.fechaActualizacion && (
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">UA</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">Última Actualización</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tipo.fechaActualizacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
