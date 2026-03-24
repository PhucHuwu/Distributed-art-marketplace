'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';

export function SiteHeader() {
  const auth = useAuth();

  return (
    <header className="card" style={{ marginBottom: 18, padding: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Link href="/" style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700 }}>
            Dam Market
          </Link>
          <p className="muted" style={{ margin: 0 }}>
            Sàn tranh nghệ thuật Việt Nam
          </p>
        </div>

        <nav style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/">Tác phẩm</Link>
          <Link href="/cart">Giỏ hàng</Link>
          <Link href="/orders/me">Đơn hàng</Link>
          <Link href="/profile">Tài khoản</Link>
          {!auth.session ? (
            <>
              <Link href="/auth/login">Đăng nhập</Link>
              <Link href="/auth/register">Đăng ký</Link>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={auth.logout}>
              Đăng xuất
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
