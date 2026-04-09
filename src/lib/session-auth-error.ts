/**
 * Errores GraphQL del backend por JWT inválido / expirado / faltante.
 * No usar solo la palabra "inválido" (hay errores de negocio con ese texto).
 */
const SESSION_AUTH_SUBSTRINGS = [
  'Token inválido',
  'Token expirado',
  'AUTENTICACION_REQUERIDA',
  'Token de autenticación requerido',
] as const;

export const SESSION_AUTH_REQUIRED_EVENT = 'kapo:session-auth-required';

export type SessionAuthRequiredDetail = {
  /** Ruta + query para ?redirect= tras volver a iniciar sesión */
  returnUrl: string;
  /** Área desde la que se envió el token que falló */
  area: 'proveedor' | 'admin';
};

export function isSessionAuthMessage(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  const normalized = message.normalize('NFC');
  return SESSION_AUTH_SUBSTRINGS.some((s) => normalized.includes(s));
}

export function isSessionAuthGraphQLError(err: {
  message?: string;
  extensions?: { code?: string };
}): boolean {
  const code = err.extensions?.code;
  if (code === 'UNAUTHENTICATED') return true;
  const msg = err.message ?? '';
  return isSessionAuthMessage(msg);
}

export function dispatchSessionAuthRequired(detail: SessionAuthRequiredDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_AUTH_REQUIRED_EVENT, { detail }));
}
