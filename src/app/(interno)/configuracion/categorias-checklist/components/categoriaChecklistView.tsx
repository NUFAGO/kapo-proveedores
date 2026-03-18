'use client';

import React from 'react';
import { Button } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { Edit, CheckCircle, XCircle, Tag, Calendar, Clock, FileText } from 'lucide-react';
import type { CategoriaChecklist } from '@/hooks/useCategoriaChecklist';

interface CategoriaChecklistViewProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: CategoriaChecklist | null;
  onEdit?: (categoria: CategoriaChecklist) => void;
}

export default function CategoriaChecklistView({
  isOpen,
  onClose,
  categoria,
  onEdit
}: CategoriaChecklistViewProps) {
  if (!categoria) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(categoria);
    }
    onClose();
  };

  const getEstadoColor = (estado: string) => {
    return estado === 'activo' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const getTipoUsoColor = (tipoUso: string) => {
    return tipoUso === 'pago' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
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
              {categoria.nombre || 'Categoría de Checklist'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded ${getTipoUsoColor(categoria.tipoUso)}`}>
                {categoria.tipoUso === 'pago' ? 'Pago' : 'Documentos OC'}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(categoria.estado)}`}>
                {categoria.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="custom"
            color="purple"
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
                  <div className="text-xs font-semibold truncate">{categoria.nombre || "-"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {categoria.descripcion || "Sin descripción"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Tipo de Uso</div>
                  <div className="text-xs text-muted-foreground truncate capitalize">
                    {categoria.tipoUso === 'pago' ? 'Pago' : 'Documentos OC'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Estado</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {categoria.estado === 'activo' ? 'Disponible para uso' : 'No disponible'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre</label>
                <div className="text-xs font-medium text-primary p-1 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {categoria.nombre || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tipo de Uso</label>
                <div className={`text-xs font-medium p-1 rounded capitalize ${getTipoUsoColor(categoria.tipoUso)}`}>
                  {categoria.tipoUso === 'pago' ? 'Pago' : 'Documentos OC'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Estado</label>
                <div className={`text-xs font-medium p-1 rounded ${getEstadoColor(categoria.estado)}`}>
                  {categoria.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Creado</label>
                <div className="text-xs font-medium text-text-secondary p-1 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {new Date(categoria.fechaCreacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración - solo para tipoUso = 'pago' */}
        {categoria.tipoUso === 'pago' && (
          <div className="space-y-2">
            <h3 className="font-bold text-xs">Configuración de Pagos</h3>
            <div className="p-2 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">M</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">Permite Múltiple</div>
                    <div className="text-xs text-muted-foreground">
                      {categoria.permiteMultiple ? 'Sí, permite múltiples solicitudes' : 'No, solo una solicitud'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">R</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">Vincular Reportes</div>
                    <div className="text-xs text-muted-foreground">
                      {categoria.permiteVincularReportes ? 'Sí, permite vincular reportes' : 'No, no permite vincular'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nota para tipoUso = 'documentos_oc' */}
        {categoria.tipoUso === 'documentos_oc' && (
          <div className="space-y-2">
            <h3 className="font-bold text-xs">Configuración de Documentos OC</h3>
            <div className="p-2 rounded-lg border border-border bg-green-50/50 dark:bg-green-900/20">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                  <FileText className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Esta categoría está configurada para checklists de documentos OC. 
                  No aplica configuración de múltiples solicitudes o vinculación de reportes.
                </div>
              </div>
            </div>
          </div>
        )}

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
                    {new Date(categoria.fechaCreacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {categoria.fechaActualizacion && (
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">UA</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">Última Actualización</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(categoria.fechaActualizacion).toLocaleDateString('es-ES', {
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
