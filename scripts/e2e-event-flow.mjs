import { createHmac, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function loadDotEnvFallback() {
  if (process.env.JWT_SECRET) {
    return;
  }

  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const rawValue = trimmed.slice(equalIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    process.env[key] = unquoted;
  }
}

loadDotEnvFallback();

const baseUrl = process.env.BASE_URL || 'http://localhost';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  process.stderr.write('JWT_SECRET is required to run e2e event-flow tests.\n');
  process.exit(1);
}

const pollIntervalMs = Number(process.env.E2E_POLL_INTERVAL_MS || 1000);
const pollTimeoutMs = Number(process.env.E2E_POLL_TIMEOUT_MS || 45000);

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwtHS256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${headerEncoded}.${payloadEncoded}`;
  const signature = createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsigned}.${signature}`;
}

async function requestJson(method, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    status: response.status,
    ok: response.ok,
    body,
    headers: response.headers,
  };
}

function assertCondition(condition, message, details) {
  if (condition) {
    return;
  }

  const detailText = details ? `\n${JSON.stringify(details, null, 2)}` : '';
  throw new Error(`${message}${detailText}`);
}

async function registerUserAndGetToken() {
  const email = `e2e.${Date.now()}@local.dev`;
  const password = 'E2eFlow@123456';
  const register = await requestJson('POST', '/api/auth/auth/register', {
    body: { email, password },
  });

  assertCondition(register.status === 201, 'Register user failed', register.body);
  assertCondition(register.body?.data?.token, 'Register response missing token', register.body);

  return {
    token: register.body.data.token,
    email,
  };
}

async function getUserIdentity(userToken) {
  const verify = await requestJson('GET', '/api/auth/auth/verify', {
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });

  assertCondition(verify.status === 200, 'Verify token failed', verify.body);
  assertCondition(verify.body?.data?.userId, 'Verify response missing userId', verify.body);

  return {
    userId: verify.body.data.userId,
    email: verify.body.data.email,
  };
}

async function adjustStockAsAdmin(adminToken, artworkId, deltaQty, reason) {
  const response = await requestJson('POST', '/api/inventory/inventory/adjust', {
    headers: {
      authorization: `Bearer ${adminToken}`,
    },
    body: {
      artworkId,
      deltaQty,
      reason,
    },
  });

  assertCondition(response.status === 200, 'Inventory adjust failed', response.body);
}

async function createOrderForArtwork(userToken, artworkId, quantity, unitPrice, correlationId) {
  const addItem = await requestJson('POST', '/api/orders/orders/cart/items', {
    headers: {
      authorization: `Bearer ${userToken}`,
      'x-correlation-id': correlationId,
    },
    body: {
      artworkId,
      quantity,
      unitPrice,
    },
  });

  assertCondition(addItem.status === 201, 'Add cart item failed', addItem.body);

  const createOrder = await requestJson('POST', '/api/orders/orders', {
    headers: {
      authorization: `Bearer ${userToken}`,
      'x-correlation-id': correlationId,
    },
    body: {
      shippingAddress: {
        city: 'HCM',
        district: 'District 1',
        line1: '123 Test Street',
      },
    },
  });

  assertCondition(createOrder.status === 201, 'Create order failed', createOrder.body);
  assertCondition(createOrder.body?.data?.id, 'Create order response missing id', createOrder.body);

  return createOrder.body.data.id;
}

async function getOrder(userToken, orderId) {
  const response = await requestJson('GET', `/api/orders/orders/${orderId}`, {
    headers: {
      authorization: `Bearer ${userToken}`,
    },
  });

  assertCondition(response.status === 200, 'Get order failed', response.body);
  return response.body.data;
}

async function waitForOrderStatus(userToken, orderId, expectedStatus, label) {
  const started = Date.now();
  let lastStatus = 'UNKNOWN';

  while (Date.now() - started < pollTimeoutMs) {
    const order = await getOrder(userToken, orderId);
    lastStatus = String(order.status || 'UNKNOWN');
    if (lastStatus === expectedStatus) {
      process.stdout.write(`PASS ${label}: ${orderId} -> ${expectedStatus}\n`);
      return order;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `Timeout waiting for status ${expectedStatus} on order ${orderId}. Last status: ${lastStatus}`,
  );
}

async function createPayment(userToken, orderId, amount, processingResult, correlationId) {
  const response = await requestJson('POST', '/api/payments/payments', {
    headers: {
      authorization: `Bearer ${userToken}`,
      'x-correlation-id': correlationId,
    },
    body: {
      orderId,
      amount,
      currency: 'VND',
      provider: 'E2E_MOCK_PROVIDER',
      processingResult,
      failureCode: processingResult === 'FAILED' ? 'CARD_DECLINED' : undefined,
      failureMessage: processingResult === 'FAILED' ? 'Card declined in E2E simulation' : undefined,
    },
  });

  assertCondition(response.status === 201, 'Create payment failed', response.body);
  return response.body.data;
}

async function run() {
  process.stdout.write('Starting E2E event-flow test...\n');

  const { token: userToken } = await registerUserAndGetToken();
  const identity = await getUserIdentity(userToken);

  const adminToken = signJwtHS256(
    {
      userId: randomUUID(),
      email: 'e2e-admin@local.dev',
      role: 'ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    jwtSecret,
  );

  process.stdout.write(`Using test user: ${identity.userId}\n`);

  const successArtworkId = '11111111-1111-1111-1111-111111111111';
  const paymentFailedArtworkId = '22222222-2222-2222-2222-222222222222';
  const insufficientArtworkId = '33333333-3333-3333-3333-333333333333';

  await adjustStockAsAdmin(adminToken, successArtworkId, 5, 'e2e setup success flow stock');
  await adjustStockAsAdmin(adminToken, paymentFailedArtworkId, 5, 'e2e setup payment-failed flow stock');

  const failedByInventoryOrderId = await createOrderForArtwork(
    userToken,
    insufficientArtworkId,
    1,
    1000000,
    `corr-e2e-inventory-failed-${Date.now()}`,
  );
  await waitForOrderStatus(userToken, failedByInventoryOrderId, 'FAILED', 'inventory.failed flow');

  const successOrderId = await createOrderForArtwork(
    userToken,
    successArtworkId,
    1,
    2000000,
    `corr-e2e-payment-success-${Date.now()}`,
  );
  await waitForOrderStatus(userToken, successOrderId, 'AWAITING_PAYMENT', 'inventory.reserved flow');
  await createPayment(userToken, successOrderId, 2000000, 'SUCCESS', `corr-e2e-payment-success-${Date.now()}`);
  await waitForOrderStatus(userToken, successOrderId, 'COMPLETED', 'payment.success flow');

  const paymentFailedOrderId = await createOrderForArtwork(
    userToken,
    paymentFailedArtworkId,
    1,
    3000000,
    `corr-e2e-payment-failed-${Date.now()}`,
  );
  await waitForOrderStatus(userToken, paymentFailedOrderId, 'AWAITING_PAYMENT', 'inventory.reserved flow #2');
  await createPayment(
    userToken,
    paymentFailedOrderId,
    3000000,
    'FAILED',
    `corr-e2e-payment-failed-${Date.now()}`,
  );
  await waitForOrderStatus(userToken, paymentFailedOrderId, 'FAILED', 'payment.failed flow');

  process.stdout.write('E2E event-flow test passed.\n');
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
