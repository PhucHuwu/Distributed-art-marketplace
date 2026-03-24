'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { useAuth } from '@/components/auth-provider';
import { getArtwork } from '@/lib/api/catalog-api';
import { getInventory } from '@/lib/api/inventory-api';
import { addCartItem } from '@/lib/api/order-api';
import { formatCurrency } from '@/lib/format';
import { CatalogArtwork } from '@/types/catalog';
import { InventoryInfo } from '@/types/inventory';

export default function ArtworkDetailPage() {
  const params = useParams<{ idOrSlug: string }>();
  const router = useRouter();
  const auth = useAuth();
  const [artwork, setArtwork] = useState<CatalogArtwork | null>(null);
  const [inventory, setInventory] = useState<InventoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const idOrSlug = useMemo(() => String(params.idOrSlug || ''), [params.idOrSlug]);

  const fetchData = useCallback(async () => {
    if (!idOrSlug) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextArtwork = await getArtwork(idOrSlug);
      setArtwork(nextArtwork);
      const stock = await getInventory(nextArtwork.id).catch(() => null);
      setInventory(stock);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleAddToCart() {
    if (!artwork) {
      return;
    }
    if (!auth.session) {
      router.push(`/auth/login?next=${encodeURIComponent(`/artworks/${idOrSlug}`)}`);
      return;
    }

    setAdding(true);
    setMessage('');
    try {
      await addCartItem(auth.session.token, {
        artworkId: artwork.id,
        quantity: 1,
        unitPrice: artwork.price,
      });
      setMessage('Đã thêm vào giỏ hàng');
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage('Không thể thêm vào giỏ hàng');
      }
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <LoadingBlock label="Đang tải chi tiết tác phẩm" />
      </PageShell>
    );
  }

  if (error || !artwork) {
    return (
      <PageShell>
        <ErrorNotice error={error || new Error('Artwork not found')} onRetry={() => void fetchData()} />
      </PageShell>
    );
  }

  const cover = artwork.images[0]?.url || 'https://picsum.photos/960/640';
  const availableQty = inventory?.availableQty;
  const canBuy = typeof availableQty === 'number' ? availableQty > 0 : true;

  return (
    <PageShell>
      <article className="card" style={{ padding: 16 }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          <div>
            <Image
              src={cover}
              alt={artwork.images[0]?.altText || artwork.title}
              width={960}
              height={640}
              style={{ width: '100%', borderRadius: 12, maxHeight: 460, objectFit: 'cover' }}
            />
          </div>

          <div>
            <p className="muted" style={{ marginTop: 0 }}>
              {artwork.artist.name}
            </p>
            <h1 style={{ marginBottom: 12 }}>{artwork.title}</h1>
            <p style={{ lineHeight: 1.55 }}>{artwork.description || 'Đang cập nhật mô tả tác phẩm.'}</p>
            <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              {formatCurrency(artwork.price, artwork.currency)}
            </p>
            {typeof availableQty === 'number' ? (
              <p style={{ marginTop: 0, color: canBuy ? '#0f766e' : '#dc2626', fontWeight: 600 }}>
                {canBuy ? `Còn hàng (${availableQty})` : 'Tạm hết hàng'}
              </p>
            ) : null}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" disabled={!canBuy || adding} onClick={handleAddToCart}>
                {adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
              </button>
              <Link className="btn btn-ghost" href="/cart">
                Xem giỏ hàng
              </Link>
            </div>

            {message ? (
              <p className={message.includes('Da') ? 'muted' : 'error-text'} style={{ marginTop: 10 }}>
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </PageShell>
  );
}
