import Cookies from 'js-cookie';
import { AUTH_COOKIE_NAME, AUTH_PROVEEDOR_COOKIE_NAME } from './constants';

/**
 * Utilidades para manejo de cookies del lado del cliente
 */

export function getCookie(name: string): string | undefined {
  return Cookies.get(name);
}

export function setCookie(name: string, value: string, days?: number): void {
  const options: Cookies.CookieAttributes = {
    path: '/',
    sameSite: 'lax',
  };

  if (days) {
    options.expires = days;
  }

  Cookies.set(name, value, options);
}

export function removeCookie(name: string): void {
  Cookies.remove(name, { path: '/' });
}

export function getAuthToken(cookieName: string = AUTH_COOKIE_NAME): string | undefined {
  return getCookie(cookieName);
}

export function setAuthToken(token: string, days: number = 30, cookieName: string = AUTH_COOKIE_NAME): void {
  setCookie(cookieName, token, days);
}

export function removeAuthToken(cookieName: string = AUTH_COOKIE_NAME): void {
  removeCookie(cookieName);
}

// Funciones específicas para admin (mantener compatibilidad)
export function getAdminAuthToken(): string | undefined {
  return getCookie(AUTH_COOKIE_NAME);
}

export function setAdminAuthToken(token: string, days: number = 30): void {
  setCookie(AUTH_COOKIE_NAME, token, days);
}

export function removeAdminAuthToken(): void {
  removeCookie(AUTH_COOKIE_NAME);
}

// Funciones específicas para proveedores
export function getProveedorAuthToken(): string | undefined {
  return getCookie(AUTH_PROVEEDOR_COOKIE_NAME);
}

export function setProveedorAuthToken(token: string, days: number = 30): void {
  setCookie(AUTH_PROVEEDOR_COOKIE_NAME, token, days);
}

export function removeProveedorAuthToken(): void {
  removeCookie(AUTH_PROVEEDOR_COOKIE_NAME);
}
