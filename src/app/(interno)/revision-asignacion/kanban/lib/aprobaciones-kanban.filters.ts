/** Valores del select de tipo en cabecera → filtro GraphQL `EntidadTipoAprobacion`. */
export function tipoFiltroUiToEntidadGraphQL(
  tipoFiltro: string
): 'solicitud_pago' | 'documento_oc' | undefined {
  if (tipoFiltro === 'PAGO') return 'solicitud_pago';
  if (tipoFiltro === 'DOCUMENTO' || tipoFiltro === 'OC') return 'documento_oc';
  return undefined;
}
