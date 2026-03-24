import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { adminAuth } from '../src/middlewares/admin-auth';
import { errorHandler } from '../src/middlewares/error-handler';
import { createCatalogRouter } from '../src/routes/catalog.route';
import { HttpError } from '../src/utils/http-error';

const jwtSecret = 'test-secret';

function createTestApp() {
  const artworkShape = {
    slug: 'artwork-slug',
    title: 'Artwork',
    description: 'desc',
    price: 100,
    currency: 'VND',
    artist: { id: 'artist-1', slug: 'artist-1', name: 'Artist One' },
    categories: [{ id: 'cat-1', slug: 'landscape', name: 'Landscape' }],
    images: [{ url: 'https://example.com/a.jpg', altText: 'img', position: 0 }],
    createdAt: '2026-03-24T10:00:00.000Z',
    updatedAt: '2026-03-24T10:00:00.000Z',
  };

  const app = express();
  app.use(express.json());
  app.use(adminAuth(jwtSecret));

  app.use(
    createCatalogRouter({
      listArtworks: async (query) => ({
        items: [
          {
            id: 'artwork-1',
            slug: 'sunset-hanoi',
            title: 'Sunset Hanoi',
            description: 'desc',
            price: 100,
            currency: 'VND',
            artist: { id: 'artist-1', slug: 'artist-1', name: 'Artist One' },
            categories: [{ id: 'cat-1', slug: 'landscape', name: 'Landscape' }],
            images: [{ url: 'https://example.com/a.jpg', altText: 'img', position: 0 }],
            createdAt: '2026-03-24T10:00:00.000Z',
            updatedAt: '2026-03-24T10:00:00.000Z',
          },
        ],
        meta: {
          page: Number(query.page || '1'),
          limit: Number(query.limit || '20'),
          total: 1,
          totalPages: 1,
          filters: {
            artist: query.artist || null,
            category: query.category || null,
            minPrice: query.minPrice ? Number(query.minPrice) : null,
            maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
            q: query.q || null,
          },
        },
      }),
      getArtworkByIdOrSlug: async (idOrSlug) => {
        if (idOrSlug === 'missing') {
          return null;
        }

        return {
          id: 'artwork-1',
          slug: idOrSlug,
          title: 'Sunset Hanoi',
          description: 'desc',
          price: 100,
          currency: 'VND',
          artist: { id: 'artist-1', slug: 'artist-1', name: 'Artist One' },
          categories: [{ id: 'cat-1', slug: 'landscape', name: 'Landscape' }],
          images: [{ url: 'https://example.com/a.jpg', altText: 'img', position: 0 }],
          createdAt: '2026-03-24T10:00:00.000Z',
          updatedAt: '2026-03-24T10:00:00.000Z',
        };
      },
      listArtists: async () => [
        { id: 'artist-1', slug: 'artist-1', name: 'Artist One', bio: 'bio', artworkCount: 4 },
      ],
      listCategories: async () => [
        { id: 'cat-1', slug: 'landscape', name: 'Landscape', description: 'desc' },
      ],
      createArtwork: async () => ({ id: 'new', ...artworkShape }),
      updateArtwork: async (id, body) => {
        if (id === 'missing') {
          throw new HttpError(404, 'NOT_FOUND', 'Artwork not found');
        }

        return { id, ...artworkShape, ...(body as Record<string, unknown>) };
      },
      createArtist: async (body) => ({
        id: 'artist-new',
        slug: String((body as Record<string, unknown>).slug || 'artist-new'),
        name: String((body as Record<string, unknown>).name || 'Artist New'),
        bio: null,
      }),
      updateArtist: async (id, body) => {
        if (id === 'missing') {
          throw new HttpError(404, 'NOT_FOUND', 'Artist not found');
        }

        return {
          id,
          slug: String((body as Record<string, unknown>).slug || 'artist-1'),
          name: String((body as Record<string, unknown>).name || 'Artist One'),
          bio: null,
        };
      },
      createCategory: async (body) => ({
        id: 'cat-new',
        slug: String((body as Record<string, unknown>).slug || 'category-new'),
        name: String((body as Record<string, unknown>).name || 'Category New'),
        description: null,
      }),
      updateCategory: async (id, body) => {
        if (id === 'missing') {
          throw new HttpError(404, 'NOT_FOUND', 'Category not found');
        }

        return {
          id,
          slug: String((body as Record<string, unknown>).slug || 'cat-1'),
          name: String((body as Record<string, unknown>).name || 'Landscape'),
          description: null,
        };
      },
    }),
  );

  app.use(errorHandler);

  return app;
}

