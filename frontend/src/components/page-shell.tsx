import { SiteHeader } from './site-header';
import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <SiteHeader />
      {children}
    </main>
  );
}
