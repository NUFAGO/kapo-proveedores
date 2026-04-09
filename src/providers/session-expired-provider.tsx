'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { SESSION_AUTH_REQUIRED_EVENT, type SessionAuthRequiredDetail } from '@/lib/session-auth-error';
import { useAuth } from '@/context/auth-context';
import { useAuthProveedor } from '@/context/auth-proveedor-context';

/**
 * Escucha errores GraphQL de token inválido/expirado (vía `graphqlRequest`)
 * y muestra un modal obligatorio; al confirmar limpia sesión y redirige al login correcto.
 */
export function SessionExpiredProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout: logoutAdmin } = useAuth();
  const { logout: logoutProveedor } = useAuthProveedor();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<SessionAuthRequiredDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<SessionAuthRequiredDetail>;
      if (!ce.detail) return;
      setDetail(ce.detail);
      setOpen(true);
    };
    window.addEventListener(SESSION_AUTH_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_AUTH_REQUIRED_EVENT, handler);
  }, []);

  const handleGoLogin = useCallback(() => {
    if (!detail) return;
    const redirect = encodeURIComponent(detail.returnUrl || '/');
    if (detail.area === 'proveedor') {
      logoutProveedor({ skipRedirect: true });
      router.push(`/proveedor/login?redirect=${redirect}`);
    } else {
      logoutAdmin();
      router.push(`/login?redirect=${redirect}`);
    }
    setOpen(false);
    setDetail(null);
  }, [detail, logoutAdmin, logoutProveedor, router]);

  return (
    <>
      {children}
      <Modal
        isOpen={open}
        onClose={() => undefined}
        title="Sesión finalizada"
        size="sm"
        showCloseButton={false}
        closeOnClickOutside={false}
        closeOnEsc={false}
        footer={
          <div className="flex justify-end px-4 pb-2">
            <Button type="button" variant="custom" color="blue" size="sm" onClick={handleGoLogin}>
              Iniciar sesión de nuevo
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary leading-relaxed">
          Tu sesión expiró. Inicia sesión de nuevo para continuar.
        </p>
      </Modal>
    </>
  );
}
