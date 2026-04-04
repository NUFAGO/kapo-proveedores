'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, FileText, Save, Trash2, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import ModalChecklistSelector from './components/modalChecklistSelector'
import { useGuardarExpedienteConItems, useExpedientePorCodigo, useExpedienteCompleto } from '@/hooks/useExpedientePago'
import { useOrdenesCompra } from '@/hooks'
import toast from 'react-hot-toast'

// Tipos para los items agregados
interface ExpedienteItem {
  id: string
  tipo: 'solicitud-pago' | 'documento-oc'
  ordenCompraId: string
  categoriaChecklistId: string
  plantillaChecklistId: string
  categoria?: {
    id: string
    nombre: string
    tipoUso: string
  }
  plantilla?: {
    id: string
    codigo: string
    nombre: string
    descripcion?: string
  }
  timestamp: string
}

export default function ExpedientePage() {
  const params = useParams()
  const codigo = params.codigo as string
  
  // Estados para los modales
  const [showModalSolicitud, setShowModalSolicitud] = useState(false)
  const [showModalDocumento, setShowModalDocumento] = useState(false)
  
  // Estado global temporal para los items agregados
  const [itemsAgregados, setItemsAgregados] = useState<ExpedienteItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Hook para guardar expediente
  const guardarExpedienteMutation = useGuardarExpedienteConItems()

  // Hook para verificar si ya existe un expediente (usando codigo)
  const { data: expedienteExistente, isLoading: loadingExpediente } = useExpedientePorCodigo(codigo)

  // Determinar si estamos en modo edicion
  const isEditMode = !!expedienteExistente && !loadingExpediente
  const expedienteId = expedienteExistente?.id

  // Hook para obtener expediente completo con relaciones (solo en modo edicion)
  const { data: expedienteCompletoData } = useExpedienteCompleto(
    isEditMode && expedienteId ? expedienteId : ''
  )
  const expedienteCompleto = (expedienteCompletoData as any)?.obtenerExpedienteCompleto

  // Items existentes del backend
  const tiposPagoExistentes = expedienteCompleto?.tiposPago || []
  const documentosExistentes = expedienteCompleto?.documentos || []

  // Obtener datos de la OC usando el hook de ordenes de compra
  const { ordenesCompra } = useOrdenesCompra({ 
    page: 1, 
    limit: 1,
    searchTerm: codigo 
  })

  // Encontrar la OC especifica por codigo
  const ocData = ordenesCompra?.data?.find(oc => oc.codigo_orden === codigo)

  const handleSuccess = (nuevoItem: ExpedienteItem) => {
    // Agregar item al estado local
    setItemsAgregados(prev => [...prev, nuevoItem])
  }

  const handleEliminarItem = (itemId: string) => {
    setItemsAgregados(prev => prev.filter(item => item.id !== itemId))
  }

  const handleGuardarTodo = async () => {
    if (itemsAgregados.length === 0) {
      toast.error('No hay items para guardar')
      return
    }

    if (!ocData) {
      toast.error('No se encontraron los datos de la orden de compra')
      return
    }

    setIsSaving(true)
    
    try {
      // Separar solicitudes de pago y documentos OC
      const solicitudesPago = itemsAgregados
        .filter(item => item.tipo === 'solicitud-pago')
        .map(item => ({
          categoriaChecklistId: item.categoriaChecklistId,
          plantillaChecklistId: item.plantillaChecklistId
        }))

      const documentosOC = itemsAgregados
        .filter(item => item.tipo === 'documento-oc')
        .map(item => ({
          categoriaChecklistId: item.categoriaChecklistId,
          plantillaChecklistId: item.plantillaChecklistId
        }))

      // Preparar datos de la OC para el backend
      const ocDataForBackend = {
        id: ocData.id,
        codigo: ocData.codigo_orden,
        proveedorId: ocData.proveedor_id || 'sin-proveedor',
        proveedorNombre: ocData.proveedor?.nombre_comercial || 'N/A',
        montoContrato: ocData.total || 0,
        fechaInicioContrato: ocData.fecha_ini || '',
        fechaFinContrato: ocData.fecha_fin || '',
        descripcion: ocData.descripcion || ''
      }

      // Ejecutar la mutación con el hook
      await guardarExpedienteMutation.mutateAsync({
        ocData: ocDataForBackend,
        adminCreadorId: 'admin-temporal', // TODO: Obtener del contexto de autenticación
        solicitudesPago,
        documentosOC
      })

      toast.success('Expediente guardado exitosamente')
      // TODO: Redirigir a la página del expediente
      setItemsAgregados([]) // Limpiar items después de guardar
      
    } catch (error) {
      console.error('Error al guardar expediente:', error)
      toast.error('Error al guardar el expediente')
    } finally {
      setIsSaving(false)
    }
  }

  // Filtrar items nuevos por tipo
  const solicitudesPagoNuevas = itemsAgregados.filter(item => item.tipo === 'solicitud-pago')
  const documentosOCNuevos = itemsAgregados.filter(item => item.tipo === 'documento-oc')

  // Combinar existentes + nuevos en listas unificadas
  const todasSolicitudes = [
    ...tiposPagoExistentes.map((tp: any) => ({ ...tp, _origen: 'configurado' as const })),
    ...solicitudesPagoNuevas.map(item => ({ ...item, _origen: 'nuevo' as const }))
  ]
  const todosDocumentos = [
    ...documentosExistentes.map((doc: any) => ({ ...doc, _origen: 'configurado' as const })),
    ...documentosOCNuevos.map(item => ({ ...item, _origen: 'nuevo' as const }))
  ]

  // Total items nuevos
  const totalNuevos = itemsAgregados.length

  return (
    <div className="space-y-4">
      {/* Botón Volver - Movido arriba */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>

      {/* Header Principal con Todo Integrado */}
      <div className="bg-white dark:bg-gray-900/60 rounded-md p-6">
        {/* Parte superior: Titulo y botones */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Editar Expediente' : 'Expediente de Orden de Compra'}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Codigo: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{codigo}</span>
                </span>
                {isEditMode && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Expediente existente - Estado: {expedienteExistente?.estado || 'Activo'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => setShowModalSolicitud(true)}
              className="flex items-center gap-2"
              color='blue'
            >
              <Plus className="w-4 h-4" />
              Agregar Solicitud
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModalDocumento(true)}
              className="flex items-center gap-2"
              color='green'
            >
              <FileText className="w-4 h-4" />
              Agregar Documentos
            </Button>
          </div>
        </div>

        {/* Resumen - cuando hay items nuevos para guardar */}
        {totalNuevos > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Items nuevos por guardar</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Revisa antes de confirmar</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">{totalNuevos}</span> nuevos 
                    (<span className="font-semibold">{solicitudesPagoNuevas.length}</span> solicitudes, 
                    <span className="font-semibold"> {documentosOCNuevos.length}</span> documentos)
                  </span>
                </div>
              </div>
              {!isEditMode && (
                <Button
                  onClick={handleGuardarTodo}
                  disabled={isSaving}
                  size="sm"
                  color='blue'
                >
                  <Save className="w-3 h-3 mr-1" />
                  {isSaving ? 'Guardando...' : 'Guardar Expediente'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Listas unificadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitudes de Pago */}
        <div className="bg-white dark:bg-gray-900/60 rounded-md p-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Solicitudes de Pago
              </h2>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                {todasSolicitudes.length}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            {todasSolicitudes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-5 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  No hay solicitudes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-xs">
                  Agrega solicitudes de pago para construir tu expediente
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-100 overflow-y-auto px-2 pb-2">
                {todasSolicitudes.map((item: any) => (
                  <div key={item.id} className="group">
                    <div className="bg-white dark:bg-gray-900/10 rounded-md card-shadow-hover overflow-hidden">
                      <div className='h-1 bg-linear-to-r from-purple-500/30 to-blue-400/30 dark:from-purple-600/20 dark:to-blue-500/20' />
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                              <Plus className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                {item._origen === 'configurado' ? (item.checklist?.nombre || 'Sin nombre') : item.plantilla?.codigo}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                                {item._origen === 'configurado' ? (item.checklist?.codigo || '') : item.plantilla?.nombre}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item._origen === 'configurado' ? (
                              <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Configurado
                              </span>
                            ) : (
                              <>
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Nuevo
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-500 h-6 w-6 p-0"
                                  onClick={() => handleEliminarItem(item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            <span>{item._origen === 'configurado' ? (item.categoria?.nombre || 'N/A') : (item.categoria?.nombre || 'Sin categoria')}</span>
                          </div>
                          {item._origen === 'configurado' && item.modoRestriccion && (
                            <span>Modo: {item.modoRestriccion}</span>
                          )}
                          {item._origen === 'nuevo' && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documentos OC */}
        <div className="bg-white dark:bg-gray-900/60 rounded-md p-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                Documentos OC
              </h2>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                {todosDocumentos.length}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            {todosDocumentos.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  No hay documentos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-xs">
                  Agrega documentos OC para completar la documentacion requerida
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto px-2 pb-2">
                {todosDocumentos.map((item: any) => (
                  <div key={item.id} className="group">
                    <div className="bg-white dark:bg-gray-900/10 rounded-md card-shadow-hover overflow-hidden">
                      <div className='h-1 bg-linear-to-r from-green-500/30 to-emerald-400/30 dark:from-green-600/20 dark:to-emerald-500/20' />
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-r from-green-500 to-green-600 flex items-center justify-center text-white">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                {item._origen === 'configurado' ? (item.checklist?.nombre || 'Sin nombre') : item.plantilla?.codigo}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                                {item._origen === 'configurado' ? (item.checklist?.codigo || '') : item.plantilla?.nombre}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item._origen === 'configurado' ? (
                              <>
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Configurado
                                </span>
                                {item.obligatorio && (
                                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                                    Obligatorio
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Nuevo
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 h-6 w-6 p-0"
                                  onClick={() => handleEliminarItem(item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{item._origen === 'configurado' ? 'Documento OC' : (item.categoria?.nombre || 'Sin categoria')}</span>
                          </div>
                          {item._origen === 'nuevo' && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales - siempre para agregar nuevos */}
      <ModalChecklistSelector
        isOpen={showModalSolicitud}
        onClose={() => setShowModalSolicitud(false)}
        type="solicitud-pago"
        ordenCompraId={codigo}
        onSuccess={handleSuccess}
      />
      
      <ModalChecklistSelector
        isOpen={showModalDocumento}
        onClose={() => setShowModalDocumento(false)}
        type="documento-oc"
        ordenCompraId={codigo}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