test('GET /catalog/artworks returns pagination and filters', async () => {
  const app = createTestApp();
  const response = await request(app)
    .get('/catalog/artworks')
    .query({ page: 2, limit: 10, artist: 'artist-1', q: 'sunset' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.meta.page, 2);
  assert.equal(response.body.meta.limit, 10);
  assert.equal(response.body.meta.filters.artist, 'artist-1');
  assert.equal(response.body.meta.filters.q, 'sunset');
});

test('GET /catalog/artworks/:idOrSlug returns detail and 404 when missing', async () => {
  const app = createTestApp();

  const ok = await request(app).get('/catalog/artworks/sunset-hanoi');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.success, true);
  assert.equal(ok.body.data.slug, 'sunset-hanoi');

  const missing = await request(app).get('/catalog/artworks/missing');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.success, false);
  assert.equal(missing.body.error.code, 'NOT_FOUND');
});

test('GET /catalog/categories returns data', async () => {
  const app = createTestApp();
  const response = await request(app).get('/catalog/categories');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data[0].slug, 'landscape');
});

test('POST /catalog/artworks enforces admin auth', async () => {
  const app = createTestApp();
  const payload = {
    title: 'x',
    slug: 'x',
    artistId: 'artist-1',
    categoryIds: ['cat-1'],
    images: [{ url: 'https://example.com/x.jpg', position: 0 }],
    price: 100,
  };

  const withoutToken = await request(app).post('/catalog/artworks').send(payload);
  assert.equal(withoutToken.status, 401);

  const userToken = jwt.sign({ role: 'USER' }, jwtSecret);
  const withUserToken = await request(app)
    .post('/catalog/artworks')
    .set('Authorization', `Bearer ${userToken}`)
    .send(payload);
  assert.equal(withUserToken.status, 403);

  const adminToken = jwt.sign({ role: 'ADMIN' }, jwtSecret);
  const withAdminToken = await request(app)
    .post('/catalog/artworks')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(payload);
  assert.equal(withAdminToken.status, 201);
  assert.equal(withAdminToken.body.success, true);
});

test('PUT /catalog/artworks/:id supports update and missing case', async () => {
  const app = createTestApp();
  const adminToken = jwt.sign({ role: 'ADMIN' }, jwtSecret);

  const updated = await request(app)
    .put('/catalog/artworks/artwork-1')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Updated', slug: 'updated' });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.id, 'artwork-1');

  const missing = await request(app)
    .put('/catalog/artworks/missing')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Updated', slug: 'updated' });

  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'NOT_FOUND');
});

test('artist/category admin CRUD endpoints enforce auth and return expected result', async () => {
  const app = createTestApp();
  const adminToken = jwt.sign({ role: 'ADMIN' }, jwtSecret);

  const artistWithoutAuth = await request(app)
    .post('/catalog/artists')
    .send({ name: 'A', slug: 'a' });
  assert.equal(artistWithoutAuth.status, 401);

  const artistCreate = await request(app)
    .post('/catalog/artists')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'A', slug: 'a' });
  assert.equal(artistCreate.status, 201);

  const artistUpdate = await request(app)
    .put('/catalog/artists/artist-1')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'B', slug: 'b' });
  assert.equal(artistUpdate.status, 200);

  const categoryCreate = await request(app)
    .post('/catalog/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'C', slug: 'c' });
  assert.equal(categoryCreate.status, 201);

  const categoryUpdate = await request(app)
    .put('/catalog/categories/cat-1')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'D', slug: 'd' });
  assert.equal(categoryUpdate.status, 200);
});
