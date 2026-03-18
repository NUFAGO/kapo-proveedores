import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/providers/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kapo Proveedores',
  description: 'Sistema completo para la gestión de proveedores',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}