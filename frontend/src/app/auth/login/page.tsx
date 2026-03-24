'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/components/auth-provider';
import { getFirstError, loginSchema } from '@/lib/validation';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = useMemo(() => params.get('next') || '/', [params]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(getFirstError(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await auth.login(email, password);
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <section className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <h1 style={{ marginBottom: 8 }}>Đăng nhập</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Su dung tai khoan de tiep tuc mua tranh.
        </p>

        <form className="grid" onSubmit={onSubmit}>
          <label className="field">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="field">
            Mật khẩu
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
            />
          </label>

          {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="muted" style={{ marginBottom: 0 }}>
          Chưa có tài khoản? <Link href="/auth/register">Đăng ký ngay</Link>
        </p>
      </section>
    </PageShell>
  );
}
