'use client';

import { Button } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { FileText, Edit, CheckCircle, XCircle, Link as LinkIcon, Tag, FileCheck } from 'lucide-react';
import type { PlantillaDocumento } from '@/hooks/usePlantillaDocumento';

interface PlantillaDocumentoViewProps {
  isOpen: boolean;
  onClose: () => void;
  plantilla: PlantillaDocumento | null;
  onEdit: (plantilla: PlantillaDocumento) => void;
}

export default function PlantillaDocumentoView({ isOpen, onClose, plantilla, onEdit }: PlantillaDocumentoViewProps) {
  if (!plantilla) return null;

  const handleEdit = () => {
    onEdit(plantilla);
    onClose();
  };

  const getEstadoColor = (activo: boolean) => {
    return activo 
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
              {plantilla.nombrePlantilla || 'Plantilla de Documento'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Código: {plantilla.codigo}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(plantilla.activo)}`}>
                {plantilla.activo ? 'Activa' : 'Inactiva'}
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
                  <div className="text-xs font-semibold truncate">{plantilla.nombrePlantilla || "-"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {plantilla.tipoDocumento?.nombre || plantilla.tipoDocumentoId || "-"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Archivo</div>
                  <div className="text-xs text-muted-foreground truncate">
                    <a 
                      href={plantilla.plantillaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline inline-flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Ver archivo
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 border border-border rounded">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Estado</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {plantilla.activo ? 'Disponible para uso' : 'No disponible'}
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
                  {plantilla.codigo || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tipo Documento</label>
                <div className="text-xs font-medium text-primary p-1 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {plantilla.tipoDocumento?.nombre || plantilla.tipoDocumentoId || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Estado</label>
                <div className={`text-xs font-medium p-1 rounded ${getEstadoColor(plantilla.activo)}`}>
                  {plantilla.activo ? 'Activa' : 'Inactiva'}
                </div>
              </div>
              
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
                    {new Date(plantilla.fechaCreacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {plantilla.fechaActualizacion && (
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">UA</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">Última Actualización</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(plantilla.fechaActualizacion).toLocaleDateString('es-ES', {
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
