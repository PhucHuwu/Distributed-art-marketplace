import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogApi } from '../lib/api';
import { http } from '../lib/http';

test('catalogApi.listArtworks maps description/images/categories and meta defaults', async () => {
  const originalGetWithMeta = http.getWithMeta;

  (http as unknown as { getWithMeta: typeof http.getWithMeta }).getWithMeta = async () => ({
    data: [
      {
        id: 'artwork-1',
        slug: 'sunset',
        title: 'Sunset',
        description: undefined,
        price: 100,
        currency: 'VND',
        artist: { id: 'a1', slug: 'artist-1', name: 'Artist 1' },
        categories: undefined,
        images: undefined,
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T00:00:00.000Z',
      },
    ],
    meta: undefined,
  });

  try {
    const result = await catalogApi.listArtworks({ page: 3, limit: 5 });
    assert.equal(result.items[0].description, null);
    assert.deepEqual(result.items[0].images, []);
    assert.deepEqual(result.items[0].categories, []);
    assert.deepEqual(result.meta, { page: 3, limit: 5, total: 1, totalPages: 1 });
  } finally {
    (http as unknown as { getWithMeta: typeof http.getWithMeta }).getWithMeta = originalGetWithMeta;
  }
});

test('catalogApi.getArtwork falls back to list + id lookup on 5xx error', async () => {
  const originalGet = http.get;
  const originalGetWithMeta = http.getWithMeta;

  let getCallCount = 0;
  (http as unknown as { get: typeof http.get }).get = async (path: string) => {
    getCallCount += 1;

    if (path.includes('/catalog/artworks/target-slug')) {
      throw {
        code: 'INTERNAL_ERROR',
        message: 'boom',
        status: 500,
        details: [],
        correlationId: 'corr-1',
      };
    }

    return {
      id: 'artwork-123',
      slug: 'target-slug',
      title: 'Recovered Artwork',
      description: null,
      price: 100,
      currency: 'VND',
      artist: { id: 'a1', slug: 'artist-1', name: 'Artist 1' },
      categories: [],
      images: [],
      createdAt: '2026-03-25T00:00:00.000Z',
      updatedAt: '2026-03-25T00:00:00.000Z',
    };
  };

  (http as unknown as { getWithMeta: typeof http.getWithMeta }).getWithMeta = async () => ({
    data: [
      {
        id: 'artwork-123',
        slug: 'target-slug',
        title: 'Recovered Artwork',
        description: null,
        price: 100,
        currency: 'VND',
        artist: { id: 'a1', slug: 'artist-1', name: 'Artist 1' },
        categories: [],
        images: [],
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T00:00:00.000Z',
      },
    ],
    meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
  });

  try {
    const result = await catalogApi.getArtwork('target-slug');
    assert.equal(result.id, 'artwork-123');
    assert.equal(getCallCount, 2);
  } finally {
    (http as unknown as { get: typeof http.get }).get = originalGet;
    (http as unknown as { getWithMeta: typeof http.getWithMeta }).getWithMeta = originalGetWithMeta;
  }
});
