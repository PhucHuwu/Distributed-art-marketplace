import test from 'node:test';
import assert from 'node:assert/strict';
import { PaymentStatus, Prisma } from '@prisma/client';
import {
  __testOnly__normalizeCurrency,
  __testOnly__normalizeProvider,
  __testOnly__sanitizeAmount,
  __testOnly__toEventPayload,
} from '../src/services/payment.service';

test('normalizeCurrency uppercases currency value', () => {
  assert.equal(__testOnly__normalizeCurrency(' vnd '), 'VND');
});

test('normalizeProvider trims provider value', () => {
  assert.equal(__testOnly__normalizeProvider('  mock-provider  '), 'mock-provider');
});

test('sanitizeAmount keeps two decimal scale', () => {
  const amount = __testOnly__sanitizeAmount(1000.456);
  assert.equal(amount.toFixed(2), '1000.46');
});

test('toEventPayload maps payment event data', () => {
  const payload = __testOnly__toEventPayload({
    paymentId: 'pay-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: new Prisma.Decimal('500000'),
    currency: 'VND',
    provider: 'mock-provider',
    status: PaymentStatus.SUCCESS,
    providerReference: 'provider-ref-1',
    failureCode: null,
    failureMessage: null,
  });

  assert.equal(payload.paymentId, 'pay-1');
  assert.equal(payload.orderId, 'order-1');
  assert.equal(payload.amount, '500000.00');
  assert.equal(payload.status, PaymentStatus.SUCCESS);
});
