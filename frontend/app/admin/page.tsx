'use client';

import { useEffect, useState } from 'react';
import { catalogApi, adminAuditApi } from '@/lib/api';
import { ErrorState, LoadingSpinner } from '@/components/ui-states';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ artworks: 0, artists: 0, categories: 0, auditEvents: 0 });

  useEffect(() => {
    Promise.all([
      catalogApi.listArtworks({ page: 1, limit: 1 }),
      catalogApi.listArtists(),
      catalogApi.listCategories(),
      adminAuditApi.listLogs({ limit: 20 }),
    ])
      .then(([artworks, artists, categories, logs]) => {
        setStats({
          artworks: artworks.meta.total,
          artists: artists.length,
          categories: categories.length,
          auditEvents: logs.meta.count,
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu tổng quan quản trị.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const cards = [
    { label: 'Tổng số tác phẩm', value: stats.artworks },
    { label: 'Số lượng họa sĩ', value: stats.artists },
    { label: 'Số lượng danh mục', value: stats.categories },
    { label: 'Sự kiện audit gần đây', value: stats.auditEvents },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 fade-in">
      {cards.map((card) => (
        <div key={card.label} className="bg-card border border-border p-6 hover-lift">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{card.label}</p>
          <p className="text-3xl font-serif text-foreground">{card.value.toLocaleString('vi-VN')}</p>
        </div>
      ))}
    </div>
  );
}
