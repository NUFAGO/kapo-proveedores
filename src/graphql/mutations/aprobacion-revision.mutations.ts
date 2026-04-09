/** Cierre de revisión checklist desde kanban (admin). */
export const FINALIZAR_REVISION_CHECKLIST_APROBACION_MUTATION = `
  mutation FinalizarRevisionChecklistAprobacion($input: FinalizarRevisionChecklistAprobacionInput!) {
    finalizarRevisionChecklistAprobacion(input: $input) {
      id
      estado
      entidadTipo
      entidadId
    }
  }
`;
