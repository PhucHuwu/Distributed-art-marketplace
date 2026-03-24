import assert from 'node:assert/strict';
import test from 'node:test';
import { OrderStatus } from '@prisma/client';
import { resolveLifecycleTransition } from '../src/services/lifecycle-transition';

test('inventory.reserved transitions PENDING -> AWAITING_PAYMENT', () => {
  const result = resolveLifecycleTransition({
    currentStatus: OrderStatus.PENDING,
    eventType: 'inventory.reserved',
    payload: {},
  });

  assert.ok(result);
  assert.equal(result?.nextStatus, OrderStatus.AWAITING_PAYMENT);
  assert.equal(result?.publishEventType, undefined);
});

test('payment.success transitions AWAITING_PAYMENT -> COMPLETED and publishes order.completed', () => {
  const result = resolveLifecycleTransition({
    currentStatus: OrderStatus.AWAITING_PAYMENT,
    eventType: 'payment.success',
    payload: { paymentId: 'pay-1' },
  });

  assert.ok(result);
  assert.equal(result?.nextStatus, OrderStatus.COMPLETED);
  assert.equal(result?.publishEventType, 'order.completed');
});

test('payment.failed transitions AWAITING_PAYMENT -> FAILED and publishes order.failed', () => {
  const result = resolveLifecycleTransition({
    currentStatus: OrderStatus.AWAITING_PAYMENT,
    eventType: 'payment.failed',
    payload: { reason: 'card_declined' },
  });

  assert.ok(result);
  assert.equal(result?.nextStatus, OrderStatus.FAILED);
  assert.equal(result?.publishEventType, 'order.failed');
});
