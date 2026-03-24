import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { adminAuth } from '../src/middlewares/admin-auth';
import { errorHandler } from '../src/middlewares/error-handler';
import { createInventoryRouter } from '../src/routes/inventory.route';
import { HttpError } from '../src/utils/http-error';

const jwtSecret = 'test-secret';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(adminAuth(jwtSecret));

  app.use(
    createInventoryRouter({
      getInventoryByArtworkId: async (artworkId: string) => ({
        artworkId,
        onHandQty: 10,
        reservedQty: 3,
        availableQty: 7,
        updatedAt: '2026-03-24T10:00:00.000Z',
      }),
      adjustInventory: async () => ({
        artworkId: 'artwork-1',
        onHandQty: 20,
        reservedQty: 3,
        availableQty: 17,
        updatedAt: '2026-03-24T10:00:00.000Z',
      }),
      reserveInventory: async () => ({
        reservationId: 'order-order-1',
        orderId: 'order-1',
        status: 'RESERVED',
      }),
      releaseInventory: async (body: unknown) => {
        const value = body as Record<string, unknown>;
        if (value.reservationId === 'missing') {
          throw new HttpError(404, 'NOT_FOUND', 'Reservation not found');
        }

        return {
          reservationId: String(value.reservationId || ''),
          status: 'RELEASED',
        };
      },
    }),
  );

  app.use(errorHandler);
  return app;
}

test('GET /inventory/:artworkId returns stock snapshot', async () => {
  const app = createTestApp();

  const response = await request(app).get('/inventory/artwork-1');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.artworkId, 'artwork-1');
  assert.equal(response.body.data.availableQty, 7);
});

test('POST /inventory/adjust requires admin token', async () => {
  const app = createTestApp();

  const withoutToken = await request(app).post('/inventory/adjust').send({
    artworkId: 'artwork-1',
    deltaQty: 5,
  });

  assert.equal(withoutToken.status, 401);

  const userToken = jwt.sign({ role: 'USER' }, jwtSecret);
  const withUserToken = await request(app)
    .post('/inventory/adjust')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ artworkId: 'artwork-1', deltaQty: 5 });
  assert.equal(withUserToken.status, 403);

  const adminToken = jwt.sign({ role: 'ADMIN' }, jwtSecret);
  const withAdminToken = await request(app)
    .post('/inventory/adjust')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ artworkId: 'artwork-1', deltaQty: 5 });
  assert.equal(withAdminToken.status, 200);
  assert.equal(withAdminToken.body.success, true);
});

test('POST /inventory/reserve and /inventory/release flows', async () => {
  const app = createTestApp();
  const adminToken = jwt.sign({ role: 'ADMIN' }, jwtSecret);

  const reserve = await request(app)
    .post('/inventory/reserve')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ reservationId: 'order-order-1', orderId: 'order-1', items: [{ artworkId: 'a1', quantity: 1 }] });

  assert.equal(reserve.status, 200);
  assert.equal(reserve.body.data.status, 'RESERVED');

  const release = await request(app)
    .post('/inventory/release')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ reservationId: 'order-order-1' });

  assert.equal(release.status, 200);
  assert.equal(release.body.data.status, 'RELEASED');

  const missing = await request(app)
    .post('/inventory/release')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ reservationId: 'missing' });

  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'NOT_FOUND');
});
