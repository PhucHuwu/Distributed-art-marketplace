'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Minus, Plus, X, ArrowRight, ShoppingBag } from 'lucide-react';
import { cartApi } from '@/lib/api';
import type { Cart } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { RouteGuard } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui-states';

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
}

function computeCartTotal(cart: Cart | null): number {
  if (!cart) {
    return 0;
  }

  return cart.items.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
}

function CartContent() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(
    null,
  );
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Failed to load cart.' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingItem(itemId);
    try {
      const updated = await cartApi.updateItem(itemId, newQty);
      setCart(updated);
    } catch {
      // silently revert; user can retry
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    setUpdatingItem(itemId);
    try {
      const updated = await cartApi.deleteItem(itemId);
      setCart(updated);
    } catch {
      // ignore
    } finally {
      setUpdatingItem(null);
    }
  };

  if (loading)
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );

  if (error)
    return (
      <div className="py-20">
        <ErrorState
          message={error.message}
          correlationId={error.correlationId}
          onRetry={loadCart}
        />
      </div>
    );

  const items = cart?.items ?? [];
  const currency = 'VND';
  const total = computeCartTotal(cart);

  if (items.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          title="Your cart is empty"
          description="Browse our collection and add artworks you love."
          action={
            <Link href="/">
              <Button size="lg" className="mt-4">
                Explore Collection
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* Items */}
      <div className="lg:col-span-2 fade-in">
        <div className="border-b border-border pb-4 mb-6 hidden md:grid md:grid-cols-12 text-xs uppercase tracking-wider text-muted-foreground font-medium">
          <div className="col-span-6">Product</div>
          <div className="col-span-2 text-center">Quantity</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const busy = updatingItem === item.id;
            return (
              <div
                key={item.id}
                className={`py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-opacity ${busy ? 'opacity-50' : ''}`}
              >
                {/* Product info */}
                <div className="md:col-span-6 flex gap-5">
                  <div className="relative w-24 h-28 shrink-0 gallery-frame bg-secondary">
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      Artwork
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-serif text-lg font-medium text-foreground line-clamp-2 leading-snug">
                      Artwork #{item.artworkId.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-muted-foreground md:hidden">
                      {formatPrice(Number(item.unitPrice), currency)}
                    </p>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors mt-auto w-fit disabled:opacity-40"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div className="md:col-span-2 flex justify-center">
                  <div className="inline-flex items-center border border-border">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={busy || item.quantity <= 1}
                      className="px-3 py-2 hover:bg-secondary disabled:opacity-40 transition-colors"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-foreground min-w-[2.5rem] text-center border-x border-border">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={busy}
                      className="px-3 py-2 hover:bg-secondary disabled:opacity-40 transition-colors"
                      aria-label="Increase"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="md:col-span-2 text-right hidden md:block">
                  <p className="text-foreground">{formatPrice(Number(item.unitPrice), currency)}</p>
                </div>

                {/* Total */}
                <div className="md:col-span-2 text-right">
                  <p className="font-medium text-foreground">
                    {formatPrice(Number(item.unitPrice) * item.quantity, currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1 fade-in">
        <div className="bg-secondary/50 p-8 sticky top-24">
          <h2 className="font-serif text-xl font-medium text-foreground mb-6">Order Summary</h2>

          <div className="flex flex-col gap-4 text-sm border-b border-border pb-6 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>
                Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
              <span className="text-foreground">{formatPrice(total, currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="text-accent">Free</span>
            </div>
          </div>

          <div className="flex justify-between font-medium text-lg mb-8">
            <span className="font-serif">Total</span>
            <span className="font-serif">{formatPrice(total, currency)}</span>
          </div>

          <Link href="/checkout">
            <Button className="w-full h-12 text-base tracking-wide btn-premium">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Checkout
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Taxes calculated at checkout
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">Your Selection</p>
          <h1 className="text-4xl font-serif font-medium text-foreground">Shopping Cart</h1>
        </div>
        <CartContent />
      </div>
    </RouteGuard>
  );
}
