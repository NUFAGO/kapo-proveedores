import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Constantes inlineadas para evitar problemas de import en middleware
const AUTH_COOKIE_NAME = 'auth_token';
const AUTH_PROVEEDOR_COOKIE_NAME = 'auth_proveedor_token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtener cookies
  const adminToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const proveedorToken = request.cookies.get(AUTH_PROVEEDOR_COOKIE_NAME)?.value;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/login', '/proveedor/login', '/favicon.ico', '/globals.css'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/_next/'));

  // Rutas de login
  const adminLoginPath = '/login';
  const proveedorLoginPath = '/proveedor/login';

  // Verificar si es ruta de admin (interno)
  const isAdminRoute = pathname.startsWith('/dashboard') ||
                       (pathname.startsWith('/admin') && !pathname.startsWith('/proveedor'));

  // Verificar si es ruta de proveedor
  const isProveedorRoute = pathname.startsWith('/proveedor/');

  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Protección para rutas de admin
  if (isAdminRoute) {
    if (!adminToken) {
      // No hay token de admin, redirigir a login de admin
      const loginUrl = new URL(adminLoginPath, request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Si hay token de admin y está en ruta correcta, permitir
    return NextResponse.next();
  }

  // Protección para rutas de proveedor
  if (isProveedorRoute) {
    if (!proveedorToken) {
      // No hay token de proveedor, redirigir a login de proveedor
      const loginUrl = new URL(proveedorLoginPath, request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Si hay token de proveedor y está en ruta correcta, permitir
    return NextResponse.next();
  }

  // Si hay token de admin pero está intentando acceder a rutas de proveedor
  if (adminToken && isProveedorRoute) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Si hay token de proveedor pero está intentando acceder a rutas de admin
  if (proveedorToken && isAdminRoute) {
    const dashboardUrl = new URL('/proveedor/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Por defecto, permitir acceso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
