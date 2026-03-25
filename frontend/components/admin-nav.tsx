'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/catalog', label: 'Quản lý catalog' },
  { href: '/admin/inventory', label: 'Điều chỉnh tồn kho' },
  { href: '/admin/audit-logs', label: 'Nhật ký hệ thống' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border border-border p-2 flex flex-wrap gap-2">
      {ADMIN_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
