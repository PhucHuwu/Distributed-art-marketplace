'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { catalogApi, type CatalogParams } from '@/lib/api';
import type { CatalogArtwork, CatalogArtist, CatalogCategory } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui-states';
import { ArtworkCard } from '@/components/artwork-card';

const LIMIT = 12;

export default function CatalogPage() {
  const [artworks, setArtworks] = useState<CatalogArtwork[]>([]);
  const [artists, setArtists] = useState<CatalogArtist[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(
    null,
  );

  // Filters
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, selectedArtist, selectedCategory, minPrice, maxPrice]);

  // Load filter options
  useEffect(() => {
    catalogApi
      .listArtists()
      .then(setArtists)
      .catch(() => {});
    catalogApi
      .listCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const loadArtworks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: CatalogParams = { page, limit: LIMIT };
    if (debouncedQ) params.q = debouncedQ;
    if (selectedArtist) params.artist = selectedArtist;
    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    try {
      const result = await catalogApi.listArtworks(params);
      setArtworks(result.items);
      setMeta(result.meta);
    } catch (err) {
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Failed to load artworks.' });
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, selectedArtist, selectedCategory, minPrice, maxPrice]);

  useEffect(() => {
    loadArtworks();
  }, [loadArtworks]);

  const clearFilters = () => {
    setQ('');
    setSelectedArtist('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  const hasFilters = debouncedQ || selectedArtist || selectedCategory || minPrice || maxPrice;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary/30">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl fade-in">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Curated Collection
            </p>
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground leading-[1.1] text-balance">
              Discover Extraordinary Art
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Explore our carefully curated selection of exceptional artworks from visionary artists
              around the world.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="group text-base px-8 h-12"
                onClick={() =>
                  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Explore Collection
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">The Gallery</p>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
              Featured Artworks
            </h2>
          </div>

          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search artworks..."
                className="pl-9 w-full sm:w-64 bg-background"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
              className="shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {hasFilters && <span className="ml-2 w-2 h-2 bg-accent rounded-full" />}
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="shrink-0">
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        <div
          className={`overflow-hidden transition-all duration-500 ${
            showFilters ? 'max-h-[300px] opacity-100 mb-10' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-card border border-border rounded-lg p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Artist
              </label>
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                <option value="">All artists</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Min price
              </label>
              <Input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Max price
              </label>
              <Input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="py-20">
            <ErrorState
              message={error.message}
              correlationId={error.correlationId}
              onRetry={loadArtworks}
            />
          </div>
        ) : artworks.length === 0 ? (
          <div className="py-20">
            <EmptyState
              title="No artworks found"
              description="Try adjusting your search or filters to discover more pieces."
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 stagger-children">
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-10 h-10 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                          page === pageNum ? 'bg-foreground text-background' : 'hover:bg-secondary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {meta.totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <button
                        onClick={() => setPage(meta.totalPages)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                          page === meta.totalPages
                            ? 'bg-foreground text-background'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        {meta.totalPages}
                      </button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-10 h-10 rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Call to action section */}
      <section className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">
              Start Your Art Collection Today
            </h2>
            <p className="text-background/70 text-lg mb-8">
              Join thousands of collectors who have discovered extraordinary pieces through our
              curated marketplace.
            </p>
            <Link href="/auth/register">
              <Button
                variant="secondary"
                size="lg"
                className="text-base px-8 h-12 bg-background text-foreground hover:bg-background/90"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
