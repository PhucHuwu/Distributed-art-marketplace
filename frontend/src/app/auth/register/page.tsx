'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/components/auth-provider';
import { getFirstError, loginSchema } from '@/lib/validation';

export default function RegisterPage() {
  const auth = useAuth();
  const router = useRouter();
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
      await auth.register(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <section className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <h1 style={{ marginBottom: 8 }}>Đăng ký tài khoản</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Tao tai khoan de quan ly don hang va thong tin giao nhan.
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Toi thieu 8 ky tu"
            />
          </label>

          {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="muted" style={{ marginBottom: 0 }}>
          Đã có tài khoản? <Link href="/auth/login">Đăng nhập</Link>
        </p>
      </section>
    </PageShell>
  );
}
