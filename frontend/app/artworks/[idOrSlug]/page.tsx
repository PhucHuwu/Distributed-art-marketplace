'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Minus, Plus, ArrowLeft, Heart, Share2, Check } from 'lucide-react';
import { catalogApi, inventoryApi, cartApi } from '@/lib/api';
import type { CatalogArtwork, InventoryStatus } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, ErrorState, InlineError } from '@/components/ui-states';

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price);
}

export default function ArtworkDetailPage() {
  const params = useParams();
  const idOrSlug = params.idOrSlug as string;
  const router = useRouter();
  const { user } = useAuth();

  const [artwork, setArtwork] = useState<CatalogArtwork | null>(null);
  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(
    null,
  );

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState<{
    message: string;
    correlationId?: string | null;
  } | null>(null);
  const [cartSuccess, setCartSuccess] = useState(false);

  const loadArtwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const art = await catalogApi.getArtwork(idOrSlug);
      setArtwork(art);
      inventoryApi
        .getStatus(art.id)
        .then(setInventory)
        .catch(() => {});
    } catch (err) {
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Không thể tải thông tin tác phẩm.' });
      }
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    loadArtwork();
  }, [loadArtwork]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/auth/login?next=/artworks/${idOrSlug}`);
      return;
    }
    if (!artwork) return;
    setAddingToCart(true);
    setCartError(null);
    setCartSuccess(false);
    try {
      await cartApi.addItem(artwork.id, quantity, artwork.price);
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) {
      if (isApiError(err)) {
        setCartError({ message: err.message, correlationId: err.correlationId });
      } else {
        setCartError({ message: 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.' });
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20">
        <ErrorState
          message={error.message}
          correlationId={error.correlationId}
          onRetry={loadArtwork}
        />
      </div>
    );
  }

  if (!artwork) return null;

  const available = inventory?.availableQty ?? null;
  const outOfStock = available !== null && available <= 0;
  const cover = artwork.images[0]?.url;
  const category = artwork.categories[0];

  return (
    <div className="min-h-screen">
      {/* Back navigation */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Quay về bộ sưu tập
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image - Gallery style presentation */}
          <div className="relative fade-in">
            <div className="sticky top-24">
              <div className="relative aspect-[4/5] gallery-frame bg-secondary">
                {cover ? (
                  <Image
                    src={cover}
                    alt={artwork.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Chưa có hình ảnh
                  </div>
                )}
              </div>

              {/* Action buttons below image */}
              <div className="flex items-center gap-3 mt-6">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-8 fade-in lg:py-8">
            {/* Category badge */}
            {category && (
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-medium">
                {category.name}
              </span>
            )}

            {/* Title and artist */}
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground leading-[1.15] text-balance">
                {artwork.title}
              </h1>
              {artwork.artist && (
                <p className="text-muted-foreground mt-4 text-lg">
                   bởi <span className="text-foreground font-medium">{artwork.artist.name}</span>
                </p>
              )}
            </div>

            {/* Price */}
            <div className="py-6 border-y border-border">
              <p className="text-3xl font-serif font-medium text-foreground">
                {formatPrice(artwork.price, artwork.currency)}
              </p>
              {inventory && (
                <p className="text-sm text-muted-foreground mt-2">
                  {outOfStock ? (
                     <span className="text-destructive font-medium">Hiện đã hết hàng</span>
                  ) : (
                     <span className="text-accent">Còn {available} sản phẩm</span>
                  )}
                </p>
              )}
            </div>

            {/* Description */}
            {artwork.description && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-3">
                   Giới thiệu tác phẩm
                </h3>
                <p className="text-foreground/80 leading-relaxed">{artwork.description}</p>
              </div>
            )}

            {/* Quantity selector */}
            {!outOfStock && (
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-foreground uppercase tracking-wide">
                   Số lượng
                </span>
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 hover:bg-secondary transition-colors"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-3 text-base font-medium min-w-[3rem] text-center text-foreground border-x border-border">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => (available ? Math.min(available, q + 1) : q + 1))
                    }
                    className="px-4 py-3 hover:bg-secondary transition-colors"
                      aria-label="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Cart feedback */}
            {cartError && (
              <InlineError message={cartError.message} correlationId={cartError.correlationId} />
            )}

            {cartSuccess && (
              <div className="flex items-center gap-3 rounded-md bg-accent/10 border border-accent/20 p-4 text-accent">
                <Check className="w-5 h-5" />
                 <span className="font-medium">Đã thêm vào giỏ hàng thành công!</span>
              </div>
            )}

            {/* Add to cart button */}
            <Button
              onClick={handleAddToCart}
              disabled={addingToCart || outOfStock}
              size="lg"
              className="w-full h-14 text-base tracking-wide btn-premium"
            >
              <ShoppingCart className="w-5 h-5 mr-3" />
              {outOfStock ? 'Hết hàng' : addingToCart ? 'Đang thêm vào giỏ...' : 'Thêm vào giỏ'}
            </Button>

            {/* Additional info */}
            <div className="pt-6 border-t border-border grid grid-cols-2 gap-6 text-sm">
              <div>
                 <p className="text-muted-foreground mb-1">Vận chuyển</p>
                 <p className="text-foreground font-medium">Miễn phí giao hàng toàn quốc</p>
              </div>
              <div>
                 <p className="text-muted-foreground mb-1">Đổi trả</p>
                 <p className="text-foreground font-medium">Chính sách đổi trả trong 14 ngày</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
