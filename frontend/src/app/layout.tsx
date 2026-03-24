import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Manrope, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';

const bodyFont = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
});

const headingFont = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'Dam Market',
  description: 'Distributed Art Marketplace storefront',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
