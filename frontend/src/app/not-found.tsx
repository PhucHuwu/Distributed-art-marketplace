import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <section className="card" style={{ padding: 18 }}>
        <h1 style={{ marginBottom: 8 }}>Không tìm thấy trang</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Duong dan khong ton tai hoac da duoc thay doi.
        </p>
        <Link className="btn btn-primary" href="/">
          Về trang chủ
        </Link>
      </section>
    </main>
  );
}
