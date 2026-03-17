import { MainLayout } from '@/components/layout/main';

export default function InternoLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout tipo="admin">{children}</MainLayout>;
}
