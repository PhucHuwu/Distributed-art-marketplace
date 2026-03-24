import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import { createOrderRouter } from '../src/routes/orders.route';
import { signAuthToken } from '../src/utils/jwt';

function createTestApp() {
  const app = express();
  app.use(express.json());

  const published: Array<{ routingKey: string; eventType: string }> = [];

  app.use(
    createOrderRouter({
      jwtSecret: 'test-secret',
      serviceName: 'order-service',
      publishEvent: async (routingKey, event) => {
        published.push({ routingKey, eventType: event.eventType });
      },
      deps: {
        getOrCreateActiveCart: async () => ({
          id: 'cart-1',
          userId: '00000000-0000-0000-0000-000000000001',
          status: 'ACTIVE',
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
          items: [],
        }),
        addCartItem: async () => ({
          id: 'cart-1',
          userId: '00000000-0000-0000-0000-000000000001',
          status: 'ACTIVE',
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
          items: [
            {
              id: 'item-1',
              cartId: 'cart-1',
              artworkId: '11111111-1111-1111-1111-111111111111',
              qty: 1,
              unitPrice: { toString: () => '1000000.00' },
              createdAt: new Date('2026-03-24T10:00:00.000Z'),
              updatedAt: new Date('2026-03-24T10:00:00.000Z'),
            } as never,
          ],
        }),
        updateCartItem: async () => ({
          id: 'cart-1',
          userId: '00000000-0000-0000-0000-000000000001',
          status: 'ACTIVE',
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
          items: [],
        }),
        removeCartItem: async () => ({
          id: 'cart-1',
          userId: '00000000-0000-0000-0000-000000000001',
          status: 'ACTIVE',
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
          items: [],
        }),
        createOrderFromCart: async () => ({
          id: 'order-1',
          userId: '00000000-0000-0000-0000-000000000001',
          status: 'PENDING',
          totalAmount: { toString: () => '1000000.00' },
          currency: 'VND',
          shippingAddressSnapshot: { city: 'HCM' },
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
          items: [
            {
              id: 'oi-1',
              orderId: 'order-1',
              artworkId: '11111111-1111-1111-1111-111111111111',
              qty: 1,
              unitPrice: { toString: () => '1000000.00' },
              createdAt: new Date('2026-03-24T10:00:00.000Z'),
            } as never,
          ],
        }),
        getOrderByIdForUser: async (_userId, orderId) => ({
          id: orderId,
          userId: '00000000-0000-0000-0000-000000000001',
          status: 'PENDING',
          totalAmount: { toString: () => '1000000.00' },
          currency: 'VND',
          shippingAddressSnapshot: { city: 'HCM' },
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
          items: [],
        }),
        getOrdersForUser: async () => [],
      },
    }),
  );

  return { app, published };
}

function createBearerToken() {
  const token = signAuthToken(
    {
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      role: 'USER',
    },
    'test-secret',
    '1h',
  );

  return `Bearer ${token}`;
}

test('GET /orders/cart returns active cart', async () => {
  const { app } = createTestApp();
  const response = await request(app).get('/orders/cart').set('Authorization', createBearerToken());

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.id, 'cart-1');
});

test('POST /orders publishes order.created event', async () => {
  const { app, published } = createTestApp();

  const response = await request(app)
    .post('/orders')
    .set('Authorization', createBearerToken())
    .set('x-correlation-id', 'corr-1')
    .send({
      shippingAddress: {
        city: 'HCM',
      },
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(published.length, 1);
  assert.equal(published[0].routingKey, 'order.created');
  assert.equal(published[0].eventType, 'order.created');
});
