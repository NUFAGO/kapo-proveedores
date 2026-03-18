'use client';

import React from 'react';
import { Button } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { Edit, CheckCircle, XCircle, Tag, Calendar, Clock, FileText, Users, AlertCircle, Layers, FolderOpen, Star } from 'lucide-react';
import type { PlantillaChecklist } from '@/hooks/usePlantillaChecklist';

interface PlantillaChecklistViewProps {
  isOpen: boolean;
  onClose: () => void;
  plantilla: PlantillaChecklist | null;
  onEdit?: (plantilla: PlantillaChecklist) => void;
}

export default function PlantillaChecklistView({
  isOpen,
  onClose,
  plantilla,
  onEdit
}: PlantillaChecklistViewProps) {
  if (!plantilla) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(plantilla);
    }
    onClose();
  };

  const getEstadoColor = (estado: boolean) => {
    return estado 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const getCategoriaIcon = (tipoUso: string) => {
    if (tipoUso === 'pago') return <Layers className="w-5 h-5" />;
    if (tipoUso === 'documentos_oc') return <FileText className="w-5 h-5" />;
    return <FolderOpen className="w-5 h-5" />;
  };

  const getCategoriaColor = (tipoUso: string) => {
    if (tipoUso === 'pago') return 'text-blue-600 dark:text-blue-400';
    if (tipoUso === 'documentos_oc') return 'text-green-600 dark:text-green-400';
    return 'text-purple-600 dark:text-purple-400';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${
            plantilla.categoria?.tipoUso === 'pago' 
              ? 'from-blue-500 to-blue-600' 
              : plantilla.categoria?.tipoUso === 'documentos_oc'
              ? 'from-green-500 to-green-600'
              : 'from-purple-500 to-purple-600'
          } flex items-center justify-center text-white`}>
            {getCategoriaIcon(plantilla.categoria?.tipoUso || '')}
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary">
              {plantilla.nombre || 'Plantilla de Checklist'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                v{plantilla.version}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(plantilla.activo)}`}>
                {plantilla.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      }
      size="xl"
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
      <div className="space-y-6">
        {/* Información Principal */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Información Principal
          </h3>
          <div className="p-4 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${
                  plantilla.categoria?.tipoUso === 'pago' 
                    ? 'from-blue-500 to-blue-600' 
                    : plantilla.categoria?.tipoUso === 'documentos_oc'
                    ? 'from-green-500 to-green-600'
                    : 'from-purple-500 to-purple-600'
                } flex items-center justify-center text-white`}>
                  {getCategoriaIcon(plantilla.categoria?.tipoUso || '')}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{plantilla.nombre || "-"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {plantilla.descripcion || "Sin descripción"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${
                  plantilla.categoria?.tipoUso === 'pago' 
                    ? 'from-blue-500 to-blue-600' 
                    : plantilla.categoria?.tipoUso === 'documentos_oc'
                    ? 'from-green-500 to-green-600'
                    : 'from-purple-500 to-purple-600'
                } flex items-center justify-center text-white`}>
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Categoría</div>
                  <div className={`text-xs text-muted-foreground truncate flex items-center gap-1`}>
                    {getCategoriaIcon(plantilla.categoria?.tipoUso || '')}
                    <span className={getCategoriaColor(plantilla.categoria?.tipoUso || '')}>
                      {plantilla.categoria?.nombre || 'Sin categoría'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white">
                  <Star className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Versión</div>
                  <div className="text-xs text-muted-foreground truncate">
                    v{plantilla.version}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                  plantilla.activo 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
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
        <div className="space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Datos Clave
          </h3>
          <div className="p-4 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">ID</label>
                <div className="text-xs font-medium text-primary p-2 bg-gray-100/60 dark:bg-[black]/10 rounded font-mono">
                  {plantilla.id}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Categoría</label>
                <div className={`text-xs font-medium p-2 rounded capitalize ${getCategoriaColor(plantilla.categoria?.tipoUso || '')} bg-gray-100/60 dark:bg-[black]/10`}>
                  {plantilla.categoria?.nombre || 'Sin categoría'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tipo de Uso</label>
                <div className={`text-xs font-medium p-2 rounded capitalize flex items-center gap-1 ${
                  plantilla.categoria?.tipoUso === 'pago' 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/20' 
                    : 'text-green-600 dark:text-green-400 bg-green-100/60 dark:bg-green-900/20'
                }`}>
                  {getCategoriaIcon(plantilla.categoria?.tipoUso || '')}
                  {plantilla.categoria?.tipoUso === 'pago' ? 'Pago' : plantilla.categoria?.tipoUso === 'documentos_oc' ? 'Documentos OC' : 'Sin definir'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Estado</label>
                <div className={`text-xs font-medium p-2 rounded ${getEstadoColor(plantilla.activo)}`}>
                  {plantilla.activo ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requisitos de Documentos */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Requisitos de Documentos
          </h3>
          <div className="p-4 rounded-lg border border-border">
            {plantilla.requisitos && plantilla.requisitos.length > 0 ? (
              <div className="space-y-3">
                {plantilla.requisitos.map((requisito, index) => (
                  <div key={requisito.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        requisito.obligatorio 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        <span className="text-xs font-bold">
                          {requisito.obligatorio ? '!' : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary">
                          {requisito.plantillaDocumento?.tipoDocumento?.nombre || requisito.formulario?.nombre || 'Requisito'}
                        </span>
                        {requisito.obligatorio && (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {requisito.tipoRequisito === 'documento' ? 'Documento' : 'Formulario'} 
                        {requisito.plantillaDocumento?.formatosPermitidos && ` • Formatos: ${requisito.plantillaDocumento.formatosPermitidos}`}
                        {requisito.orden && ` • Orden: ${requisito.orden}`}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Sin requisitos asignados
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Esta plantilla no tiene documentos requeridos asignados.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Estadísticas
          </h3>
          <div className="p-4 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {plantilla.requisitos?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total de Requisitos
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {plantilla.requisitos?.filter(r => r.obligatorio).length || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Requisitos Obligatorios
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {plantilla.requisitos?.filter(r => !r.obligatorio).length || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Requisitos Opcionales
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fechas del Registro */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Registro de Fechas
          </h3>
          <div className="p-4 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <Calendar className="w-4 h-4" />
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
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white">
                    <Clock className="w-4 h-4" />
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
