'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { Edit, CheckCircle, XCircle, Building, MapPin, Phone, Mail, Calendar, Clock, FileText, Key, Users, Loader2 } from 'lucide-react';
import type { Proveedor } from '@/hooks/useProveedor';
import { useGenerarCodigos, useCodigosAcceso, type CodigosGenerados } from '@/hooks/useCodigoAcceso';

interface ProveedorViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor: Proveedor | null;
  onEdit?: (proveedor: Proveedor) => void;
}

export default function ProveedorViewModal({
  isOpen,
  onClose,
  proveedor,
  onEdit
}: ProveedorViewModalProps) {
  const [codigosGenerados, setCodigosGenerados] = useState<CodigosGenerados | null>(null);
  
  const generarCodigosMutation = useGenerarCodigos();
  
  // Función helper para formatear fechas
  const formatearFecha = (fecha: Date | string | number) => {
    try {
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES');
      }
      
      // Si es un timestamp numérico (como string o number)
      const timestamp = typeof fecha === 'string' ? parseInt(fecha, 10) : fecha;
      if (!isNaN(timestamp) && timestamp > 1000000000000) { // Validar que sea un timestamp razonable
        const fechaDesdeTimestamp = new Date(timestamp);
        if (!isNaN(fechaDesdeTimestamp.getTime())) {
          return fechaDesdeTimestamp.toLocaleDateString('es-ES');
        }
      }
      
      // Si es un string ISO
      const fechaParseada = new Date(fecha);
      if (!isNaN(fechaParseada.getTime())) {
        return fechaParseada.toLocaleDateString('es-ES');
      }
      
      return 'Fecha inválida';
    } catch (error) {
      console.error('Error formateando fecha:', error, fecha);
      return 'Fecha inválida';
    }
  };
  
  // Cargar códigos existentes del proveedor
  const { data: codigosExistentes, isLoading: cargandoCodigos } = useCodigosAcceso({
    proveedorId: proveedor?.id,
    activo: true,
    limit: 50 // Aumentado para mostrar más códigos
  });

  // Debug: mostrar datos en consola
  console.log('Códigos existentes:', codigosExistentes);

  if (!proveedor) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(proveedor);
    }
    onClose();
  };

  const handleGenerarCodigos = async () => {
    try {
      const codigos = await generarCodigosMutation.mutateAsync({
        proveedorId: proveedor.id,
        proveedorRuc: proveedor.ruc,
        proveedorNombre: proveedor.razon_social,
        creadoPor: 'admin', // TODO: Obtener ID del usuario actual
        diasValidez: 30
      });
      
      setCodigosGenerados(codigos);
    } catch (error) {
      console.error('Error al generar códigos:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'inactivo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'suspendido':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  // Generar códigos de ejemplo para creación de cuentas
  const generarCodigosCuenta = () => {
    const ruc = proveedor.ruc.replace(/\D/g, '').slice(0, 8);
    const fechaActual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return {
      codigoProveedor: `PROV-${ruc}-${aleatorio}`,
      codigoAcceso: `ACC-${fechaActual}-${ruc}`,
      codigoVerificacion: `VER-${aleatorio}-${ruc.slice(-4)}`
    };
  };

  const codigos = generarCodigosCuenta();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-primary" />
          <div>
            <span className="text-sm font-semibold text-text-primary">
              {proveedor.razon_social || 'Proveedor'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                RUC: {proveedor.ruc}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${getEstadoColor(proveedor.estado)}`}>
                {proveedor.estado === 'activo' ? 'Activo' : proveedor.estado === 'inactivo' ? 'Inactivo' : 'Suspendido'}
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
      size="lg"
    >
      <div className="space-y-4">
        {/* Información Principal */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs">Información Principal</h3>
          <div className="p-3 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 border border-border rounded">
                <Building className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{proveedor.razon_social || "-"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {proveedor.nombre_comercial || 'Sin nombre comercial'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border border-border rounded">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">RUC</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {proveedor.ruc}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border border-border rounded">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Estado</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {proveedor.estado === 'activo' ? 'Disponible para uso' : 
                     proveedor.estado === 'inactivo' ? 'No disponible' : 'Suspendido'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datos de Contacto y Ubicación */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs">Contacto y Ubicación</h3>
          <div className="p-3 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 border border-border rounded">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Teléfono</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {proveedor.telefono || 'No registrado'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border border-border rounded">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Email</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {proveedor.correo || 'No registrado'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border border-border rounded md:col-span-2">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">Ubicación</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[proveedor.departamento, proveedor.provincia, proveedor.distrito]
                      .filter(Boolean)
                      .join(', ') || 'No especificada'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Códigos de Creación de Cuentas */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Códigos de Creación de Cuentas
          </h3>
          <div className="p-4 rounded-lg border border-border bg-linear-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
            {/* Mostrar códigos existentes */}
            {cargandoCodigos ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">
                  Cargando códigos existentes...
                </p>
              </div>
            ) : codigosExistentes?.codigos && codigosExistentes.codigos.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-text-primary mb-2">
                  Códigos Activos ({codigosExistentes.codigos.length})
                </div>
                <div className="space-y-2">
                  {codigosExistentes.codigos.map((codigo) => (
                    <div key={codigo.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            codigo.usado ? 'bg-gray-400' : 'bg-green-500'
                          }`} />
                          <span className="text-xs font-mono text-primary">
                            {codigo.codigo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({codigo.tipo})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {codigo.usado ? 'Usado' : 'Activo'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Creado: {formatearFecha(codigo.fechaGeneracion)} • 
                        Expira: {formatearFecha(codigo.fechaExpiracion)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  No hay códigos activos para este proveedor
                </p>
              </div>
            )}
            
            {/* Separador */}
            <div className="border-t border-border/50 my-3" />
            
            {/* Generar nuevos códigos */}
            {!codigosGenerados ? (
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  Genera nuevos códigos de acceso para este proveedor
                </p>
                <Button
                  variant="custom"
                  color="blue"
                  size="sm"
                  onClick={handleGenerarCodigos}
                  disabled={generarCodigosMutation.isPending}
                  className="text-xs"
                >
                  {generarCodigosMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-1" />
                      Generar Nuevos Códigos
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-text-primary mb-2">
                  Nuevos Códigos Generados
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-xs font-semibold text-text-primary mb-1">Código Proveedor</div>
                    <div className="text-xs font-mono text-primary bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                      {codigosGenerados.codigoProveedor}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Para identificación interna</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                      <Key className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-xs font-semibold text-text-primary mb-1">Código Acceso</div>
                    <div className="text-xs font-mono text-primary bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                      {codigosGenerados.codigoAcceso}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Para primer acceso</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-xs font-semibold text-text-primary mb-1">Código Verificación</div>
                    <div className="text-xs font-mono text-primary bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded">
                      {codigosGenerados.codigoVerificacion}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Para verificación</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">
                    Válido hasta: {new Date(codigosGenerados.codigoBD.fechaExpiracion).toLocaleDateString('es-ES')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${codigosGenerados.codigoProveedor}\n${codigosGenerados.codigoAcceso}\n${codigosGenerados.codigoVerificacion}`
                        );
                      }}
                    >
                      Copiar todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setCodigosGenerados(null)}
                    >
                      Ocultar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs">Información Adicional</h3>
          <div className="p-3 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Tipo</label>
                <div className="text-xs font-medium text-primary p-2 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {proveedor.tipo === 'persona_natural' ? 'Persona Natural' : 
                   proveedor.tipo === 'persona_juridica' ? 'Persona Jurídica' : 'No especificado'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Rubro</label>
                <div className="text-xs font-medium text-primary p-2 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {proveedor.rubro || 'No especificado'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Subcontratación</label>
                <div className={`text-xs font-medium p-2 rounded ${
                  proveedor.sub_contrata 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                }`}>
                  {proveedor.sub_contrata ? 'Acepta subcontratación' : 'No acepta subcontratación'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Registro</label>
                <div className="text-xs font-medium text-primary p-2 bg-gray-100/60 dark:bg-[black]/10 rounded">
                  {new Date().toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
