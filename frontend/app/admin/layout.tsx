import type { ReactNode } from 'react';
import { AdminGuard } from '@/components/admin-guard';
import { AdminNav } from '@/components/admin-nav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 flex flex-col gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">Quản trị</p>
          <h1 className="text-4xl font-serif font-medium text-foreground">Bảng điều khiển quản trị</h1>
        </div>
        <AdminNav />
        {children}
      </div>
    </AdminGuard>
  );
}
