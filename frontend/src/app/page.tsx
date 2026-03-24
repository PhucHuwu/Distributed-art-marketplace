'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { EmptyState, ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { listArtworks, listArtists, listCategories } from '@/lib/api/catalog-api';
import { formatCurrency } from '@/lib/format';
import { CatalogArtwork, CatalogArtist, CatalogCategory } from '@/types/catalog';

type QueryState = {
  q: string;
  artist: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  page: number;
};

const defaultQuery: QueryState = {
  q: '',
  artist: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  page: 1,
};

export default function HomePage() {
  const [query, setQuery] = useState<QueryState>(defaultQuery);
  const [items, setItems] = useState<CatalogArtwork[]>([]);
  const [artists, setArtists] = useState<CatalogArtist[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([listArtists(), listCategories()])
      .then(([nextArtists, nextCategories]) => {
        if (!mounted) {
          return;
        }
        setArtists(nextArtists);
        setCategories(nextCategories);
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listArtworks({
        page: query.page,
        limit: 12,
        q: query.q || undefined,
        artist: query.artist || undefined,
        category: query.category || undefined,
        minPrice: query.minPrice ? Number(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      });
      setItems(res.data);
      setMeta(
        res.meta
          ? {
              page: res.meta.page,
              totalPages: res.meta.totalPages,
            }
          : null,
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const canPrev = useMemo(() => (meta ? meta.page > 1 : query.page > 1), [meta, query.page]);
  const canNext = useMemo(
    () => (meta ? meta.page < meta.totalPages : items.length >= 12),
    [meta, items.length],
  );

  return (
    <PageShell>
      <section className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h1 style={{ marginBottom: 6 }}>Bộ sưu tập tranh Việt Nam</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 14 }}>
          Khám phá tác phẩm theo chủ đề, tác giả và khoảng giá phù hợp.
        </p>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label className="field">
            Tìm kiếm
            <input
              value={query.q}
              onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
              placeholder="Nhập tên tranh, tác giả"
            />
          </label>

          <label className="field">
            Tác giả
            <select
              value={query.artist}
              onChange={(e) => setQuery((prev) => ({ ...prev, artist: e.target.value, page: 1 }))}
            >
              <option value="">Tất cả</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Danh mục
            <select
              value={query.category}
              onChange={(e) => setQuery((prev) => ({ ...prev, category: e.target.value, page: 1 }))}
            >
              <option value="">Tất cả</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Giá từ
            <input
              type="number"
              min={0}
              value={query.minPrice}
              onChange={(e) => setQuery((prev) => ({ ...prev, minPrice: e.target.value, page: 1 }))}
              placeholder="0"
            />
          </label>

          <label className="field">
            Giá đến
            <input
              type="number"
              min={0}
              value={query.maxPrice}
              onChange={(e) => setQuery((prev) => ({ ...prev, maxPrice: e.target.value, page: 1 }))}
              placeholder="10000000"
            />
          </label>
        </div>
      </section>

      {loading ? <LoadingBlock label="Đang tải danh sách tác phẩm" /> : null}
      {!loading && error ? <ErrorNotice error={error} onRetry={() => void fetchCatalog()} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tác phẩm"
          description="Thử đổi bộ lọc hoặc tìm kiếm từ khóa khác để xem thêm kết quả."
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {items.map((item) => {
            const cover = item.images[0]?.url || 'https://picsum.photos/600/400?grayscale';
            return (
              <article key={item.id} className="card" style={{ overflow: 'hidden' }}>
                <Image
                  src={cover}
                  alt={item.images[0]?.altText || item.title}
                  width={600}
                  height={400}
                  style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
                <div style={{ padding: 14 }}>
                  <h3 style={{ fontSize: 22 }}>{item.title}</h3>
                  <p className="muted" style={{ marginTop: 6, marginBottom: 6 }}>
                    {item.artist.name}
                  </p>
                  <p style={{ fontWeight: 700, marginTop: 0 }}>{formatCurrency(item.price, item.currency)}</p>
                  <Link className="btn btn-primary" href={`/artworks/${item.slug}`}>
                    Xem chi tiết
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {!loading && !error ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
          <button
            className="btn btn-ghost"
            disabled={!canPrev}
            onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
          >
            Trang trước
          </button>
          <button
            className="btn btn-ghost"
            disabled={!canNext}
            onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Trang sau
          </button>
        </div>
      ) : null}
    </PageShell>
  );
}
