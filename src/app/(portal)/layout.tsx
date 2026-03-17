import { MainLayout } from '@/components/layout/main';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout tipo="proveedor">{children}</MainLayout>;
}
