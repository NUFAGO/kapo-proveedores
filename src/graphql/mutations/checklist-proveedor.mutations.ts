/**
 * Checklist proveedor — mutación batch (solicitud / documentos / aprobación)
 */

export const PROCESAR_CHECKLIST_PROVEEDOR_MUTATION = `
  mutation ProcesarChecklistProveedor($input: ChecklistProveedorBatchInput!) {
    procesarChecklistProveedor(input: $input) {
      solicitudPagoId
      documentoOCId
      documentosSubidosIds
      aprobacionId
    }
  }
`

export const PROCESAR_CHECKLIST_SUBSANACION_MUTATION = `
  mutation ProcesarChecklistSubsanacion($input: ChecklistProveedorSubsanacionInput!) {
    procesarChecklistSubsanacion(input: $input) {
      entidadId
      aprobacionId
      documentosSubidosIds
    }
  }
`
