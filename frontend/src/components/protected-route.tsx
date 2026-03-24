'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { LoadingBlock } from './ui-states';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.session) {
      const nextPath = encodeURIComponent(pathname || '/');
      router.replace(`/auth/login?next=${nextPath}`);
    }
  }, [auth.isReady, auth.session, pathname, router]);

  if (!auth.isReady || !auth.session) {
    return <LoadingBlock label="Đang xác thực phiên đăng nhập" />;
  }

  return <>{children}</>;
}
