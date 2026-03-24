import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import { createAuthRouter } from '../src/routes/auth.route';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(
    createAuthRouter({
      jwtSecret: 'test-secret',
      jwtExpiresIn: '1h',
      bcryptRounds: 10,
      deps: {
        createCredential: async ({ email }) => ({
          id: 'cred-1',
          userId: '00000000-0000-0000-0000-000000000001',
          email: email.toLowerCase(),
          passwordHash: 'hashed-password',
          role: 'USER',
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
          updatedAt: new Date('2026-03-24T10:00:00.000Z'),
        }),
        findCredentialByEmail: async (email) => {
          if (email.toLowerCase() === 'exists@example.com') {
            return {
              id: 'cred-2',
              userId: '00000000-0000-0000-0000-000000000002',
              email: 'exists@example.com',
              passwordHash: 'hashed-password',
              role: 'USER',
              createdAt: new Date('2026-03-24T10:00:00.000Z'),
              updatedAt: new Date('2026-03-24T10:00:00.000Z'),
            };
          }

          return null;
        },
        hashPassword: async () => 'hashed-password',
        comparePassword: async (password) => password === 'correct-password',
        signAuthToken: () => 'signed-jwt-token',
      },
    }),
  );

  return app;
}

test('POST /auth/register returns token for valid payload', async () => {
  const app = createTestApp();

  const response = await request(app).post('/auth/register').send({
    email: 'new@example.com',
    password: 'correct-password',
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.token, 'signed-jwt-token');
});

test('POST /auth/login returns 401 for invalid credentials', async () => {
  const app = createTestApp();

  const response = await request(app).post('/auth/login').send({
    email: 'exists@example.com',
    password: 'wrong-password',
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
});

test('POST /auth/login returns 401 when user not found', async () => {
  const app = createTestApp();

  const response = await request(app).post('/auth/login').send({
    email: 'missing@example.com',
    password: 'correct-password',
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
});

test('GET /auth/verify returns 401 for invalid token', async () => {
  const app = createTestApp();

  const response = await request(app)
    .get('/auth/verify')
    .set('Authorization', 'Bearer invalid-token');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'INVALID_TOKEN');
});
