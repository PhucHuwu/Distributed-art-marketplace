'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <main className="page-shell">
      <section className="card" style={{ padding: 18 }}>
        <h1 style={{ marginBottom: 8 }}>Có lỗi xảy ra</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Hệ thống gặp lỗi không mong muốn. Vui lòng thử lại.
        </p>
        <button className="btn btn-primary" onClick={reset}>
          Thử tải trang
        </button>
      </section>
    </main>
  );
}
