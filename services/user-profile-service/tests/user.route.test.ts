import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createUserRouterWithDeps } from '../src/routes/user.route';

const secret = 'user-profile-test-secret';

function createToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      email: `${userId}@example.com`,
      role: 'USER',
    },
    secret,
    { expiresIn: '1h' },
  );
}

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(
    createUserRouterWithDeps(secret, {
      getOrCreateProfile: async (userId: string) => ({
        id: 'profile-1',
        userId,
        fullName: 'Test User',
        phoneNumber: '0900000000',
        avatarUrl: null,
        createdAt: new Date('2026-03-24T10:00:00.000Z'),
        updatedAt: new Date('2026-03-24T10:00:00.000Z'),
      }),
      updateProfile: async (userId: string, data) => ({
        id: 'profile-1',
        userId,
        fullName: data.fullName || 'Updated User',
        phoneNumber: data.phoneNumber || '0911111111',
        avatarUrl: data.avatarUrl || null,
        createdAt: new Date('2026-03-24T10:00:00.000Z'),
        updatedAt: new Date('2026-03-24T10:05:00.000Z'),
      }),
      listAddresses: async (userId: string) => [
        {
          id: 'address-1',
          userId,
          profileId: 'profile-1',
          recipient: 'Test User',
          phoneNumber: '0900000000',
          line1: '123 Street',
          line2: null,
          ward: 'Ward 1',
          district: 'District 1',
          city: 'Ho Chi Minh',
          postalCode: null,
          isDefault: true,
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
        },
      ],
      createAddress: async (userId: string, input) => ({
        id: 'address-2',
        userId,
        profileId: 'profile-1',
        recipient: input.recipient,
        phoneNumber: input.phoneNumber,
        line1: input.line1,
        line2: input.line2 || null,
        ward: input.ward,
        district: input.district,
        city: input.city,
        postalCode: input.postalCode || null,
        isDefault: Boolean(input.isDefault),
        createdAt: new Date('2026-03-24T10:10:00.000Z'),
        updatedAt: new Date('2026-03-24T10:10:00.000Z'),
      }),
      updateAddress: async (userId: string, addressId: string) => {
        if (addressId === 'missing') {
          return null;
        }

        return {
          id: addressId,
          userId,
          profileId: 'profile-1',
          recipient: 'Updated Recipient',
          phoneNumber: '0900000000',
          line1: '123 Street',
          line2: null,
          ward: 'Ward 1',
          district: 'District 1',
          city: 'Ho Chi Minh',
          postalCode: null,
          isDefault: false,
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:15:00.000Z'),
        };
      },
      deleteAddress: async (_userId: string, addressId: string) => addressId !== 'missing',
    }),
  );

  return app;
}

test('GET /users/me returns profile when token valid', async () => {
  const app = createTestApp();
  const token = createToken('00000000-0000-0000-0000-000000000010');

  const response = await request(app).get('/users/me').set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.userId, '00000000-0000-0000-0000-000000000010');
});

test('POST /users/me/addresses returns 400 when required fields missing', async () => {
  const app = createTestApp();
  const token = createToken('00000000-0000-0000-0000-000000000010');

  const response = await request(app)
    .post('/users/me/addresses')
    .set('Authorization', `Bearer ${token}`)
    .send({ city: 'Ho Chi Minh' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('DELETE /users/me/addresses/:id returns 404 for missing address', async () => {
  const app = createTestApp();
  const token = createToken('00000000-0000-0000-0000-000000000010');

  const response = await request(app)
    .delete('/users/me/addresses/missing')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'NOT_FOUND');
});
